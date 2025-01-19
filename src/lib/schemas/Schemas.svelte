<script lang="ts">
    import { writable } from 'svelte/store';
  
    let cards = writable([]);
    let nextCardId = 1;

    function generateUUID() {
      return crypto.randomUUID();
    }
  
    function addCard() {
      cards.update((currentCards) => [
        ...currentCards,
        { id: nextCardId++, text: '', items: [] },
      ]);
    }
  
    function removeCard(cardId) {
      cards.update((currentCards) =>
        currentCards.filter((card) => card.id !== cardId)
      );
    }
  
    function onDrop(event, card) {
      event.preventDefault();
  
      const rawData = event.dataTransfer.getData('text/plain');
  
      if (!rawData) {
        console.error('No data received during drop');
        return;
      }
  
      try {
        const data = JSON.parse(rawData);
  
        cards.update((currentCards) =>
          currentCards.map((c) => {
            if (c.id === card.id) {
              const existingItem = c.items.find((item) => item.src === data.src);
              if (existingItem) {
                // console.warn('Duplicate item detected, skipping:', data);
                return c; 
              }
  
              return {
                ...c,
                items: [...c.items, { id: generateUUID(), ...data }],
              };
            }
            return c;
          })
        );
      } catch (error) {
        console.error('Failed to parse drag data:', error);
      }
    }
  
    function allowDrop(event) {
      event.preventDefault();
    }
  
    function removeItem(cardId, itemId) {
      cards.update((currentCards) =>
        currentCards.map((c) =>
          c.id === cardId
            ? { ...c, items: c.items.filter((item) => item.id !== itemId) }
            : c
        )
      );
    }
  
    let draggedItem = null;
  
    function handleDragStart(event, cardId, item) {
      draggedItem = { cardId, item };
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify(item)); // Set drag data
    }
  
    function handleDropOnItem(event, cardId, targetItemId) {
      event.preventDefault();
  
      if (draggedItem && draggedItem.cardId === cardId) {
        cards.update((currentCards) =>
          currentCards.map((c) => {
            if (c.id === cardId) {
              const items = [...c.items];
              const draggedIndex = items.findIndex(
                (i) => i.id === draggedItem.item.id
              );
              const targetIndex = items.findIndex((i) => i.id === targetItemId);
  
              const [movedItem] = items.splice(draggedIndex, 1);
              items.splice(targetIndex, 0, movedItem);
  
              return { ...c, items };
            }
            return c;
          })
        );
      }
  
      draggedItem = null;
    }
  </script>

<div class="marcelle-card">
  <div class="container">
    <button class="btn btn-xs btn-primary" on:click={addCard}>New Hypothesis</button>

    {#each $cards as card (card.id)}
      <div class="card shadow-lg bg-base-100 p-4">
        <div class="card-body">
          <button
            class="btn btn-xs btn-circle btn-error absolute top-2 right-2"
            on:click={() => removeCard(card.id)}
          >
            ✕
          </button>

          <textarea
            bind:value={card.text}
            class="textarea textarea-xs textarea-accent textarea-bordered w-full"
            placeholder="Add your hypothesis here"
          ></textarea>

          {#if card.items.length === 0}
            <!-- Tooltip displayed only if no items exist -->
            <div class="tooltip tooltip-open tooltip-accent" data-tip="drag and drop evidence"></div>
          {/if}

          <div
            class="grid grid-cols-5 gap-2 p-4 border border-dashed border-gray-300 rounded-lg min-h-[100px]"
            on:drop={(event) => onDrop(event, card)}
            on:dragover={allowDrop}
          >
            {#each card.items as item (item.id)}
              <div
                class="dropped-item p-1 bg-gray-100 border border-gray-300 rounded-md text-center relative"
                draggable="true"
                on:dragstart={(event) => handleDragStart(event, card.id, item)}
                on:drop={(event) => handleDropOnItem(event, card.id, item.id)}
                on:dragover={allowDrop}
              >
                <button
                  class="items-btn btn btn-xs btn-circle btn-error absolute top-1 right-1"
                  on:click={() => removeItem(card.id, item.id)}
                >
                  ✕
                </button>
                {#if item.type === 'image-caption'}
                  <img
                    src={item.src}
                    alt="Dropped Image"
                    class="w-full h-auto mb-2 rounded"
                  />
                  <h3 class="text-xs text-gray-600">{item.caption}</h3>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>


<style>
  .btn {
    font-weight: 100;
  }
  .marcelle-card {
    height: 100vh;
    background-color: white;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
  }

  .grid {
    background-color: oklch(var(--b2));
  }

  .container {
    max-width: 50vw;
    margin: 0 auto;
    width: 100%;
  }
  
  .card {
    position: relative;
    width: 100%;
    padding: 0 !important;
    box-sizing: border-box;
    min-height: 100px;
  }

  img {
    max-height: 100px;
    object-fit: cover;
  }

  .dropped-item {
    padding: 7px;
    background-color: #fff;
    border: 1px solid #e6e6e6;
    border-radius: 8px;
    cursor: grab;
    z-index: 1;
    box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.1);
  }


  .dropped-item h3 {
    font-size: 0.6rem;
    text-align: center;
  }


  .btn-circle {
    position: absolute;
    top: 0.15rem;
    right: 0.15rem;
    z-index: 10;
    background-color: transparent;
    color: red;
    border: none;
    font-weight: 900;
  }

 .items-btn.btn-circle {
    top: -0.65rem;
    right: -0.55rem;
    font-size: 0.65rem;
  }

  .p-1 {
    padding: 0.35rem; 
  }

</style>

  
  
  