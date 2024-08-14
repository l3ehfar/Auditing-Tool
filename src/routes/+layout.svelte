<script lang="ts">
  import Header from '$lib/header/Header.svelte';
  import Dataset from '$lib/dataset/Dataset.svelte';
  import './styles.css';
  import "tailwindcss/tailwind.css";
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { onMount } from 'svelte';
  // import { OverlayScrollbars } from 'overlayscrollbars';
  // import 'overlayscrollbars/styles/overlayscrollbars.css';

  // onMount(() => {
  //   // Select all elements with these classes
  //   const elements = document.querySelectorAll('.overflow-y-auto, .scrollable');

  //   // Convert NodeList to an array and initialize OverlayScrollbars for each element
  //   elements.forEach(element => {
  //     OverlayScrollbars(element as HTMLElement, {
  //       className: 'os-theme-dark', // Use a predefined theme or your custom class
  //       scrollbars: {
  //         clickScroll: true, // Enable click scrolling
  //         dragScroll: true,  // Enable drag scrolling
  //         visibility: 'auto', // Show scrollbar only when needed
  //       },
  //     });
  //   });
  // });
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
    overflow-y: auto; /* Ensure this section can scroll */
  }

  .routed {
    background-color: rgb(243, 244, 246);
    flex: 1;
    overflow-y: auto; /* Ensure this section can scroll */
  }

</style>
