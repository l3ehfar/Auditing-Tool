<script lang="ts">
  import { ViewContainer } from '@marcellejs/design-system';
  import { Stream } from '@marcellejs/core';

  export let title: string;
  export let comparisonItems: Stream<Array<{ thumbnail: string; caption: string }>>; 

  let items: Array<{ thumbnail: string; caption: string }> = []; 

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
  {#if items.length > 0}
    <div class="comparison-list">
      {#each items as item, index}
        <div class="comparison-item bg-gray-100 border border-gray-300 rounded-lg p-3 m-1 flex items-center relative">
          <button class="btn btn-xs btn-error remove-btn absolute" on:click={() => removeItem(index)}>✕</button>
          <img src={item.thumbnail} alt="Compared Image" class="thumbnail"/>
          <div class="flex-1 text-center mx-2">
            <h3 class="text-sm">{item.caption}</h3>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <h3 class="text-gray-500 no-items">No items added for comparison.</h3>
  {/if}
</ViewContainer>

<style>
  h3 {
    font-size: 0.7em;
  }

  .comparison-list {
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box; 
    height: 220px;
  }

  .thumbnail {
    width: 60px; 
    height: 60px;
    border-radius: 8px;
    object-fit: cover;
  }

  .comparison-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px; 
    margin: 5px 2px; 
    position: relative;
    min-height: 70px; 
  }

  .remove-btn {
    top: -5px;
    right: -5px;
  }

  .no-items {
    margin-top: 10px;
  }

</style>
