<script lang="ts">
  import { get, writable } from 'svelte/store';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { setProgress } from '$lib/marcelle/logging';
  import { pageProgress } from '$lib/marcelle/progress';
  import { cards, fetchCompletedHypotheses, updateHypothesis } from './hypothesis_storage';
  import { base } from '$app/paths';
  import { faCheck } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

  let selectedCardIndex = writable<number | null>(null);
  let canSubmit = writable<boolean>(false);
  let disableInputs = writable<boolean>(false);

  onMount(async () => {
    await fetchCompletedHypotheses();
    checkProgress();
  });

  function selectCard(index: number) {
    selectedCardIndex.set(index);
  }

  function checkProgress() {
    const hypotheses = get(cards);

    let completed = 0;
    let totalQuestions = 0;

    hypotheses.forEach((h) => {
      Object.entries(h.questionnaire).forEach(([key, q]) => {
        if (key !== 'comments') {
          totalQuestions++;
          if (q !== null && q !== undefined && String(q).trim() !== '') {
            completed++;
          }
        }
      });
    });

    const progress = totalQuestions > 0 ? (completed / totalQuestions) * 100 : 0;
    pageProgress.set(progress);

    canSubmit.set(progress === 100);
  }

  function isCardCompleted(card) {
    const requiredFields = ['question1', 'question2', 'question3'];

    return requiredFields.every((field) => {
      return (
        card.questionnaire[field] !== null &&
        card.questionnaire[field] !== undefined &&
        String(card.questionnaire[field]).trim() !== ''
      );
    });
  }

  function saveAnswer(cardId: string, field: keyof Hypothesis['questionnaire'], value: string) {
    const updatedCards = get(cards).map((card) => {
      if (card.id === cardId) {
        return {
          ...card,
          questionnaire: {
            ...card.questionnaire,
            [field]: value,
          },
        };
      }
      return card;
    });

    cards.set(updatedCards);
    updateHypothesis(cardId, {
      questionnaire: get(cards).find((c) => c.id === cardId)?.questionnaire,
    });

    if (field !== 'comments') {
      checkProgress();
    }
  }

  function submit() {
    disableInputs.set(true);
    canSubmit.set(false);
    goto(`${base}/post-questionnaire`);
  }

  function nextCard(currentIndex: number) {
    const totalCards = get(cards).length;
    const nextIndex = currentIndex + 1 <= totalCards ? currentIndex + 1 : 0; 
    selectedCardIndex.set(nextIndex);
  }
</script>

<div class="flex h-screen">
  <div class="menu-container w-1/4 p-4 h-screen top-0 overflow-y-auto">
    <h3 class="font-bold text-gray-600 mb-4">
      Please fill out all the questionnaires in each Bias Card
    </h3>
    <ul class="menu bg-base-200 rounded-box">
      {#each $cards as card (card.index)}
        <li>
          <a
            href="#"
            on:click={() => selectCard(card.index)}
            class={isCardCompleted(card)
              ? 'bg-accent'
              : $selectedCardIndex === card.index
                ? 'bg-base-300'
                : 'bg-base-200'}
          >
            Bias {card.index}
            {#if isCardCompleted(card)}
              <FontAwesomeIcon icon={faCheck} class="text-green-500 ml-2" />
            {/if}
          </a>
        </li>
      {/each}
    </ul>
    <div class="text-center my-4">
      <button on:click={submit} class="btn btn-primary" disabled={!$canSubmit}>Submit</button>
    </div>
  </div>

  <div class="main-container flex flex-col items-center w-3/4">
    {#each $cards as card (card.index)}
      {#if card.index === $selectedCardIndex}
        <div
          class="bias-container flex flex-col w-full max-w-5xl p-6 shadow-lg bg-base-100 rounded-lg"
        >
          <button class="btn btn-xs btn-secondary self-start font-bold" on:click={() => nextCard(card.index)}>
            Next Card
          </button>

          <h3 class="text-xl font-bold text-gray-700 text-center w-full mb-4">
            Bias {card.index}
          </h3>

          <div class="flex w-full">
            <div class="questionnaire w-1/2 p-4 border-r">
              <h3 class="font-bold text-lg text-gray-500 mb-2">Questionnaire</h3>

              <div class="form-control mb-4">
                <label class="label font-medium text-sm">
                  Have you included all relevant examples of the bias? <span>*</span>
                </label>
                <div class="radio-options flex space-x-4">
                  <label>
                    <input
                      type="radio"
                      name="evidence-{card.index}"
                      value="yes"
                      bind:group={card.questionnaire.question2}
                      on:change={() => saveAnswer(card.id, 'question2', 'yes')}
                      disabled={$disableInputs}
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="evidence-{card.index}"
                      value="no"
                      bind:group={card.questionnaire.question2}
                      on:change={() => saveAnswer(card.id, 'question2', 'no')}
                      disabled={$disableInputs}
                    />
                    No
                  </label>
                </div>
              </div>

              <div class="form-control mb-4">
                <label class="label font-medium text-sm">
                  Did you find any examples that contradict the bias? <span>*</span>
                </label>
                <div class="radio-options flex space-x-4">
                  <label>
                    <input
                      type="radio"
                      name="counterexamples-{card.index}"
                      value="yes"
                      bind:group={card.questionnaire.question3}
                      on:change={() => saveAnswer(card.id, 'question3', 'yes')}
                      disabled={$disableInputs}
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="counterexamples-{card.index}"
                      value="no"
                      bind:group={card.questionnaire.question3}
                      on:change={() => saveAnswer(card.id, 'question3', 'no')}
                      disabled={$disableInputs}
                    />
                    No
                  </label>
                </div>
              </div>

              <div class="form-control mb-4">
                <label class="label font-medium text-sm">
                  How confident are you that this bias happens frequently? <span>*</span>
                </label>
                <div class="likert-scale flex justify-between">
                  {#each [1, 2, 3, 4, 5] as value}
                    <label>
                      <input
                        type="radio"
                        name="confidence-{card.index}"
                        {value}
                        checked={card.questionnaire.question1 == value}
                        on:change={() => saveAnswer(card.id, 'question1', value.toString())}
                        disabled={$disableInputs}
                      />
                      {['Very Uncertain', 'Uncertain', 'Neutral', 'Confident', 'Very Confident'][
                        value - 1
                      ]}
                    </label>
                  {/each}
                </div>
              </div>

              <div class="form-control mb-4">
                <label class="label font-medium text-sm">
                  Do you have additional comments to help us understand the bias you identified?
                </label>
                <textarea
                  bind:value={card.questionnaire.comments}
                  class="textarea textarea-bordered"
                  placeholder="Add your comments here..."
                  on:blur={(e) => saveAnswer(card.id, 'comments', e.target.value)}
                  disabled={$disableInputs}
                />
              </div>
            </div>

            <div class="bias-card w-1/2 p-4">
              <h4 class="text-xs text-gray-500 font-bold mt-2">Description:</h4>
              <textarea bind:value={card.description} class="textarea w-full" disabled={true}
              ></textarea>

              <h4 class="text-xs text-gray-500 font-bold mt-4">Supporting Examples:</h4>
              <div
                class="grid grid-cols-5 gap-2 p-2 border border-dashed border-gray-300 rounded-lg min-h-[100px]"
              >
                {#each card.evidence as item (item.id)}
                  <div
                    class="dropped-item p-1 bg-gray-100 border border-gray-300 rounded-md text-center relative"
                  >
                    <img src={item.thumbnail} class="w-full h-auto mb-2 rounded" />
                    <h3 class="text-xs text-gray-600">{item.caption}</h3>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .questionnaire {
    border-radius: 8px;
  }

  textarea {
    border-radius: 8px;
  }

  .form-control label {
    font-size: 0.9rem;
    font-weight: bold;
  }

  .btn {
    font-weight: 100;
  }
  h3 {
    font-size: 0.8rem;
  }
  .menu-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 25%;
    margin-top: 50px;
    overflow-y: auto;
    z-index: 1000;
  }

  .main-container {
    margin-left: 25%;
    width: 100%;
  }

  .grid {
    background-color: oklch(var(--b2));
  }

  .dropped-item {
    padding: 4px;
    background-color: #fff;
    border: 1px solid #e6e6e6;
    border-radius: 8px;
    cursor: no-drop;
    z-index: 1;
  }
  .dropped-item h3 {
    font-size: 0.5rem;
    text-align: center;
  }
  .likert-scale label {
    display: inline-block;
    text-align: center;
    width: 18%;
    font-size: 0.7rem;
  }
  .radio-options label {
    display: inline-block;
    text-align: center;
    width: 30%;
    font-size: 0.7rem;
  }
  h4 {
    margin-bottom: 5px;
  }
  li {
    margin-top: 2px;
  }
</style>
