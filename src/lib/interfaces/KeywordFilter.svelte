<script lang="ts">
  import {
    caption,
    trainingSet,
    tutorialDataset,
    dynamicClassLabel,
    captionInstances,
  } from '$lib/marcelle';
  import { onMount } from 'svelte';
  import { logEvent } from '$lib/marcelle/log';

  export let phase: 'tutorial' | 'main';

  let selectedWordsList: string[] = [];

  let processedCaptions = new Set<string>();
  let nonGenderedWordFrequency = {};
  let isDataReady = false;
  let filterTimeout;

  const stopWords = [
    'in',
    'into',
    'of',
    'other',
    'is',
    'are',
    'arafed',
    'araffe',
    'and',
    'model',
    'generated',
    'caption:',
    'a',
    'to',
    'one',
    'two',
    'three',
    'on',
    'the',
    'at',
    'with',
  ];

  function updateAggregatedPersonFrequency(captionText: string, instance) {
    if (processedCaptions.has(captionText)) return;
    processedCaptions.add(captionText);

    const words = captionText.toLowerCase().split(/\s+/);
    const nonGenderedWords = words.filter((word) => !stopWords.includes(word));

    nonGenderedWords.forEach((word) => {
      if (!nonGenderedWordFrequency[word]) nonGenderedWordFrequency[word] = 0;
      nonGenderedWordFrequency[word]++;

      if (!captionInstances[word]) captionInstances[word] = [];
      captionInstances[word].push(instance);
    });
  }

  let selectedWord = '';
  let customWord = '';
  let frequentWords = [];

  function updateFrequentWords() {
    frequentWords = getMostFrequentNonGenderedWords(5);
  }

  function handleWordSelection() {
    const uniqueWords = new Set(selectedWordsList);
    let addedWord = null;

    if (selectedWord && !uniqueWords.has(selectedWord)) {
      uniqueWords.add(selectedWord);
      addedWord = selectedWord;
      selectedWord = '';
    }

    if (customWord.trim() && !uniqueWords.has(customWord)) {
      uniqueWords.add(customWord.trim());
      addedWord = customWord.trim();
      customWord = '';
    }

    selectedWordsList = Array.from(uniqueWords);
    if (addedWord) {
      filterDatasetBySelectedWords('add', addedWord);
    }
  }

  function resetDatasetFilter() {
    const datasetToUse = phase === 'tutorial' ? tutorialDataset : trainingSet;
    datasetToUse.sift({});
    selectedWordsList = [];
  }

  function removeWord(word: string) {
    if (!captionInstances[word]) {
      console.warn(
        `Warning: Trying to remove a word that doesn't exist in captionInstances - "${word}"`,
      );
      return;
    }

    selectedWordsList = selectedWordsList.filter((w) => w !== word);

    setTimeout(() => {
      filterDatasetBySelectedWords('remove', word);
    }, 100);
  }

  function getMostFrequentNonGenderedWords(limit) {
    return Object.entries(nonGenderedWordFrequency)
      .sort(([, freqA], [, freqB]) => freqB - freqA)
      .slice(0, limit)
      .map(([word]) => word);
  }

  async function fetchAndProcessCaptions() {
    try {
      isDataReady = false;
      await trainingSet.ready;
      await tutorialDataset.ready;

      const datasetToUse = phase === 'tutorial' ? tutorialDataset : trainingSet;
      const allInstances = await datasetToUse.find();
      if (allInstances.data.length > 0) {
        allInstances.data.forEach((instance) => {
          if (instance.caption) {
            updateAggregatedPersonFrequency(instance.caption, instance);
          }
        });
        updateFrequentWords();
      } else {
        console.warn('Dataset is empty.');
      }
      isDataReady = true;
    } catch (error) {
      console.error('Error fetching dataset instances:', error);
    }
  }

  onMount(async () => {
    await fetchAndProcessCaptions();

    caption.$value.subscribe((captionText) => {
      if (captionText) {
        updateAggregatedPersonFrequency(captionText);
      }
    });
  });

  let previousLabel = $dynamicClassLabel;

  $: {
    if ($dynamicClassLabel && $dynamicClassLabel !== previousLabel) {
      previousLabel = $dynamicClassLabel;

      processedCaptions.clear();
      nonGenderedWordFrequency = {};
      Object.keys(captionInstances).forEach((key) => (captionInstances[key] = {}));

      fetchAndProcessCaptions();
    }
  }

  function matchWord(word: string, target: string): boolean {
    word = word.toLowerCase().trim();
    target = target.toLowerCase().trim();

    if (word === target) return true;

    if (word + 's' === target || word === target + 's') return true;

    if (word.endsWith('y') && target === word.slice(0, -1) + 'ies') return true;
    if (target.endsWith('y') && word === target.slice(0, -1) + 'ies') return true;

    if (word.endsWith('us') && target === word.slice(0, -2) + 'i') return true;
    if (target.endsWith('us') && word === target.slice(0, -2) + 'i') return true;

    return false;
  }

  let filteredInstances: any[] = [];

  function filterDatasetBySelectedWords(action: 'add' | 'remove', word: string) {
    if (!isDataReady) {
      console.warn('Filtering skipped: Data is still loading.');
      return;
    }

    if (selectedWordsList.length === 0) {
      resetDatasetFilter();
      return;
    }

    const datasetToUse = phase === 'tutorial' ? tutorialDataset : trainingSet;
    let matchingInstances: string[] = [];

    for (const word of selectedWordsList) {
      const wordInstances = Object.entries(captionInstances).filter(([captionWord]) =>
        matchWord(word, captionWord),
      );

      const wordIds = wordInstances.flatMap(([_, instances]) =>
        instances ? instances.map((instance) => instance?.id).filter(Boolean) : [],
      );

      if (matchingInstances.length === 0) {
        matchingInstances = wordIds;
      } else {
        matchingInstances = matchingInstances.filter((id) => wordIds.includes(id));
      }

      if (matchingInstances.length === 0) {
        console.warn('No matching instances for the selected words.');
        datasetToUse.sift({ id: { $in: [] } });
        return;
      }
    }

    datasetToUse.sift({ id: { $in: matchingInstances } });

  }
</script>

<div class="marcelle card">
  <div class="conf-row">
    <div class="flex flex-col items-center gap-2 chart-container">
      <!-- <div
        class="tooltip tooltip-open tooltip-accent tooltip-right"
        data-tip="Filter the dataset based on words in the captions."
      > -->
      <div class="word-selection">
        <h3>Filter the dataset based on captions containing:</h3>
        <!-- <div class="dropdown dropdown-right">
          <div
            tabindex="0"
            role="button"
            class="btn btn-xs m-1"
            aria-disabled={!$dynamicClassLabel || $dynamicClassLabel === 'all'}
          >
            Most Frequent Words
          </div>
          {#if frequentWords.length > 0}
            <ul
              tabindex="0"
              class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
              {#each frequentWords as word}
                <li>
                  <a
                    on:click={() => {
                      selectedWord = word;
                      handleWordSelection();
                    }}>{word}</a
                  >
                </li>
              {/each}
            </ul>
          {:else}
            <ul
              tabindex="0"
              class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
              aria-disabled="true"
            >
              <li><a class="text-gray-400 cursor-not-allowed">No words available</a></li>
            </ul>
          {/if}
        </div> -->

        <div class="add-word">
          <input
            type="text"
            bind:value={customWord}
            placeholder="word"
            class="input input-bordered input-xs w-full max-w-xs"
          />
          <button on:click={handleWordSelection} class="btn btn-secondary btn-xs">Filter</button>
        </div>
        <!-- <button on:click={resetDatasetFilter} class="btn btn-primary btn-xs">Reset Filter</button> -->
        <div class="badge-container">
          {#each selectedWordsList as word, index (word)}
            <div class="badge badge-accent">
              {word}
              <button class="badge-remove-btn" on:click={() => removeWord(word)}>✕</button>
            </div>
            {#if index < selectedWordsList.length - 1}
              <span class="word-operator">AND</span>
            {/if}
          {/each}
        </div>
      </div>
      <!-- </div> -->
    </div>
  </div>
</div>

<style>
  .marcelle.card {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
    width: 100%;
    align-items: center;
  }

  .word-operator {
    font-size: 0.8rem;
    font-weight: bold;
    color: #00796b;
    margin: 0 5px;
  }

  .badge-container {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 10px;
  }

  .badge {
    display: flex;
    align-items: center;
    padding: 5px 10px;
    background-color: #e0f7fa;
    color: #00796b;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: bold;
    cursor: pointer;
  }

  .badge-remove-btn {
    margin-left: 5px;
    background: none;
    border: none;
    color: #00796b;
    cursor: pointer;
    font-weight: bold;
  }

  .badge-remove-btn:hover {
    color: #004d40;
  }

  .add-word {
    display: flex;
    flex-direction: row;
    gap: 5px;
  }

  .btn {
    font-size: 0.7rem;
    font-weight: normal;
  }

  h3 {
    color: var(--heading-color);
    margin: 2px;
    font-size: small;
    font-weight: 600;
    text-align: left;
  }

  .conf-row {
    display: flex;
    gap: 10px;
    height: 100%;
    align-items: center;
  }

  .word-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    font-size: 0.8rem;
    margin-right: 10px;
  }

  input {
    font-size: 0.7rem;
    width: 85px;
    /* height: 20px; */
    /* margin-right: 5px; */
    border-color: #ddd;
  }
</style>
