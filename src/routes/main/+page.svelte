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
  import { isTimerRunning } from '$lib/marcelle/timer';

  export let data: { user: User | null };

  onMount(async () => {
    await checkAndRedirect(data.user, 'main');
    setProgress('main');
  });
</script>

<div class="grid-container">
  <div class="grid h-screen w-screen grid-cols-layout gap-2 p-2">
    <div class="flex flex-col h-full p-2 bg-white shadow rounded-lg">
      <div class="text-center">
        <h2 class="text-xl my-2">Dataset Explorer</h2>
      </div>

      {#if data.user?.condition === 'conditionThree'}
        <div class="cond3">
          <KeywordFilter phase="main" />
        </div>
      {/if}
      <div class="slot-section flex-1 overflow-auto p-2">
        <Dataset phase="main" />
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
        <Schemas userID={data.user?._id} />
      </div>
    </div>
  </div>

  {#if !$isTimerRunning}
    <div class="overlay">
      <div class="overlay-message">
        <h2>Study Paused</h2>
        <p>Please resume the timer to continue.</p>
      </div>
    </div>
  {/if}
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

  .grid-container {
    position: relative;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4); /* Semi-transparent black */
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 50;
  }

  .overlay-message {
    background: white;
    padding: 20px 30px;
    border-radius: 10px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
    text-align: center;
  }

  .overlay-message h2 {
    font-size: 1.5rem;
    color: #d9534f; /* Red color */
    margin-bottom: 10px;
  }

  .overlay-message p {
    font-size: 1rem;
    color: #333;
  }
</style>
