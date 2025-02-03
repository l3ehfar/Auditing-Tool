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

<div class="flex h-screen w-screen">
  <div class="h-full p-1 gap-1 w-1/3">
    <div class="text-center">
      <h2 class="text-xl my-2">Data Explorer</h2>
    </div>
    {#if data.user?.condition === 'conditionThree'}
      <div class="cond3">
        <KeywordFilter />
      </div>
    {/if}
    <div class="slot-section">
      <Dataset />
    </div>
  </div>
  <div class="p-1 px-12">
    <div class="text-center mb-2">
      <h2 class="text-xl my-2">Evidence Inspector</h2>
    </div>
    {#if data.user?.condition === 'conditionTwo'}
      <DrawingInterface />
    {:else}
      <ClassicInterface />
    {/if}
  </div>
  <div class="flex-1">
    <div class="text-center">
      <h2 class="text-xl my-2">Audit Report</h2>
    </div>
    <Schemas />
  </div>
</div>

<style>
  .slot-section {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2px;
    overflow: hidden;
  }
</style>
