<script lang="ts">
  import { page } from '$app/stores';
  import logo from './svelte-logo.svg';
</script>

<header>
  <!-- <div class="corner">
    <a href="https://kit.svelte.dev">
      <img src={logo} alt="SvelteKit" />
    </a>
  </div> -->

  <nav>
    <ul>
      <li class:active={$page.url.pathname === '/model'}>
        <a data-sveltekit-prefetch href="/model">Model</a>
      </li>
      <li class:active={$page.url.pathname === '/statistics'}>
        <a data-sveltekit-prefetch href="/statistics">Statistics</a>
      </li>
      <li class:active={$page.url.pathname === '/auditForm'}>
        <a data-sveltekit-prefetch href="/auditForm">Audit Form</a>
      </li>
    </ul>
  </nav>

 <!-- <div class="corner">
    TODO put something else here? github link? 
  </div>  -->
</header>

<style>
header {
  display: flex;
  justify-content: flex-end;
}

nav {
  position: fixed;
  top: 0;
  right: 0;
  width: 50%;
  display: flex;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7); 
}

ul {
  /* position: relative; */
  padding: 0;
  margin: 0;
  height: 3em;
  display: flex;
  justify-content: space-around;
  list-style: none;
  background: var(--background); 
  width: 100%;
  align-items: center; 
}

li {
  position: relative;
  height: 100%;
  flex: 1; 
  display: flex;
  justify-content: center; 
  align-items: center;
  background-color: oklch(var(--b2));
}

li:hover, li.active{
  background-color: oklch(var(--a));
}

nav a {
  display: flex; 
  height: 100%;
  width: 100%; 
  align-items: center; 
  justify-content: center; 
  padding: 0 1em;
  color: var(--heading-color);
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-decoration: none;
  transition: color 0.2s linear;
}

</style>
