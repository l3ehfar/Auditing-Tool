<script lang="ts">
  import { base } from '$app/paths';
  import { status } from './marcelle/logging';
  import { getPhase, pageProgress, PHASES } from './marcelle/progress';
</script>

<div class="navbar bg-base-100 text-sm min-h-0 sticky top-0 z-50 shadow-md">
  <div class="flex-1 navbar-start">
    <a class="btn btn-ghost btn-sm" href="{base}/">Auditing Study</a>
    <div>
      {#each PHASES as phase}
        <span class:active={phase.pages.includes($status.page)} class="mx-2">{phase.title}</span> >
      {/each}
      end
    </div>
  </div>
  <div class="flex-none flex flex-col mx-4 gap-2">
    {#if getPhase($status.page).timeBased}
      TODO: timer
    {:else}
      <span>Page Progress: {Math.round($pageProgress)}%</span>
    {/if}
    <progress class="progress w-40" value={$pageProgress} max="100"></progress>
  </div>
</div>

<style>
  .active {
    @apply font-bold text-green-800 underline;
  }
</style>
