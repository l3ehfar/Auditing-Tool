<script lang="ts">
  import { page } from '$app/stores'; 
  import Dataset from '$lib/dataset/Dataset.svelte';
  import Schemas from '$lib/schemas/Schemas.svelte';
  import './styles.css';
  import "tailwindcss/tailwind.css";

  let currentRoute = '';
  $: currentRoute = $page.url.pathname; 
</script>

<div class="layout-container">
  {#if currentRoute !== '/post-questionnaire' && currentRoute !== '/pre-questionnaire' && currentRoute !== '/ASI-questionnaire' && currentRoute !== '/auth/signup' && currentRoute !== '/auth/login'}
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
    background-color: oklch(var(--b2));
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
  }

  .slot-section {
    flex: 1; 
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2px;
    overflow: hidden; 
  }

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
