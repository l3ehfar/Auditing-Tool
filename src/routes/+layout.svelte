<script lang="ts">
  import { page } from '$app/stores'; 
  import Dataset from '$lib/dataset/Dataset.svelte';
  import AffinityDiagram from '$lib/affinityDiagram/AffinityDiagram.svelte';
  import './styles.css';
  import "tailwindcss/tailwind.css";

  let currentRoute = '';
  $: currentRoute = $page.url.pathname; 
</script>

<div class="layout-container">
  {#if currentRoute !== '/post-questionnaire'  && currentRoute !== '/pre-questionnaire' && currentRoute !== '/ASI-questionnaire' && currentRoute !== '/auth/signup' && currentRoute !== '/auth/login'}
   
    <div class="top-section">
      <div class="fixed">
        <Dataset />
      </div>
      <div class="routed">
        <slot />
      </div>
    </div>
  
    <div class="bottom-section">
      <AffinityDiagram />
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
  }

  .top-section {
    flex: 1; 
    display: flex;
    background-color: oklch(var(--b2));
  }

  .fixed {
    flex: 1;
    position: relative;
    overflow-y: auto;
  }

  .routed {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50vh;
    max-width: 50vw;
    overflow: hidden;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .bottom-section {
    flex: 1; 
    background-color: oklch(var(--b2));
    display: flex;
    align-items: center;
    justify-content: center;
    padding-right: 5px;
    padding-left: 5px;
    padding-bottom: 5px;
  }
</style>
