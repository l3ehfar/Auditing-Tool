<script lang="ts">
  import { writable, get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { notification } from '@marcellejs/core';
  import { goto } from '$app/navigation';

  let cards = writable([]);
  let nextCardId = 1;
  let selectedCardId = writable(1);

  const CARDS_STORAGE_KEY = 'schemasCards';
  let userId = localStorage.getItem('userId');
  let lastUserId = localStorage.getItem('lastUserId');

  let overallTimeLeft = 1800;
  const timerDisplay = writable(overallTimeLeft);
  let isSubmitDisabled = true;
  let showSubmitButton = false;
  let isTimerFinished = false;

  const INACTIVITY_THRESHOLD = 180000; //3 minutes in milliseconds
  const INACTIVITY_KEY = 'inactivityCounter';
  let inactivityCount = parseInt(localStorage.getItem(INACTIVITY_KEY) || '0', 10);

  let lastActivityTimestamp = Date.now();
  let inactivityCheckInterval: ReturnType<typeof setInterval> | null = null;

  function resetInactivityTimer() {
    lastActivityTimestamp = Date.now(); 
  }

  function checkInactivity() {
    const now = Date.now();
    if (now - lastActivityTimestamp >= INACTIVITY_THRESHOLD) {
      inactivityCount++;
      localStorage.setItem(INACTIVITY_KEY, inactivityCount.toString());

      notification({
        title: 'You’ve been inactive!',
        message: 'It seems you’ve been inactive for over 3 minutes.',
        duration: 5000,
        type: 'danger',
      });

      lastActivityTimestamp = now;
    }
  }

  function startInactivityCheck() {
    if (!inactivityCheckInterval) {
      inactivityCheckInterval = setInterval(checkInactivity, 1000); // Check every second
    }
  }

  function saveCardsState() {
    if (userId) {
      const cardsData = get(cards);
      localStorage.setItem(`${CARDS_STORAGE_KEY}-${userId}`, JSON.stringify(cardsData));
    }
  }

  function stopInactivityCheck() {
    if (inactivityCheckInterval) {
      clearInterval(inactivityCheckInterval);
      inactivityCheckInterval = null;
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      lastActivityTimestamp = Date.now();
    }
  }

  function loadCardsState() {
    if (userId) {
      const savedCards = localStorage.getItem(`${CARDS_STORAGE_KEY}-${userId}`);
      if (savedCards) {
        const parsedCards = JSON.parse(savedCards);
        cards.set(parsedCards);
        nextCardId = Math.max(0, ...parsedCards.map((card) => card.id)) + 1;

        checkIfSubmitEnabled();
      }
    }
  }
  function handleUserChange() {
    if (userId !== lastUserId) {
      console.log('New user detected. Resetting state.');
      cards.set([]);
      nextCardId = 1;

      localStorage.removeItem(`${CARDS_STORAGE_KEY}-${lastUserId}`);
      localStorage.setItem('lastUserId', userId);
    } else {
      console.log('Returning user detected. Loading state.');
      loadCardsState();
    }
  }

  function checkIfSubmitEnabled() {
    const allCards = get(cards);
    isSubmitDisabled = allCards.some((card) =>
      Object.values(card.questionnaire)
        .slice(0, 3)
        .some((value) => !value.trim()),
    );

    if (!isSubmitDisabled && showSubmitButton) {
      notification({
        title: 'Ready to Submit',
        message: 'All questions have been answered. You can now submit.',
        duration: 3000,
      });
    }
  }

  cards.subscribe(() => {
    checkIfSubmitEnabled();
  });

  onMount(() => {
    handleUserChange();
    window.addEventListener('beforeunload', saveCardsState);

    const savedTime = localStorage.getItem('schemasTimer');
    overallTimeLeft = savedTime ? JSON.parse(savedTime) : overallTimeLeft;
    timerDisplay.set(overallTimeLeft);

    if (overallTimeLeft <= 0) {
      isTimerFinished = true;
      showSubmitButton = true;
      checkIfSubmitEnabled();
    }

    const timer = setInterval(() => {
      if (overallTimeLeft > 0) {
        overallTimeLeft -= 1;
        timerDisplay.set(overallTimeLeft);
        localStorage.setItem('schemasTimer', JSON.stringify(overallTimeLeft));

        if (overallTimeLeft === 600) {
          notification({
            title: 'Reminder',
            message: 'You have 10 minutes to organize and submit your hypotheses.',
            duration: 8000,
          });
        } else if (overallTimeLeft === 1500) {
          notification({
            title: 'Reminder',
            message: 'You must provide at least 2 hypotheses.',
            duration: 10000,
          });
        } else if (overallTimeLeft === 1200) {
          notification({
            title: 'Reminder',
            message: 'Have you tested your hypotheses?',
            duration: 8000,
          });
        } else if (overallTimeLeft === 900) {
          notification({
            title: 'Reminder',
            message: 'Have you enough examples to support your hypotheses?',
            duration: 8000,
          });
        }
      } else {
        clearInterval(timer);
        isTimerFinished = true;
        showSubmitButton = true;
        checkIfSubmitEnabled();

        cards.update((currentCards) =>
          currentCards.map((card) => ({
            ...card,
            showQuestionnaire: true,
          })),
        );

        if (isSubmitDisabled) {
          notification({
            title: 'Time’s up!',
            message: 'Please fill out the questionnaire in each card.',
            duration: 5000,
          });
        }

        saveCardsState();
      }
    }, 1000);

    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keydown', resetInactivityTimer);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    startInactivityCheck();

    return () => {
      stopInactivityCheck();
      document.removeEventListener('mousemove', resetInactivityTimer);
      document.removeEventListener('keydown', resetInactivityTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(timer);
      window.removeEventListener('beforeunload', saveCardsState);
    };
  });

  function generateUUID() {
    return crypto.randomUUID();
  }

  function addCard() {
    if (isTimerFinished) return;
    cards.update((currentCards) => {
      const newCards = [
        ...currentCards,
        {
          id: nextCardId++,
          text: '',
          items: [],
          showQuestionnaire: false,
          questionnaire: {
            question1: '',
            question2: '',
            question3: '',
          },
        },
      ];
      return newCards;
    });

    setTimeout(() => saveCardsState(), 0);
  }

  function removeCard(cardId) {
    cards.update((currentCards) => currentCards.filter((card) => card.id !== cardId));
  }

  function onDrop(event, card) {
    event.preventDefault();

    const rawData = event.dataTransfer.getData('text/plain');

    if (!rawData) {
      console.error('No data received during drop');
      return;
    }

    try {
      const data = JSON.parse(rawData);

      cards.update((currentCards) =>
        currentCards.map((c) => {
          if (c.id === card.id) {
            const existingItem = c.items.find((item) => item.src === data.src);
            if (existingItem) {
              // console.warn('Duplicate item detected, skipping:', data);
              return c;
            }

            return {
              ...c,
              items: [...c.items, { id: generateUUID(), ...data }],
            };
          }
          return c;
        }),
      );
      saveCardsState();
    } catch (error) {
      console.error('Failed to parse drag data:', error);
    }
  }

  function allowDrop(event) {
    event.preventDefault();
  }

  function removeItem(cardId, itemId) {
    cards.update((currentCards) =>
      currentCards.map((c) =>
        c.id === cardId ? { ...c, items: c.items.filter((item) => item.id !== itemId) } : c,
      ),
    );
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
            const items = [...c.items];
            const draggedIndex = items.findIndex((i) => i.id === draggedItem.item.id);
            const targetIndex = items.findIndex((i) => i.id === targetItemId);

            const [movedItem] = items.splice(draggedIndex, 1);
            items.splice(targetIndex, 0, movedItem);

            return { ...c, items };
          }
          return c;
        }),
      );
    }

    draggedItem = null;
  }

  function selectCard(id: number) {
    selectedCardId.set(id);
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

    saveCardsState();

    goto('/post-questionnaire');
  }
</script>

{#if isTimerFinished}
  <div class="flex h-screen">
    <div class="menu-container w-1/4 p-4 h-screen top-0 overflow-y-auto">
      <h3 class="font-bold text-gray-600 mb-4">Please fill out all the questionnaires</h3>
      <ul class="menu bg-base-200 rounded-box">
        {#each $cards as card (card.id)}
          <li style="margin-bottom: 4px;">
            <a
              href="#"
              on:click={() => selectCard(card.id)}
              class={$selectedCardId === card.id
                ? 'bg-base-300'
                : Object.values(card.questionnaire).every((q) => q.trim())
                  ? 'bg-accent'
                  : 'bg-base-200'}
            >
              Hypothesis {card.id}
            </a>
          </li>
        {/each}
      </ul>
      {#if showSubmitButton}
        {#if isSubmitDisabled}
          <div
            class="tooltip tooltip-bottom tooltip-accent"
            data-tip="Please answer all mandatory questions"
          >
            <button class="btn btn-xs btn-accent mt-4" on:click={submitFinalResults} disabled>
              Submit Final Results
            </button>
          </div>
        {:else}
          <button class="btn btn-xs btn-accent mt-4" on:click={submitFinalResults}>
            Submit Final Results
          </button>
        {/if}
      {/if}
    </div>

    <div class="main-container">
      {#each $cards as card (card.id)}
        {#if card.id === $selectedCardId}
          <div class="card shadow-lg bg-base-100 p-4">
            <div class="card-body">
              <button
                class="btn btn-xs btn-circle absolute top-2 right-2"
                on:click={() => removeCard(card.id)}
                disabled={isTimerFinished}
              >
                x
              </button>
              <h3 class="font-bold text-gray-600">Hypothesis {card.id}</h3>
              <textarea
                bind:value={card.text}
                class="textarea textarea-xs textarea-accent textarea-bordered w-full"
                placeholder="Add your hypothesis here"
                disabled={isTimerFinished}
              ></textarea>

              {#if card.items.length === 0}
                <div
                  class="tooltip tooltip-open tooltip-accent"
                  data-tip="drag and drop evidence"
                ></div>
              {/if}

              <div
                class="grid grid-cols-5 gap-2 p-4 border border-dashed border-gray-300 rounded-lg min-h-[100px]"
                class:disabled={isTimerFinished}
                on:drop={(event) => isTimerFinished || onDrop(event, card)}
                on:dragover={(event) => isTimerFinished || allowDrop(event)}
              >
                {#each card.items as item (item.id)}
                  <div
                    class="dropped-item p-1 bg-gray-100 border border-gray-300 rounded-md text-center relative"
                    draggable={!isTimerFinished}
                    on:dragstart={(event) =>
                      isTimerFinished || handleDragStart(event, card.id, item)}
                    on:drop={(event) => handleDropOnItem(event, card.id, item.id)}
                    on:dragover={allowDrop}
                  >
                    <button
                      class="items-btn btn btn-xs btn-circle absolute top-1 right-1"
                      on:click={() => removeItem(card.id, item.id)}
                      disabled={isTimerFinished}
                    >
                      x
                    </button>
                    {#if item.type === 'image-caption'}
                      <img src={item.src} alt="Dropped Image" class="w-full h-auto mb-2 rounded" />
                      <h3 class="text-xs text-gray-600">{item.caption}</h3>
                    {/if}
                  </div>
                {/each}
              </div>
              {#if card.showQuestionnaire}
                <div class="questionnaire mt-4">
                  <!-- <h3 class="font-bold mb-4">Please fill out the questionnaire:</h3> -->

                  <div class="form-control mb-4">
                    <label class="label font-medium text-sm">
                      How accurately did you describe the bias? <span>*</span>
                    </label>
                    <div class="likert-scale flex justify-between">
                      <label>
                        <input
                          type="radio"
                          name="confidence-{card.id}"
                          value="1"
                          bind:group={card.questionnaire.question1}
                        />
                        Very Uncertain
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="confidence-{card.id}"
                          value="2"
                          bind:group={card.questionnaire.question1}
                        />
                        Uncertain
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="confidence-{card.id}"
                          value="3"
                          bind:group={card.questionnaire.question1}
                        />
                        Neutral
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="confidence-{card.id}"
                          value="4"
                          bind:group={card.questionnaire.question1}
                        />
                        Confident
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="confidence-{card.id}"
                          value="5"
                          bind:group={card.questionnaire.question1}
                        />
                        Very Confident
                      </label>
                    </div>
                  </div>

                  <div class="form-control mb-4">
                    <label class="label font-medium text-sm">
                      Did you put all the examples that support the bias you described? <span
                        >*</span
                      >
                    </label>
                    <div class="radio-options flex space-x-4">
                      <label>
                        <input
                          type="radio"
                          name="evidence-{card.id}"
                          value="yes"
                          bind:group={card.questionnaire.question2}
                        />
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="evidence-{card.id}"
                          value="no"
                          bind:group={card.questionnaire.question2}
                        />
                        No
                      </label>
                    </div>
                  </div>

                  <div class="form-control mb-4">
                    <label class="label font-medium text-sm">
                      Did you find any examples that go against your hypothesis? <span>*</span>
                    </label>
                    <div class="radio-options flex space-x-4">
                      <label>
                        <input
                          type="radio"
                          name="counterexamples-{card.id}"
                          value="yes"
                          bind:group={card.questionnaire.question3}
                        />
                        Yes
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="counterexamples-{card.id}"
                          value="no"
                          bind:group={card.questionnaire.question3}
                        />
                        No
                      </label>
                    </div>
                  </div>

                  <div class="form-control">
                    <label class="label font-medium text-sm">
                      Do you have additional comments to help us understand your hypothesis?
                    </label>
                    <textarea
                      name="comments-{card.id}"
                      placeholder="Add your comments here..."
                      bind:value={card.questionnaire.comments}
                      class="textarea textarea-bordered"
                    ></textarea>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
{:else}
  <div class="marcelle-card">
    <div class="container">
      <div class="button-row">
        <button class="btn btn-xs btn-primary" on:click={addCard} disabled={isTimerFinished}
          >New Hypothesis</button
        >
      </div>

      {#each $cards as card (card.id)}
        <div class="card shadow-lg bg-base-100 p-4">
          <div class="card-body">
            <button
              class="btn btn-xs btn-circle absolute top-2 right-2"
              on:click={() => removeCard(card.id)}
              disabled={isTimerFinished}
            >
              x
            </button>

            <textarea
              bind:value={card.text}
              class="textarea textarea-xs textarea-accent textarea-bordered w-full"
              placeholder="Add your hypothesis here"
              on:input={() => saveCardsState()}
              disabled={isTimerFinished}
            ></textarea>

            {#if card.items.length === 0}
              <div
                class="tooltip tooltip-open tooltip-accent"
                data-tip="drag and drop evidence"
              ></div>
            {/if}

            <div
              class="grid grid-cols-5 gap-2 p-4 border border-dashed border-gray-300 rounded-lg min-h-[100px]"
              class:disabled={isTimerFinished}
              on:drop={(event) => isTimerFinished || onDrop(event, card)}
              on:dragover={(event) => isTimerFinished || allowDrop(event)}
            >
              {#each card.items as item (item.id)}
                <div
                  class="dropped-item p-1 bg-gray-100 border border-gray-300 rounded-md text-center relative"
                  draggable={!isTimerFinished}
                  on:dragstart={(event) => isTimerFinished || handleDragStart(event, card.id, item)}
                  on:drop={(event) => handleDropOnItem(event, card.id, item.id)}
                  on:dragover={allowDrop}
                >
                  <button
                    class="items-btn btn btn-xs btn-circle absolute top-1 right-1"
                    on:click={() => removeItem(card.id, item.id)}
                    disabled={isTimerFinished}
                  >
                    x
                  </button>
                  {#if item.type === 'image-caption'}
                    <img src={item.src} alt="Dropped Image" class="w-full h-auto mb-2 rounded" />
                    <h3 class="text-xs text-gray-600">{item.caption}</h3>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .btn {
    font-weight: 100;
  }

  h3 {
    font-size: 0.8rem;
  }

  .button-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .btn-accent {
    flex-shrink: 0;
  }

  .marcelle-card {
    height: 100vh;
    background-color: white;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
  }

  .grid {
    background-color: oklch(var(--b2));
  }

  .container {
    max-width: 50vw;
    margin: 0 auto;
    width: 100%;
  }

  .card {
    position: relative;
    width: 100%;
    padding: 0 !important;
    box-sizing: border-box;
    min-height: 100px;
  }

  img {
    max-height: 100px;
    object-fit: cover;
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
    font-size: 0.5rem;
    text-align: center;
  }

  .btn-circle {
    position: absolute;
    top: 0.15rem;
    right: 0.15rem;
    z-index: 10;
    background-color: transparent;
    color: red;
    border: none;
    font-size: 0.8rem;
  }

  .btn-circle:hover {
    background-color: #e6e6e6;
  }

  .items-btn.btn-circle {
    top: -0.65rem;
    right: -0.55rem;
    position: absolute;
    z-index: 10;
    background-color: transparent;
    color: red;
    border: none;
    font-size: 0.8rem;
  }

  .items-btn.btn-circle:hover {
    background-color: #e6e6e6;
  }

  .p-1 {
    padding: 0.35rem;
  }

  .likert-scale label {
    display: inline-block;
    text-align: center;
    width: 18%;
    font-size: 0.7rem;
  }

  .likert-scale input {
    margin: 0 auto;
    display: block;
  }

  .menu-container {
    position: fixed;
    top: 0;
    left: 0;
    /* width: 25%; */
    /* height: 100%; */
    margin-top: 50px;
    overflow-y: auto;
    z-index: 1000;
  }

  .main-container {
    margin-left: 25%;
    width: 100%;
    min-width: 550px;
    max-width: 550px;
  }

  .radio-options label {
    display: inline-block;
    text-align: center;
    width: 30%;
    font-size: 0.7rem;
  }

  .form-control span {
    color: red;
  }

  .form-control {
    margin-bottom: 0.4rem;
    font-size: 0.8rem;
  }
</style>
