<script lang="ts">
  import { ViewContainer } from '@marcellejs/design-system';
  import type { Stream } from '@marcellejs/core';

  // Exported props to be used by the parent component.
  export let loading: Stream<boolean>; // Stream indicating the model loading state.
  export let title: string; // Model title.
  export let task: string; // The task that the model performs.
  export let modelUsed: string; // The specific model being used.
</script>

<ViewContainer {title} loading={$loading}>
  <!-- Display information about the task and the model used -->
  <span class="text-sm text-gray-600">
    {#if $loading}
      <!-- Display during loading -->
      {task}&nbsp;
    {:else}
      <!-- Display after loading is complete -->
      Using Hugging Face {#if modelUsed} {modelUsed} {/if} for {task}.
    {/if}
  </span>
</ViewContainer>

<style></style>