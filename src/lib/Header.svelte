<script lang="ts">
  import { base } from '$app/paths';
  import { get } from 'svelte/store';
  import { status } from './marcelle/logging';
  import { getPhase, pageProgress, PHASES } from './marcelle/progress';
  import {
    formattedTime,
    timeProgress,
    isTimerRunning,
    stopTimer,
    startTimer,
    timeLeft,
  } from './marcelle/timer';
  import { goto } from '$app/navigation';

  function helpPage() {
    window.open(`${base}/video-tutorial`, '_blank');
  }

  function toggleTimer() {
    if (get(isTimerRunning)) {
      stopTimer();
    } else {
      startTimer();
    }
  }

  function submitStudy() {
  const confirmation = confirm("Are you sure you want to proceed to next step? You won't be able to return to this page.");
  if (confirmation) {
    goto(`${base}/hypotheses-questionnaire`);
  }
}

</script>

<div class="navbar bg-base-100 text-sm min-h-0 sticky top-0 z-50 shadow-md">
  <div class="flex-1 navbar-start">
    <a class="btn btn-ghost btn-sm" href="{base}/">Auditing Study</a>
    <div>
      {#each PHASES as phase, index}
        <span class:active={phase.pages.includes($status.page)} class="mx-2">{phase.title}</span>
        {#if index < PHASES.length - 1}
          <span> > </span>
        {/if}
      {/each}
    </div>
  </div>
  <div class="flex-none flex items-center mx-4 gap-4">
    {#if getPhase($status.page).timeBased}
      <button class="btn btn-xs btn-success" on:click={submitStudy} disabled={$timeLeft > 180}>
        Proceed
      </button>
      <button class="btn btn-xs btn-primary" on:click={helpPage}>help</button>
      <button
        class="btn btn-xs {$isTimerRunning ? 'btn-error' : 'btn-accent'}"
        on:click={toggleTimer}
      >
        {#if $isTimerRunning}Pause Timer{/if}
        {#if !$isTimerRunning}Resume Timer{/if}
      </button>
      <div class="flex flex-col items-center">
        <span>Timer: {$formattedTime}</span>
        <progress class="progress w-40" value={$timeProgress} max="100"></progress>
      </div>
    {:else}
      <span>Page Progress: {Math.round($pageProgress)}%</span>
      <progress class="progress w-40" value={$pageProgress} max="100"></progress>
    {/if}
  </div>
</div>

<style>
  .active {
    @apply font-bold text-green-800 underline;
  }
</style>
