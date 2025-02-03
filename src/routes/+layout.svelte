<script lang="ts">
  import '@marcellejs/core/dist/marcelle.css';
  import './styles.css';
  import Header from '$lib/Header.svelte';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
</script>

<div class="m-0 p-0 min-h-screen bg-slate-100">
  {#if $page.url.pathname !== `${base}/`}
    <Header />
  {/if}
  <div class="p-2">
    <slot />
  </div>
</div>
