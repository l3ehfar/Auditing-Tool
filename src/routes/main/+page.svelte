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

<div class="grid h-screen w-screen grid-cols-layout gap-2 p-2">
  <div class="flex flex-col h-full p-2 bg-white shadow rounded-lg">
    <div class="text-center">
      <h2 class="text-xl my-2">Dataset Explorer</h2>
    </div>
    {#if data.user?.condition === 'conditionThree'}
      <div class="cond3">
        <KeywordFilter />
      </div>
    {/if}
    <div class="slot-section flex-1 overflow-auto p-2">
      <Dataset />
    </div>
  </div>
  <div class="flex flex-col h-full p-2 bg-white shadow rounded-lg">
    <div class="text-center mb-2">
      <h2 class="text-xl my-2">Model's Captions</h2>
    </div>
    <div class="content-container">
      {#if data.user?.condition === 'conditionTwo'}
        <DrawingInterface />
      {:else}
        <ClassicInterface />
      {/if}
    </div>
  </div>
  <div class="flex flex-col h-full p-2 bg-white shadow rounded-lg">
    <div class="text-center">
      <h2 class="text-xl my-2">Bias Cards</h2>
    </div>
    <div class="flex-1 overflow-auto p-2 rounded">
      <Schemas />
    </div>
  </div>
</div>

<style>
  .slot-section {
    min-height: 0;
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    overflow: hidden;
  }

  .flex {
    height: calc(100vh - 5rem);
    min-height: 0;
  }

  .flex-1 {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .grid {
    display: grid;
    grid-template-columns: 1fr auto 2fr;
    gap: 1rem;
    height: 100%;
    width: 100%;
  }

  .content-container {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 0;
  }
</style>
