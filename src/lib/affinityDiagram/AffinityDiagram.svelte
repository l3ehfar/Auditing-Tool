<script lang="ts">
    import { droppedItems } from '$lib/store';
    import { onMount } from 'svelte';
    import { writable, get } from 'svelte/store';
    import { faMousePointer, faObjectGroup } from '@fortawesome/free-solid-svg-icons';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

    let affinityDiagramArea;
    let isSelectionMode = writable(false);
    let isSelecting = false;
    let selectionStart = { x: 0, y: 0 };
    let selectionBox = writable({ x: 0, y: 0, width: 0, height: 0 });
    let selectedItems = writable([]);
    let rectangles = writable([]);

    let nextId = 1;
  
    let isDragging = false;
    let draggedElement = null; 
    let dragType = null; 
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
  
    let initialItemPositions = [];
  
    function onDrop(e) {
      e.preventDefault();
  
      try {
        const droppedData = JSON.parse(e.dataTransfer.getData('text/plain'));
  
        const existingItem = get(droppedItems).find(item => item.id === droppedData.id);
  
        if (!existingItem) {
          const x = e.clientX - affinityDiagramArea.getBoundingClientRect().left;
          const y = e.clientY - affinityDiagramArea.getBoundingClientRect().top;
  
          const newItem = { id: nextId++, ...droppedData, x, y };
  
          droppedItems.update(items => [...items, newItem]);
  
          const rectanglesList = get(rectangles);
          for (const rectangle of rectanglesList) {
            if (isItemInsideRectangle(newItem, rectangle)) {
              rectangle.items.push(newItem);
              updateRectangleDimensions(rectangle);
              break;
            }
          }
        }
      } catch (error) {
        console.error("Failed to parse the dropped data as JSON:", error);
        return;
      }
    }
  
    onMount(() => {
      affinityDiagramArea.addEventListener('dragover', (e) => e.preventDefault());
      affinityDiagramArea.addEventListener('drop', onDrop);
  
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
  
      return () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
      };
    });
  
    function onPointerDown(event, element, type) {
      event.stopPropagation();
      event.preventDefault(); 
      isDragging = true;
      draggedElement = element;
      dragType = type;
  
      const rect = affinityDiagramArea.getBoundingClientRect();
      startX = event.clientX - rect.left;
      startY = event.clientY - rect.top;
      initialX = element.x;
      initialY = element.y;
  
      if (dragType === 'item') {
        droppedItems.update(items => {
          const otherItems = items.filter(i => i.id !== element.id);
          return [...otherItems, element];
        });
      } else if (dragType === 'rectangle') {
        rectangles.update(rects => {
          const otherRects = rects.filter(r => r.id !== element.id);
          return [...otherRects, element];
        });
  
        const currentItems = get(droppedItems).filter(item =>
          element.items.some(i => i.id === item.id)
        );
  
        initialItemPositions = currentItems.map(item => ({
          id: item.id,
          x: item.x,
          y: item.y
        }));
      }
    }
  
    function onPointerMove(event) {
      if (isDragging && draggedElement) {
        event.preventDefault();
        const rect = affinityDiagramArea.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
  
        const deltaX = x - startX;
        const deltaY = y - startY;
  
        if (dragType === 'item') {
          droppedItems.update(items =>
            items.map(i =>
              i.id === draggedElement.id ? { ...i, x: initialX + deltaX, y: initialY + deltaY } : i
            )
          );
  
          const updatedItem = get(droppedItems).find(i => i.id === draggedElement.id);
  
          updateRectangleMemberships(updatedItem.id);
        } else if (dragType === 'rectangle') {
          rectangles.update(rects =>
            rects.map(r =>
              r.id === draggedElement.id
                ? { ...r, x: initialX + deltaX, y: initialY + deltaY }
                : r
            )
          );
  
          droppedItems.update(items =>
            items.map(item => {
              const initialItem = initialItemPositions.find(i => i.id === item.id);
              if (initialItem) {
                return { ...item, x: initialItem.x + deltaX, y: initialItem.y + deltaY };
              } else {
                return item;
              }
            })
          );
        }
      }
    }
  
    function onPointerUp(event) {
      if (isDragging) {
        isDragging = false;
        draggedElement = null;
        dragType = null;
        initialItemPositions = [];
      }
    }
  
    function removeItem(id) {
      droppedItems.update(items => items.filter(item => item.id !== id));
  
      rectangles.update(rects =>
        rects.map(rectangle => ({
          ...rectangle,
          items: rectangle.items.filter(item => item.id !== id)
        }))
      );
  
      rectangles.update(rects => rects.filter(rectangle => rectangle.items.length > 0));
    }
  
    function removeRectangle(id) {
      rectangles.update(rects => rects.filter(rect => rect.id !== id));
    }
  
    function toggleSelectionMode() {
      isSelectionMode.update(mode => !mode);
    }
  
    function startSelection(event) {
      if (get(isSelectionMode)) {
        isSelecting = true;
        const rect = affinityDiagramArea.getBoundingClientRect();
        selectionStart = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        selectionBox.set({ x: selectionStart.x, y: selectionStart.y, width: 0, height: 0 });
      }
    }
  
    function updateSelection(event) {
      if (isSelecting) {
        const rect = affinityDiagramArea.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        selectionBox.set({
          x: Math.min(x, selectionStart.x),
          y: Math.min(y, selectionStart.y),
          width: Math.abs(x - selectionStart.x),
          height: Math.abs(y - selectionStart.y)
        });
        highlightItemsInSelection();
      }
    }
  
    function endSelection() {
      if (isSelecting) {
        isSelecting = false;
        const { x, y, width, height } = get(selectionBox);
        const itemsInSelection = get(selectedItems);
  
        if (itemsInSelection.length > 0) {
          rectangles.update(rects => [
            ...rects,
            { id: nextId++, x, y, width, height, items: itemsInSelection, text: '' }
          ]);
        }
  
        // Clear the selection
        selectedItems.set([]);
        selectionBox.set({ x: 0, y: 0, width: 0, height: 0 });
      }
    }
  
    function highlightItemsInSelection() {
      const { x, y, width, height } = get(selectionBox);
      const selected = get(droppedItems).filter(item => {
        return (
          item.x + (item.width || 90) >= x &&
          item.x <= x + width &&
          item.y + (item.height || 90) >= y &&
          item.y <= y + height
        );
      });
      selectedItems.set(selected);
    }
  
    function isItemSelected(item) {
      return get(selectedItems).some(selected => selected.id === item.id);
    }
  
    function updateRectangleDimensions(rectangle) {
      const items = get(droppedItems).filter(item =>
        rectangle.items.some(i => i.id === item.id)
      );
  
      if (items.length === 0) {
        rectangles.update(rects => rects.filter(r => r.id !== rectangle.id));
        return null;
      }
  
      const xs = items.map(item => item.x);
      const ys = items.map(item => item.y);
      const widths = items.map(item => item.width || 90); 
      const heights = items.map(item => item.height || 90); 
  
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs.map((x, i) => x + widths[i]));
      const maxY = Math.max(...ys.map((y, i) => y + heights[i]));
  
      return {
        ...rectangle,
        x: minX - 10,
        y: minY - 10,
        width: maxX - minX + 20,
        height: maxY - minY + 20,
      };
    }
  
    function isItemInsideRectangle(item, rectangle) {
      return !(
        item.x + (item.width || 90) < rectangle.x ||
        item.x > rectangle.x + rectangle.width ||
        item.y + (item.height || 90) < rectangle.y ||
        item.y > rectangle.y + rectangle.height
      );
    }
  
    function updateRectangleMemberships(itemId) {
      const item = get(droppedItems).find(i => i.id === itemId);
  
      rectangles.update(rects => {
        return rects.reduce((acc, rectangle) => {
          const isInside = isItemInsideRectangle(item, rectangle);
          const itemInRectangle = rectangle.items.some(i => i.id === item.id);
  
          let newItems = rectangle.items;
  
          if (isInside && !itemInRectangle) {
            newItems = [...rectangle.items, item];
          } else if (!isInside && itemInRectangle) {
            newItems = rectangle.items.filter(i => i.id !== item.id);
          }
  
          if (newItems !== rectangle.items) {
            const updatedRectangle = { ...rectangle, items: newItems };
            const newRectangle = updateRectangleDimensions(updatedRectangle);
            if (newRectangle) {
              acc.push(newRectangle);
            } 
          } else {
            acc.push(rectangle);
          }
  
          return acc;
        }, []);
      });
    }
  
    function attachTextToRectangle(rectangleId) {
      const userText = prompt("Enter your hypothesis:");
      if (userText) {
        rectangles.update(rects => {
          return rects.map(rect => {
            if (rect.id === rectangleId) {
              return { ...rect, text: userText };
            }
            return rect;
          });
        });
      }
    }
  </script>
  
  <div
    bind:this={affinityDiagramArea}
    class="affinity-diagram-area"
    on:pointerdown={startSelection}
    on:pointermove={updateSelection}
    on:pointerup={endSelection}
  >
    <button
      on:click={toggleSelectionMode}
      class="btn btn-sm btn-secondary selection-mode-button"
      class:btn-active={$isSelectionMode}
    >
      {#if $isSelectionMode}
        <FontAwesomeIcon icon={faMousePointer} />
      {:else}
        <FontAwesomeIcon icon={faObjectGroup} />
      {/if}
    </button>
  
    <div class="drop-area">
      {#each $rectangles as rectangle (rectangle.id)}
        <div
          class="selection-box"
          style="
            left: {rectangle.x}px; 
            top: {rectangle.y}px; 
            width: {rectangle.width}px; 
            height: {rectangle.height}px;
          "
          on:pointerdown={(e) => onPointerDown(e, rectangle, 'rectangle')}
        >
          <button
            class="btn btn-error btn-xs btn-circle absolute top-1 right-1"
            on:click={() => removeRectangle(rectangle.id)}
          >
            ×
          </button>
          <span class="rect-info">Instances: {rectangle.items.length}</span>
  
          <button
            class="attach-text-button absolute bottom-1 left-1"
            on:click={() => attachTextToRectangle(rectangle.id)}
          >
            Attach Hypothesis
          </button>

          {#if rectangle.text}
            <p class="rectangle-text">{rectangle.text}</p>
          {/if}
        </div>
      {/each}
  
      {#each $droppedItems as item}
        <div
          class="dropped-item instax-style {isItemSelected(item) ? 'selected' : ''}" 
          style="
            left: {item.x}px; 
            top: {item.y}px; 
            width: {item.width || 90}px;
            height: {item.height || 'auto'};
          "
          on:pointerdown={(e) => onPointerDown(e, item, 'item')}
        >
          <button
            class="btn btn-error btn-xs btn-circle absolute top-1 right-1"
            on:click={() => removeItem(item.id)}
          >
            ×
          </button>
          {#if item.type === 'image-caption'}
            <img src={item.src} alt="Dropped Image" />
            <p>{item.caption}</p>
          {/if}
          {#if item.type === 'image'}
            <img src={item.src} alt="Dropped Image" />
          {/if}
          {#if item.type === 'caption'}
            <p>{item.text}</p>
          {/if}
        </div>
      {/each}
  
      {#if isSelecting}
        <div
          class="selection-box"
          style="
            left: {$selectionBox.x}px;
            top: {$selectionBox.y}px;
            width: {$selectionBox.width}px;
            height: {$selectionBox.height}px;
          "
        ></div>
      {/if}
    </div>
  </div>
  
  <style>
    :global(body) {
      --box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);
    }
  
    .affinity-diagram-area {
      width: 100%;
      height: 100%;
      position: relative; 
      display: flex;
      flex-direction: column;
      box-shadow: var(--box-shadow); 
    }
  
    .selection-mode-button {
      position: absolute;
      top: 10px; 
      left: 10px; 
      z-index: 10; 
      width: 50px; 
    }
  
    .drop-area {
      flex: 1;
      position: relative;
      padding: 10px;
      border: 1px dashed #e6e6e6;
      border-radius: 8px;
      background-color: #fff;
      box-shadow: var(--box-shadow); 
      height: 400px; 
      overflow: auto; 
    }
  
    .dropped-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      width: 90px;
      padding: 5px;
      background-color: #fff;
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      cursor: grab; 
      position: absolute;
      user-select: none; /* Prevent text selection during drag */
      touch-action: none; /* Prevent touch scrolling */
      z-index: 1;
      box-shadow: 0px 1px 1px rgba(0, 0, 0, 0.1);
    }
  
    .dropped-item:active {
      cursor: grabbing;
    }
  
    .dropped-item img {
      width: 100%;
      height: auto;
      border-radius: 4px;
      margin-bottom: 3px;
    }
  
    .dropped-item p {
      font-size: 0.55rem;
      color: #444;
      text-align: left;
      margin: 0;
      padding: 1px;
      white-space: normal;
      word-break: break-word;
    }
  
    .btn-circle {
      font-size: 0.8rem;
    }
  
    .absolute {
      position: absolute;
    }
  
    .top-1 {
      top: -0.5rem;
    }
  
    .right-1 {
      right: -0.5rem;
    }
  
    .bottom-1 {
      bottom: -0.5rem;
    }
  
    .left-1 {
      left: -0.5rem;
    }
  
    .selection-box {
      position: absolute;
      border: 2px dashed blue;
      background-color: rgba(173, 216, 230, 0.3);
      cursor: grab;
      touch-action: none; 
      z-index: 0;
    }
  
    .selection-box:active {
      cursor: grabbing;
    }
  
    .rect-info {
      position: absolute;
      bottom: 5px;
      right: 5px;
      font-size: 10px;
      color: #444;
    }
  
    .rectangle-text {
      font-size: 0.8rem;
      color: #333;
      margin: 5px 0 0;
      word-wrap: break-word;
      text-align: center;
    }
  
    .selected {
      border: 2px solid blue;
    }

    .attach-text-button {
      background-color: #007bff;
      color: white;
      border-radius: 10px;
      padding: 5px 10px;
      border: none;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      font-size: 0.75rem;
      transition: background-color 0.3s ease, transform 0.2s ease;
    }

  .attach-text-button:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }

  </style>
  