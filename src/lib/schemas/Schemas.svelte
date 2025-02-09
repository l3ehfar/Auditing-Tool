<script lang="ts">
  import { writable, get } from 'svelte/store';
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
  } from './hypothesis_storage';

  let overallTimeLeft = 1800;
  const timerDisplay = writable(overallTimeLeft);
  let isSubmitDisabled = true;
  let showSubmitButton = false;
  let isTimerFinished = false;

  // function checkIfSubmitEnabled() {
  //   const allCards = get(cards);
  //   isSubmitDisabled = allCards.some((card) =>
  //     Object.values(card.questionnaire)
  //       .slice(0, 3)
  //       .some((value) => !value.trim()),
  //   );

  //   if (!isSubmitDisabled && showSubmitButton) {
  //     notification({
  //       title: 'Ready to Submit',
  //       message: 'All questions have been answered. You can now submit.',
  //       duration: 3000,
  //     });
  //   }
  // }

  // cards.subscribe(() => {
  //   checkIfSubmitEnabled();
  // });

  onMount(() => {
    fetchHypotheses();

    // const savedTime = localStorage.getItem('schemasTimer');
    // overallTimeLeft = savedTime ? JSON.parse(savedTime) : overallTimeLeft;
    // timerDisplay.set(overallTimeLeft);

    // if (overallTimeLeft <= 0) {
    //   isTimerFinished = true;
    //   showSubmitButton = true;
    //   checkIfSubmitEnabled();
    // }

    // const timer = setInterval(() => {
    //   if (overallTimeLeft > 0) {
    //     overallTimeLeft -= 1;
    //     timerDisplay.set(overallTimeLeft);
    //     localStorage.setItem('schemasTimer', JSON.stringify(overallTimeLeft));

    //     if (overallTimeLeft === 600) {
    //       notification({
    //         title: 'Reminder',
    //         message: 'You have 10 minutes to organize and submit your hypotheses.',
    //         duration: 8000,
    //       });
    //     } else if (overallTimeLeft === 1500) {
    //       notification({
    //         title: 'Reminder',
    //         message: 'You must provide at least 2 hypotheses.',
    //         duration: 10000,
    //       });
    //     } else if (overallTimeLeft === 1200) {
    //       notification({
    //         title: 'Reminder',
    //         message: 'Have you tested your hypotheses?',
    //         duration: 8000,
    //       });
    //     } else if (overallTimeLeft === 900) {
    //       notification({
    //         title: 'Reminder',
    //         message: 'Have you enough examples to support your hypotheses?',
    //         duration: 8000,
    //       });
    //     }
    //   } else {
    //     clearInterval(timer);
    //     isTimerFinished = true;
    //     showSubmitButton = true;
    //     checkIfSubmitEnabled();

    //     cards.update((currentCards) =>
    //       currentCards.map((card) => ({
    //         ...card,
    //         showQuestionnaire: true,
    //       })),
    //     );

    //     if (isSubmitDisabled) {
    //       notification({
    //         title: 'Time’s up!',
    //         message: 'Please fill out the questionnaire in each card.',
    //         duration: 5000,
    //       });
    //     }

    //     saveCardsState();
    //   }
    // }, 1000);

    startActivityTracking();

    return () => {
      stopActivityTracking();
    };
  });

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
      console.log('data', data);
      const newCard = await addEvidence(card.id, data.src, data.caption);
      console.log('newCard', newCard);

      // cards.update((currentCards) => currentCards.map((c) => (c.id === card.id ? newCard : c)));
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
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

  function submitFinalResults() {
    if (isSubmitDisabled) return;

    const schemas = get(cards);

    const incompleteCards = schemas.filter((card) =>
      Object.values(card.questionnaire).some((value) => !value.trim()),
    );

    if (incompleteCards.length > 0) {
      notification({
        title: 'Incomplete Questionnaire',
        message: 'Please answer all questions in each card.',
        duration: 3000,
        type: 'danger',
      });
      return;
    }

    console.log('Submitted Results:', schemas);

    notification({
      title: 'Results Submitted',
      message: 'Your results have been successfully submitted.',
      duration: 3000,
    });

    goto('/post-questionnaire');
  }
</script>

<div class="marcelle-card">
  <div class="mx-auto w-full flex flex-col justify-center gap-4">
    {#each $cards as card (card.id)}
      <div class="card shadow-lg bg-base-100 p-4">
        <h2 class="text-sm my-2 mx-4">Bias {card.index}</h2>
        <div class="card-body">
          <button
            class="btn btn-xs btn-circle btn-error btn-outline absolute top-2 right-2"
            on:click={() => removeHypothesis(card.id)}
            disabled={isTimerFinished}
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

          <h4 class="text-xs text-gray-500 font-medium">write Description:</h4>
          <textarea
            bind:value={card.description}
            class="textarea textarea-xs textarea-accent textarea-bordered w-full"
            placeholder="Describe the bias here"
            on:input={() => updateHypothesis(card.id, { description: card.description })}
            disabled={isTimerFinished}
          ></textarea>

          <h4 class="text-xs text-gray-500 font-medium">drag and drop Supporting Examples:</h4>
          <div
            class="grid grid-cols-5 gap-2 p-4 border border-dashed border-gray-300 rounded-lg min-h-[100px]"
            class:disabled={isTimerFinished}
            on:drop={(event) => isTimerFinished || onDrop(event, card)}
            on:dragover={(event) => isTimerFinished || allowDrop(event)}
          >
            {#each card.evidence as item (item.id)}
              <div
                class="dropped-item p-1 bg-gray-100 border border-gray-300 rounded-md text-center relative"
                draggable={!isTimerFinished}
                on:dragstart={(event) => isTimerFinished || handleDragStart(event, card.id, item)}
                on:drop={(event) => handleDropOnItem(event, card.id, item.id)}
                on:dragover={allowDrop}
              >
                <button
                  class="btn btn-xs btn-circle btn-error absolute top-0 right-0"
                  on:click={() => removeEvidence(card, item.id)}
                  disabled={isTimerFinished}
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
                <img src={item.src} class="w-full h-auto mb-2 rounded" />
                <h3 class="text-xs text-gray-600">{item.caption}</h3>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/each}
    <div class="text-center">
      <button class="btn btn-sm btn-primary" on:click={createHypothesis}>Document New Bias</button>
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
