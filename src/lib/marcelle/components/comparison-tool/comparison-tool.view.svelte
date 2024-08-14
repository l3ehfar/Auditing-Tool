<script lang="ts">
  import { ViewContainer } from '@marcellejs/design-system';
  import { Stream } from '@marcellejs/core';

  export let title: string;
  export let comparisonItems: Stream<Array<{ thumbnail: string; label: string; caption: string }>>;

  let items: Array<{ thumbnail: string; label: string; caption: string }> = [];

  $: (function loadItems() {
    const storedItems = localStorage.getItem('comparisonItems');
    if (storedItems) {
      items = JSON.parse(storedItems);
      comparisonItems.set(items); 
    }
  })();

  $: comparisonItems.subscribe((value) => {
    items = value;
    localStorage.setItem('comparisonItems', JSON.stringify(items)); 
  });

  function removeItem(index: number) {
    items.splice(index, 1);
    comparisonItems.set([...items]);
    localStorage.setItem('comparisonItems', JSON.stringify(items)); 
  }
</script>

<ViewContainer {title}>
  <h1 class="text-left">Comparison Tool</h1>
  {#if items.length > 0}
    <div class="comparison-list">
      {#each items as item, index}
        <div class="comparison-item bg-gray-100 border border-gray-300 rounded-lg p-4 m-2 flex items-center relative">
          <button class="btn btn-xs btn-error remove-btn absolute" on:click={() => removeItem(index)}>✕</button>
          <img src={item.thumbnail} alt="Compared Image" class="thumbnail"/>
          <div class="flex-1 text-center mx-4">
            <h3 class="text-sm">{item.caption}</h3>
          </div>
          <div class="text-right">
            <h3 class="font-bold text-sm">{item.label}</h3>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <h3 class="text-gray-500 no-items">No items added for comparison.</h3>
  {/if}
</ViewContainer>

<style>
  h1 {
    text-align: left;
    font-size: 0.75rem;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .comparison-list {
    max-height: 192px; /* Adjust this height based on the size of two items */
    overflow-y: auto;
  }

  .thumbnail {
    width: 70px;
    height: 70px;
    border-radius: 8px;
    object-fit: cover;
  }

  .comparison-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 575px;
    padding: 8px;
    margin-bottom: 0px;
    position: relative;
    min-height: 80px; 
  }

  .remove-btn {
    top: -5px;
    right: -5px;
  }

  .text-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    padding-right: 3px;
  }

  .no-items {
    margin-top: 10px;
  }

</style>
