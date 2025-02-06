<script lang="ts">
  import { selectClass, datasetExplorerComponent } from '$lib/marcelle';
  import { marcelle } from '$lib/utils';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faMagnifyingGlassMinus, faMagnifyingGlassPlus } from '$lib/icons';
  import { zoomLevelStore } from '$lib/store';
  import { derived } from 'svelte/store';
  import { writable } from 'svelte/store';

  // let showDatasetWindow: boolean = false;
  let zoomLevel: number = 1;

  // Create a derived store to count the selected items
  const selectedCount = derived(
    datasetExplorerComponent.$selected,
    ($selected) => $selected.length,
  );


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

<div class="content">
  <div class="marcelle card">
    <div class="conf-row dataset-tools">

      <div class="timer-display">
        <!-- Timer: {$timeDisplay} -->
      </div>

      <div class="right-tools">
        <button class="icon" on:click={zoomOut}>
          <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
        </button>
        <button class="icon" on:click={zoomIn}>
          <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
        </button>
     
      </div>
    </div>
    <div use:marcelle={datasetExplorerComponent} class="dataset" />
  </div>
 
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .content {
    width: 100%;
    max-width: var(--column-width);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    height: 100%; 
    overflow: hidden; 
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
    height: 100vh; 
    overflow: hidden; 
  }

  .selector {
    margin-top: 0;
  }

  .timer-display {
    background-color: rgba(255, 255, 255);
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 0.9rem;
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
    justify-content: space-between; 
    align-items: center;
    padding-top: 10px;
    margin-bottom: 4px;
  }

  .right-tools {
    display: flex; 
    align-items: center;
  }

  .dataset {
    flex-grow: 1;
    overflow: auto; 
    max-height: calc(100vh - 50px); 
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
