<script lang="ts">
  import ClassicInterface from '$lib/interfaces/ClassicInterface.svelte';
  import KeywordFilter from '$lib/interfaces/KeywordFilter.svelte';
  import DrawingInterface from '$lib/interfaces/DrawingInterface.svelte';
  import Dataset from '$lib/dataset/Dataset.svelte';
  import Schemas from '$lib/schemas/Schemas.svelte';
  import { onMount } from 'svelte';
  import { checkAndRedirect } from '$lib/redirections';
  import { type User } from '$lib/marcelle';
  import { setProgress } from '$lib/marcelle/logging';

  export let data: { user: User | null };

  onMount(async () => {
    await checkAndRedirect(data.user, 'main');
    setProgress('main');
  });
</script>

<div class="flex flex-col h-screen">
  <div class="main-section">
    <div class="left-panel">
      {#if data.user?.condition === 'conditionThree'}
        <div class="cond3">
          <KeywordFilter />
        </div>
      {/if}
      <div class="slot-section">
        <Dataset />
      </div>
      <div class="dataset-section">
        {#if data.user?.condition === 'conditionTwo'}
          <DrawingInterface />
        {:else}
          <ClassicInterface />
        {/if}
      </div>
    </div>
    <div class="right-panel">
      <Schemas />
    </div>
  </div>
</div>

<style>
  .main-section {
    display: flex;
    flex: 1;
    height: 100%;
    width: 100%;
  }

  .left-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 2px;
    gap: 2px;
    background-color: oklch(var(--b2));
  }

  .slot-section,
  .dataset-section {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2px;
    overflow: hidden;
  }

  .right-panel {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 2px;
  }
</style>
