<script lang="ts">
  import { page } from '$app/stores';
  import Dataset from '$lib/dataset/Dataset.svelte';
  import Schemas from '$lib/schemas/Schemas.svelte';
  import './styles.css';
  import 'tailwindcss/tailwind.css';
  import { onMount } from 'svelte';

  let currentRoute = '';
  $: currentRoute = $page.url.pathname;

  let userCondition = 'conditionTwo';

  const steps = [
    { path: '/pre-questionnaire', label: 'Step 1' },
    { path: '/ASI-questionnaire', label: 'Step 2' },
    { path: `/${userCondition}`, label: 'Step 5' },
    { path: '/post-questionnaire', label: 'Step 6' },
  ];

  let currentStepIndex = -1;
  $: currentStepIndex = steps.findIndex((step) => step.path === $page.url.pathname);

  let progressPercentage = 0;
  $: progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  function showHelp() {
    alert('Help information goes here!');
  }

  let overallTimeLeft = 30; // Default time in seconds
  let timerInterval: NodeJS.Timer | null = null;

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${minutes}:${secs}`;
  }

  function startCountdown() {
    if (!timerInterval) {
      timerInterval = setInterval(() => {
        if (overallTimeLeft > 0) {
          overallTimeLeft -= 1;
          localStorage.setItem('schemasTimer', JSON.stringify(overallTimeLeft));
        } else {
          clearInterval(timerInterval);
          timerInterval = null;
        }
      }, 1000);
    }
  }

  function stopCountdown() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  $: {
    if (currentRoute.includes(userCondition)) {
      // User is on `conditionTwo` page
      const savedTimer = localStorage.getItem('schemasTimer');
      overallTimeLeft = savedTimer ? JSON.parse(savedTimer) : overallTimeLeft;
      startCountdown();
    } else {
      // User is not on `conditionTwo` page
      stopCountdown();
    }
  }

  onMount(() => {
    return () => {
      // Clean up the timer on component unmount
      stopCountdown();
    };
  });

</script>

<div class="layout-container">
  {#if currentStepIndex !== -1}
    <div class="progress-container">
      <div class="progress-wrapper">
        <div class="progress-info">
          Step {currentStepIndex + 1} / {steps.length}
        </div>
        <progress class="progress progress-accent" value={progressPercentage} max="100"></progress>
        {#if currentRoute.includes('condition')}
          <div class="timer-container">
            <span class="timer">{formatTime(overallTimeLeft)}</span>
            <button class="btn btn-xs btn-secondary" on:click={showHelp}>Help</button>
          </div>
        {/if}
      </div>
    </div>
  {/if}

  {#if currentStepIndex === -1 || (currentRoute !== '/post-questionnaire' && currentRoute !== '/pre-questionnaire' && currentRoute !== '/ASI-questionnaire' && currentRoute !== '/auth/signup' && currentRoute !== '/auth/login')}
    <div class="main-section">
      <div class="left-panel">
        <div class="slot-section">
          <Dataset />
        </div>
        <div class="dataset-section">
          <slot />
        </div>
      </div>
      <div class="right-panel">
        <Schemas />
      </div>
    </div>
  {:else}
    <div class="routed-full">
      <slot />
    </div>
  {/if}
</div>

<style>
  .layout-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #ffffff;
    position: relative;
  }

  .progress-container {
    position: fixed;
    top: 7px;
    left: 20px;
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0px 1px 5px rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 6px;
    z-index: 1000;
  }

  .timer-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .timer {
    font-size: 14px;
    color: #666;
  }

  .progress-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .progress {
    flex: 1;
    height: 10px;
  }

  .progress-info {
    font-size: 14px;
    color: #666;
    min-width: 50px;
    text-align: left;
  }

  .btn {
    font-weight: 100;
  }
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

  .routed-full {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
</style>
