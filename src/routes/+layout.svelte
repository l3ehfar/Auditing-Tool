<script lang="ts">
  import Dataset from '$lib/dataset/Dataset.svelte';
  import './styles.css';
  import "tailwindcss/tailwind.css";
</script>

<div class="container">
  <div class="fixed">
    <Dataset />
  </div>
  <div class="routed">
    <slot />
  </div>
</div>

<style>
  .container {
    display: flex;
    height: 100vh;
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
    overflow: hidden; /* Prevent scrolling */
    padding-top: 8px;
    padding-bottom: 8px;
  }
</style>
