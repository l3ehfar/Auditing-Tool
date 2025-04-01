<script lang="ts">
  import { writable, get, derived } from 'svelte/store';
  import { onMount } from 'svelte';
  import { notification } from '@marcellejs/core';
  import { goto } from '$app/navigation';
  import { startActivityTracking, stopActivityTracking } from './activity_check';
  import {
    addEvidence,
    cards,
    createHypothesis,
    removeEvidence,
    fetchHypotheses,
    updateHypothesis,
    type Hypothesis,
    removeHypothesis,
    saveCompleteHypotheses,
  } from './hypothesis_storage';
  import { isTimerFinished, timeLeft } from '$lib/marcelle/timer';
  import { base } from '$app/paths';
  import { page } from '$app/stores';

  export let userID: string | undefined;

  const isTutorial = derived(page, ($page) => $page.url.pathname.includes('/tutorial'));

  onMount(() => {
    const tutorialMode = get(isTutorial);
    fetchHypotheses(tutorialMode);
    // if (userID) {
    //   startActivityTracking(userID); // Pass userID to activity tracking
    // }

    if (userID) {
      sessionStorage.setItem('userID', userID); 
    }

    const unsubscribe = isTimerFinished.subscribe((finished) => {
      if (finished) {
        (async () => {
          await saveCompleteHypotheses();
          notification({
            title: 'Proceeding to Next Step',
            message: "You're moving to the next step. Please wait...",
            duration: 5000,
          });

          goto(`${base}/hypotheses-questionnaire`);
        })();
      }
    });

    let timerTriggered = false;
    let timerReminder = false;

    const unsubscribeTimer = timeLeft.subscribe(($timeLeft) => {
      if ($timeLeft === 600 && !timerTriggered) {
        timerTriggered = true;
        notifyUserOfMissingFields();
      }
    });

    const unsubscribeReminder = timeLeft.subscribe(($timeLeft) => {
      if ($timeLeft === 300 && !timerReminder) {
        timerReminder = true;
        notifyFiveMinutesLeft();
      }
    });

    return () => {
      if (userID) {
        stopActivityTracking(userID);
      }
      unsubscribeTimer();
      unsubscribe();
      unsubscribeReminder();
    };
  });

  function notifyFiveMinutesLeft() {
    notification({
      title: 'Time Reminder',
      message: 'Only 5 minutes remaining!',
      duration: 8000,
    });
  }

  function notifyUserOfMissingFields() {
    const $timeLeft = get(timeLeft);
    if ($timeLeft > 600) return;

    cards.update((currentCards) => {
      const updatedCards = currentCards.map((card) => ({
        ...card,
        missingFields: {
          description: !card.description.trim(),
          evidence: card.evidence.length === 0,
        },
      }));

      const missingFieldsMap = Object.fromEntries(
        updatedCards.map((card) => [card.id, card.missingFields]),
      );
      localStorage.setItem('missingFields', JSON.stringify(missingFieldsMap));

      return updatedCards;
    });

    const incompleteCards = get(cards).filter(
      (card) => card.missingFields?.description || card.missingFields?.evidence,
    );

    if (incompleteCards.length > 0) {
      notification({
        title: 'Missing Information',
        message:
          'You have 10 minutes. For each card you should describe the bias and have at least one example.',
        type: 'danger',
        duration: 8000,
      });
    } else {
      notification({
        title: 'Time Reminder',
        message: 'Only 10 minutes remaining!',
        duration: 5000,
      });
    }
  }

  async function onDrop(event: DragEvent, card: Hypothesis) {
    event.preventDefault();
    if (!event.dataTransfer) return;

    const rawData = event.dataTransfer.getData('text/plain');

    if (!rawData) {
      console.error('No data received during drop');
      return;
    }

    try {
      const data = JSON.parse(rawData);
      const { src, caption, instanceId } = data;
      // console.log('Dropped data:', data);

      let thumbnail = data.thumbnail || null;

      if (!thumbnail) {
        thumbnail = await generateThumbnailOnDrop(data.src);
      }
      const newCard = await addEvidence(card.id, thumbnail, data.caption, instanceId);
      // console.log('Updated card with new evidence:', newCard);
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  }

  async function generateThumbnailOnDrop(
    imageSrc: string,
    width: number = 200,
    height: number = 200,
  ): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageSrc;
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          console.error('Canvas context not available');
          resolve(imageSrc);
          return;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => {
        console.error('Error loading image for thumbnail.');
        resolve(imageSrc);
      };
    });
  }

  function allowDrop(event) {
    event.preventDefault();
  }

  let draggedItem = null;

  function handleDragStart(event, cardId, item) {
    draggedItem = { cardId, item };
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify(item));
  }

  function handleDropOnItem(event, cardId, targetItemId) {
    event.preventDefault();

    if (draggedItem && draggedItem.cardId === cardId) {
      cards.update((currentCards) =>
        currentCards.map((c) => {
          if (c.id === cardId) {
            const evidence = [...c.evidence];
            const draggedIndex = evidence.findIndex((i) => i.id === draggedItem.item.id);
            const targetIndex = evidence.findIndex((i) => i.id === targetItemId);

            const [movedItem] = evidence.splice(draggedIndex, 1);
            evidence.splice(targetIndex, 0, movedItem);

            return { ...c, evidence };
          }
          return c;
        }),
      );
    }

    draggedItem = null;
  }

  let confirmingRemoval = writable<string | null>(null);

  function confirmRemove(cardId: string) {
    confirmingRemoval.set(cardId);
  }

  function cancelRemove() {
    confirmingRemoval.set(null);
  }

  function handleRemove(cardId: string) {
    removeHypothesis(cardId);
    confirmingRemoval.set(null);
  }
</script>

<div class="marcelle-card">
  <div class="mx-auto w-full flex flex-col justify-center gap-4">
    {#each $cards as card (card.id)}
      <div class="card shadow-lg bg-base-100 p-4">
        <h2 class="text-sm my-2 mx-4">Bias {card.index}</h2>
        <div class="card-body">
          {#if $confirmingRemoval === card.id}
            <div class="flex gap-2 absolute top-2 right-2">
              <button class="btn btn-xs btn-error" on:click={() => handleRemove(card.id)}>
                Confirm Delete
              </button>
              <button class="btn btn-xs btn-outline" on:click={cancelRemove}> Cancel </button>
            </div>
          {:else}
            <button
              class="btn btn-xs btn-circle btn-error btn-outline absolute top-2 right-2"
              on:click={() => confirmRemove(card.id)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-3"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                />
              </svg>
            </button>
          {/if}

          <div class="description-tutorial">
            <h4 class="text-xs text-gray-500 font-medium" style="margin-bottom: 5px;">
              write Description:
            </h4>
            <textarea
              bind:value={card.description}
              class="textarea textarea-xs textarea-accent textarea-bordered w-full {card
                .missingFields?.description
                ? 'border-red-500 border-2'
                : ''}"
              placeholder="Describe the bias here"
              on:blur={() => updateHypothesis(card.id, { description: card.description })}
            />
          </div>
          <h4 class="text-xs text-gray-500 font-medium">drag and drop Supporting Examples:</h4>
          <div
            class="grid grid-cols-5 gap-2 p-4 border border-dashed evidence-area rounded-lg min-h-[100px] {card
              .missingFields?.evidence
              ? 'border-red-500 border-2'
              : 'border-gray-300'}"
            on:drop={(event) => onDrop(event, card)}
            on:dragover={(event) => allowDrop(event)}
          >
            {#each card.evidence as item (item.id || Math.random())}
              <div
                class="dropped-item p-1 bg-gray-100 border border-gray-300 rounded-md text-center relative"
                draggable={true}
                on:dragstart={(event) => handleDragStart(event, card.id, item)}
                on:drop={(event) => handleDropOnItem(event, card.id, item.id)}
                on:dragover={allowDrop}
              >
                <button
                  class="btn btn-xs btn-circle btn-error absolute top-0 right-0"
                  on:click={() => removeEvidence(card, item.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="size-3"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
                <img src={item.thumbnail} class="w-full h-auto mb-2 rounded" />
                <h3 class="text-xs text-gray-600">{item.caption}</h3>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/each}
    <div class="text-center">
      <button
        class="btn btn-sm btn-primary document-bias"
        on:click={() => createHypothesis($isTutorial)}
        disabled={$isTutorial && $cards.length >= 1}>Document New Bias</button
      >
    </div>
  </div>
</div>

<style>
  .marcelle-card {
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
  }

  .grid {
    background-color: oklch(var(--b2));
  }

  .card {
    position: relative;
    width: 100%;
    padding: 0 !important;
    box-sizing: border-box;
    min-height: 100px;
    box-shadow: 1px 1px 2px 1px rgba(0, 0, 0, 0.1);
  }

  img {
    max-height: 100px;
    object-fit: cover;
  }

  .textarea {
    border-radius: 8px;
  }

  .dropped-item {
    padding: 4px !important;
    background-color: #fff;
    border: 1px solid #e6e6e6;
    border-radius: 8px;
    cursor: grab;
    z-index: 1;
    box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.1);
  }

  .dropped-item h3 {
    font-size: 0.55rem;
    text-align: center;
  }

  .p-1 {
    padding: 0.35rem;
  }
</style>
