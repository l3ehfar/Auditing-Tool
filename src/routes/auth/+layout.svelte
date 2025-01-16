<script lang="ts">
    import { page } from '$app/stores';
  
    let breadcrumbs = [{ name: 'Home', href: '/' }];
    for (const part of $page.url.pathname.split('/').slice(1).filter(Boolean)) {
      breadcrumbs.push({
        name: part[0].toUpperCase() + part.slice(1),
        href: breadcrumbs[breadcrumbs.length - 1].href + '/' + part,
      });
    }
  </script>
  
  <div>
    <header class="flex justify-between items-center">
      <nav>
        <ul class="breadcrumbs">
          {#each breadcrumbs as { name, href }}
            <li><a href={href}>{name}</a></li>
          {/each}
        </ul>
      </nav>
      <button class="btn btn-circle btn-outline" on:click={() => history.back()}>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </header>
    <main>
      <slot />
    </main>
  </div>
  
  <style>
    header {
      margin: 1rem;
    }
  
    .breadcrumbs {
      display: flex;
      gap: 0.5rem;
      font-size: 0.85rem;
    }
  
    .breadcrumbs a {
      text-decoration: none;
      color: gray;
    }
  
    main {
      margin: 2rem auto;
      max-width: 786px;
      width: 100%;
    }
  </style>
  