<!-- <script lang="ts">
  import {
    caption,
    $imageStream as imageStream,
    trainingSet,
    aggregatedPersonFrequency,
    coOccurrences,
    captionInstances,
    genderedWords,
    dynamicClassLabel,
  } from '$lib/marcelle';
  import { onMount, onDestroy, tick } from 'svelte';
  import * as fabric from 'fabric';
  import Chart from 'chart.js/auto';
  import { marcelle } from '$lib/utils';
  import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';

  Chart.register(MatrixController, MatrixElement);
  let canvas: fabric.Canvas | null = null;
  let imageObject: fabric.Image | null = null;
  let dragOverlay: HTMLDivElement | null = null;

  let processedCaptions = new Set<string>();
  let nonGenderedWordFrequency = {};
  let matrixChart = null;

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
    'chef',
    'pilot',
    'judge',
    'chefs',
    'pilots',
    'judges'
  ];
  function updateAggregatedPersonFrequency(captionText: string, instance) {
    if (processedCaptions.has(captionText)) return;
    processedCaptions.add(captionText);

    const words = captionText.toLowerCase().split(/\s+/);

    // Define categories to track
    const containsCategory = {
      male: false,
      female: false,
      'professional title': false,
    };

    ['male', 'female'].forEach((category) => {
      if (!aggregatedPersonFrequency[category]) aggregatedPersonFrequency[category] = 0;
      if (!coOccurrences[category]) coOccurrences[category] = {};
    });

    // Track job labels and initialize if needed
    const jobLabels = ['chef', 'pilot', 'judge']; 

    if ($dynamicClassLabel === 'all') {
      if (!aggregatedPersonFrequency['professional title'])
        aggregatedPersonFrequency['professional title'] = 0;
      if (!coOccurrences['professional title']) coOccurrences['professional title'] = {};

      jobLabels.forEach((label) => {
        if (!aggregatedPersonFrequency[label]) aggregatedPersonFrequency[label] = 0;
        if (!coOccurrences[label]) coOccurrences[label] = {};
      });
    } else {
      // Initialize specific dynamicClassLabel if it exists
      if ($dynamicClassLabel) {
        if (!aggregatedPersonFrequency[$dynamicClassLabel])
          aggregatedPersonFrequency[$dynamicClassLabel] = 0;
        if (!coOccurrences[$dynamicClassLabel]) coOccurrences[$dynamicClassLabel] = {};
      }
    }

    Object.keys(genderedWords).forEach((category) => {
      genderedWords[category].forEach((identifier) => {
        if (words.includes(identifier)) {
          containsCategory[category] = true;
          aggregatedPersonFrequency[category]++;
        }
      });
    });

    // Count job mentions
    if ($dynamicClassLabel === 'all') {
      let jobMentioned = false;
      jobLabels.forEach((label) => {
        if (words.includes(label)) {
          if (!jobMentioned) {
            containsCategory['professional title'] = true;
            aggregatedPersonFrequency['professional title']++;
            jobMentioned = true;
          }
          aggregatedPersonFrequency[label]++;
        }
      });
    } else if ($dynamicClassLabel) {
      const specificLabel = $dynamicClassLabel.toLowerCase();
      const pluralLabel = specificLabel.endsWith('s') ? specificLabel + 'es' : specificLabel + 's';

      if (words.includes(specificLabel) || words.includes(pluralLabel)) {
        containsCategory[$dynamicClassLabel] = true;
        aggregatedPersonFrequency[$dynamicClassLabel]++;
      }
    }

    // Count non-gendered, non-job words
    const nonGenderedWords = words.filter(
      (word) => !Object.values(genderedWords).flat().includes(word) && !stopWords.includes(word),
    );

    nonGenderedWords.forEach((word) => {
      if (!nonGenderedWordFrequency[word]) nonGenderedWordFrequency[word] = 0;
      nonGenderedWordFrequency[word]++;
    });

    Object.keys(containsCategory).forEach((category) => {
      if (containsCategory[category]) {
        nonGenderedWords.forEach((word) => {
          coOccurrences[category][word] = (coOccurrences[category][word] || 0) + 1;
          if (!captionInstances[category]) captionInstances[category] = {};
          if (!captionInstances[category][word]) captionInstances[category][word] = [];
          captionInstances[category][word].push(instance);
        });
      }
    });
  }

  let selectedWords = []; // Array to store multiple selected words
  let selectedWord = ''; 
  let customWord = ''; 
  let frequentWords = []; 

  function updateFrequentWords() {
    frequentWords = getMostFrequentNonGenderedWords(5); 
  }

  function handleWordSelection() {
    if (selectedWord && !selectedWords.includes(selectedWord)) {
      if (selectedWords.length >= 10) {
        selectedWords.shift(); 
      }
      selectedWords.push(selectedWord); 
    }

    if (customWord && !selectedWords.includes(customWord)) {
      if (selectedWords.length >= 10) {
        selectedWords.shift(); 
      }
      selectedWords.push(customWord);
    }

    updateMatrixChart(); 
    customWord = ''; 
  }

  // Update `frequentWords` only when `dynamicClassLabel` is set to a valid class
  $: if ($dynamicClassLabel) {
    selectedWords = [];
    updateMatrixChart();
    frequentWords = getMostFrequentNonGenderedWords(5);
  } else {
    frequentWords = []; 
  }

  function highlightInstancesInDatasetExplorer(word, category) {
    const instances = captionInstances[category]?.[word] || [];
    const instanceIds = instances.map((instance) => instance.id).filter(Boolean);

    if (instanceIds.length > 0) {
      trainingSet.sift({ id: { $in: instanceIds } });
    } else {
      console.warn(`No valid instances found for Word: "${word}" and Category: "${category}".`);
    }
  }

  function generateMatrixData() {
    if (selectedWords.length === 0) {
      return {
        labels: ['No data'],
        datasets: [
          {
            label: 'No data available',
            data: [0],
            backgroundColor: 'rgba(200, 200, 200, 0.7)',
            borderColor: 'rgba(200, 200, 200, 1)',
            borderWidth: 1,
          },
        ],
      };
    }

    const categories =
      $dynamicClassLabel === 'all'
        ? ['male', 'female', 'professional title']
        : ['male', 'female', $dynamicClassLabel];

    const datasets = categories.map((category) => ({
      label: category,
      data: selectedWords.map((word) => coOccurrences[category]?.[word] || 0),
      backgroundColor:
        category === 'male'
          ? 'rgba(54, 162, 235, 0.7)'
          : category === 'female'
            ? 'rgba(75, 192, 192, 0.7)'
            : 'rgba(255, 99, 132, 0.7)',
      borderColor:
        category === 'male'
          ? 'rgba(54, 162, 235, 1)'
          : category === 'female'
            ? 'rgba(75, 192, 192, 1)'
            : 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
    }));

    return {
      labels: selectedWords,
      datasets: datasets,
    };
  }

  async function updateMatrixChart() {
  await tick();

  const canvasEl = document.getElementById('matrixChart') as HTMLCanvasElement;
  if (!canvasEl) {
    console.error('Canvas element not found in DOM.');
    return;
  }

  const barCtx = canvasEl.getContext('2d');
  if (!barCtx) {
    console.error(
      'Failed to get the canvas context. Ensure the canvas is correctly loaded in the DOM.'
    );
    return;
  }

  const barChartData = generateMatrixData();

  if (matrixChart) {
    matrixChart.destroy();
  }

  matrixChart = new Chart(barCtx, {
    type: 'bar',
    data: barChartData,
    options: {
      responsive: true,
      scales: {
        x: {
          stacked: false, // Disable stacking for separate bars per category
          title: {
            display: true,
            text: '',
          },
          labels: barChartData.labels,
        },
        y: {
          stacked: false, 
          beginAtZero: true,
          title: {
            display: true,
            text: 'Frequency',
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label(context) {
              const word = context.label;
              const category = context.dataset.label;
              const count = context.raw;
              return `${category} - ${word}: ${count}`;
            },
          },
        },
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const element = elements[0];
          const datasetIndex = element.datasetIndex;
          const wordIndex = element.index;

          const word = matrixChart.data.labels[wordIndex];
          const category = matrixChart.data.datasets[datasetIndex].label;

          highlightInstancesInDatasetExplorer(word, category);
        }
      },
    },
  });
}

  function getMostFrequentNonGenderedWords(limit) {
    return Object.entries(nonGenderedWordFrequency)
      .sort(([, freqA], [, freqB]) => freqB - freqA)
      .slice(0, limit)
      .map(([word]) => word);
  }

  async function fetchAndProcessCaptions() {
    try {
      await trainingSet.ready;
      const allInstances = await trainingSet.find({ y: $dynamicClassLabel });
      if (allInstances.data.length > 0) {
        allInstances.data.forEach((instance) => {
          if (instance.caption) {
            updateAggregatedPersonFrequency(instance.caption, instance);
          }
        });
        updateMatrixChart();
        updateFrequentWords(); // Update frequent words after data processing
      } else {
        console.warn('Dataset is empty for the selected class.');
      }
    } catch (error) {
      console.error('Error fetching dataset instances:', error);
    }
  } -->
<!-- 
  onMount(async () => {
    await fetchAndProcessCaptions();

    const canvasOverlay = document.querySelector('#fabric-canvas') as HTMLCanvasElement;
    const width = 200;
    const height = 200;

    canvas = new fabric.Canvas(canvasOverlay, {
      isDrawingMode: false,
      width: width,
      height: height,
    });

    dragOverlay = document.querySelector('#drag-overlay');
    if (dragOverlay) {
      dragOverlay.addEventListener('dragstart', onDragStart);
    }

    imageStream
      .filter((img) => !!img)
      .subscribe((img) => {
        loadImageToCanvas(img);
      });

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
      Object.keys(aggregatedPersonFrequency).forEach((key) => (aggregatedPersonFrequency[key] = 0));
      Object.keys(coOccurrences).forEach((key) => (coOccurrences[key] = {}));
      Object.keys(captionInstances).forEach((key) => (captionInstances[key] = {}));

      fetchAndProcessCaptions();
    }
  }

  onDestroy(() => {
    if (dragOverlay) {
      dragOverlay.removeEventListener('dragstart', onDragStart);
    }
  });

  function loadImageToCanvas(img: ImageData) {
    if (canvas) {
      canvas.clear();

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;

      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(img, 0, 0);

        const imgElement = new Image();
        imgElement.src = tempCanvas.toDataURL();

        imgElement.onload = function () {
          if (canvas) {
            if (imageObject) {
              canvas.remove(imageObject);
            }

            imageObject = new fabric.Image(imgElement, {
              left: 0,
              top: 0,
              selectable: false,
              evented: false,
            });

            canvas.add(imageObject);
            canvas.renderAll();
          }
        };
      }
    }
  }

  function onDragStart(event: DragEvent) {
    const canvasElement = document.querySelector('#fabric-canvas') as HTMLCanvasElement;
    const currentCaption = caption.$value.get();

    if (canvasElement) {
      const canvasUrl = canvasElement.toDataURL('image/png');
      const data = JSON.stringify({
        type: 'image-caption',
        src: canvasUrl,
        caption: currentCaption || 'No caption generated',
      });

      event.dataTransfer?.setData('text/plain', data);
    } else {
      console.error('Canvas element not found');
    }
  }
</script> -->
<!-- 
<div class="marcelle card">
  <div class="conf-row">
    <div
      class="group-components-container instax-style"
      draggable="true"
      on:dragstart={onDragStart}
    >
      <div class="canvas-container">
        <canvas id="fabric-canvas" width="100" height="200"></canvas>
        <div id="drag-overlay" class="drag-overlay"></div>
      </div>
      <div class="marcelle-component caption" use:marcelle={caption}></div>
    </div>

    <div class="flex flex-col items-center gap-2 chart-container">
        <div
        class="tooltip tooltip-open tooltip-accent tooltip-top"
        data-tip="the person in the image is identified as:"
      >
      <canvas id="matrixChart" width="400" height="200"></canvas>
      </div>
      <div
        class="tooltip tooltip-open tooltip-accent tooltip-top"
        data-tip="Select frequent words or add custom words to analyze their occurrences."
      >
        <div class="word-selection">
          <div class="dropdown dropdown-top">
            <div
              tabindex="0"
              role="button"
              class="btn btn-xs m-1"
              aria-disabled={!$dynamicClassLabel || $dynamicClassLabel === 'all'}
            >
              Suggested Words
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
          </div>

          <input
            type="text"
            bind:value={customWord}
            placeholder="new word"
            class="input input-bordered input-xs w-full max-w-xs"
          />

          <button
            on:click={handleWordSelection}
            disabled={selectedWords.length >= 10}
            class="btn btn-secondary btn-xs">Add Word</button
          >

          <button
            on:click={() => {
              selectedWords = [];
              updateMatrixChart();
            }}
            class="btn btn-xs">Clear All</button
          >
        </div>
      </div>
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

  .btn {
    font-size: 0.7rem;
    font-weight: normal;
  }

  h3 {
    color: var(--heading-color);
    margin: 0px;
    font-size: small;
    text-align: left;
  }

  .marcelle-component.caption {
    font-size: 0.8rem;
    color: var(--heading-color);
    padding: 5px;
    text-align: center;
    border: none;
  }

  .conf-row {
    display: flex;
    gap: 10px;
    height: 100%;
    align-items: center;
  }

  .marcelle-component {
    border: 1px solid #ddd;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .canvas-container {
    position: relative;
    width: 200px;
    height: 200px;
  }

  canvas {
    width: 100%;
    height: 100%;
    pointer-events: auto;
    z-index: 10;
    background-color: transparent;
  }

  .drag-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: transparent;
    z-index: 20;
    cursor: grab;
  }

  .group-components-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: center;
  }

  .instax-style {
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
    width: 220px;
    height: 270px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  .word-selection {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 5px;
    font-size: 0.8rem;
  }

  .dropdown {
    z-index: 10;
  }

  input {
    font-size: 0.7rem;
    width: 85px;
    height: 20px;
    margin-right: 5px;
    border-color: #ddd;
  }

  .tooltip::before {
  max-width: 30rem;
  white-space: normal;
  border-radius: 0.25rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  padding-top: 0.15rem;
  padding-bottom: 0.15rem;
  font-size: 0.7rem;
  line-height: 1rem;
  background-color: var(--tooltip-color);
  color: var(--tooltip-text-color);
  width: max-content;
}

.tooltip {
    margin-top: 10px;
}
</style> -->
