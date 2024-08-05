<script lang="ts">
  import Header from '$lib/header/Header.svelte';
  import Dataset from '$lib/dataset/Dataset.svelte';
  import './styles.css';
  import "tailwindcss/tailwind.css";
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
</script>

<Header />

<!-- <main>
  <slot />
</main> -->

<div class="container">
  <div class="fixed">
    <Dataset />
  </div>
  <div class="routed">
    <slot />
  </div>
</div>

<!-- <footer>
  <p>
    visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to learn SvelteKit || visit
    <a href="https://marcelle.dev">marcelle.dev</a> to learn Marcelle
  </p>
</footer> -->

<style>
  .container {
    display: flex;
    height: 100vh;
  }
  .fixed {
    flex: 1;
    background-color: oklch(var(--b2)); 
    position: relative;
  }
  .routed {
    background-color: oklch(var(--b1));
    flex: 1;
  }

  /* main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    width: 100%;
    max-width: 1024px;
    margin: 0 auto;
    box-sizing: border-box;
  } */

  /* footer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 40px;
  }

  footer a {
    font-weight: bold;
  }

  @media (min-width: 480px) {
    footer {
      padding: 40px 0;
    }
  } */
</style>
