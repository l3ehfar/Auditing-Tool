<script lang="ts">
  import { selectClass, datasetExplorerComponent } from '$lib/marcelle';
  import { marcelle } from '$lib/utils';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faMagnifyingGlassMinus, faMagnifyingGlassPlus } from '$lib/icons';
  import { zoomLevelStore } from '$lib/store';
  import { derived } from 'svelte/store';

  // let showDatasetWindow: boolean = false;
  let zoomLevel: number = 1;

  // Create a derived store to count the selected items
  const selectedCount = derived(
    datasetExplorerComponent.$selected,
    ($selected) => $selected.length,
  );

  // function toggleDatasetWindow(): void {
  //     showDatasetWindow = !showDatasetWindow;
  // }

  // function handleClickOutside(event: MouseEvent): void {
  //     const modalContent = document.querySelector('.dataset-window .window-content') as HTMLElement;
  //     if (modalContent && !modalContent.contains(event.target as Node)) {
  //         showDatasetWindow = false;
  //     }
  // }

  // function handleKeyDown(event: KeyboardEvent): void {
  //     if (event.key === 'Escape') {
  //         showDatasetWindow = false;
  //     }
  // }

  function zoomIn(): void {
    if (zoomLevel < 2) {
      zoomLevel = Math.min(zoomLevel * 2, 2); // Cap the zoom level at 2
      zoomLevelStore.set(zoomLevel);
    }
  }

  function zoomOut(): void {
    if (zoomLevel > 1) {
      zoomLevel = Math.max(zoomLevel / 2, 1); // Cap the zoom level at 1
      zoomLevelStore.set(zoomLevel);
    }
  }

</script>

<!-- <h1 class="title">Dataset Browser</h1> -->
<div class="content">
  <div class="marcelle card">
    <div class="conf-row dataset-tools">
      <!-- <div
        class="tooltip tooltip-open tooltip-accent tooltip-right"
        data-tip="choose a job profession"
      > -->
        <!-- <div class="selector" use:marcelle={selectClass}></div> -->
      <!-- </div> -->
      <div class="right-tools">
        <button class="icon" on:click={zoomOut}>
          <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
        </button>
        <button class="icon" on:click={zoomIn}>
          <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
        </button>
        <!-- <div class="tooltip tooltip-left tooltip-secondary custom-tooltip" data-tip="Hold Ctrl (or Cmd on Mac) to select multiple images. Hold Shift to select all images between the first and last clicked.">
                    <div class="badge badge-outline">
                        selected: {$selectedCount}
                    </div>
                </div>
                {#if $selectedCount > 0}
                    <button class="badge badge-error gap-2" on:click={() => datasetExplorerComponent.$selected.set([])}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          class="inline-block h-4 w-4 stroke-current">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        cancel selection
                    </button>
                {/if} -->
      </div>
    </div>
    <div use:marcelle={datasetExplorerComponent} class="dataset" />
  </div>
  <!-- <div class="conf-row btn-container">
        <div class="dropdown dropdown-top dropdown-end">
            <div tabIndex={0} role="button" class="btn btn-sm m-1 btn-primary">Explore Subsets</div>
            <ul tabIndex={0} class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
              <li><button on:click={toggleDatasetWindow}>Subset 1</button></li>
              <li><button on:click={toggleDatasetWindow}>Subset 2</button></li>
            </ul>
          </div>

        <div class="dropdown dropdown-top">
            <div tabIndex={0} role="button" class="btn btn-sm m-1 btn-primary">Add to Subset</div>
            <ul tabIndex={0} class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                <li><button>Subset 1</button></li>
                <li><button>Subset 2</button></li>
                <li><button>Make a new subset</button></li>
            </ul>
        </div>
    </div> -->
</div>

<!-- 
{#if showDatasetWindow}
    <div class="dataset-window" on:click={handleClickOutside} on:keydown={handleKeyDown}>
        <div class="window-content">
            <div class="window-header">
                <h3>Dataset Subset</h3>
                <button class="btn btn-xs btn-outline btn-error" on:click={toggleDatasetWindow}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      class="inline-block h-4 w-4 stroke-current">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    close
                </button>
            </div>
            <div class="dataset-content">
               
            </div>
        </div>
    </div>
{/if} -->

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .content {
    width: 100%;
    max-width: var(--column-width);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    height: 50vh;
  }

  /* .title {
    position: absolute;
    top: 0;
    left: 0;
    font-size: 1rem;
    margin-left: 10px;
    margin-top: 10px;
} */

  .card {
    padding-top: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .selector {
    margin-top: 0;
  }

  /* .btn {
    margin: 2px;
    color: var(--heading-color);
    font-weight: normal;
} */
  /* 
.badge {
    margin: 2px;
    padding-top: 10px;
    padding-bottom: 12px;
}

.badge-outline {
    cursor: default;
}

button.badge:hover {
    background-color: oklch(var(--b3));
} */

  .icon {
    font-size: larger;
    margin: 2px;
    cursor: pointer;
  }

  .dataset-tools {
    display: flex;
    justify-content: space-between; /* Ensures the left and right side split */
    align-items: center; /* Vertically center the items */
    padding-top: 10px;
    margin-bottom: 4px;
  }

  .right-tools {
    display: flex; /* Align elements in a row */
    align-items: center;
  }

  .dataset {
    flex-grow: 1;
    overflow: auto;
    max-height: calc(100% - 50px);
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

  /* .conf-row.btn-container {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    margin-bottom: 5px;
}

.dataset-window {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.window-content {
    background-color: white;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    width: 80%;
    max-width: 600px;
}

.window-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.dataset-content {
    margin-top: 20px;
} */

  /* .custom-tooltip::before {
    font-size: 0.70rem; 
    color: var(--heading-color);
} */
</style>
