<script lang="ts">
  import { datasetExplorerComponent, TutorialdatasetExplorerComponent } from '$lib/marcelle';
  import { marcelle } from '$lib/utils';

  export let phase: 'tutorial' | 'main';

  const DatasetExplorer = phase === 'tutorial' ? TutorialdatasetExplorerComponent : datasetExplorerComponent;

</script>

<div class="content">
  <div class="dataset marcelle card">
    <div class="dataset-tutorial">
    <div use:marcelle={DatasetExplorer} class="dataset" />
    </div>
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

.card {
    padding-top: 0;
    display: flex;
    flex-direction: column;
    height: 100vh; 
    overflow: hidden; 
  }

  .dataset {
    flex-grow: 1;
    overflow: auto; 
    /* max-height: calc(100vh - 50px);  */
  }



</style>
