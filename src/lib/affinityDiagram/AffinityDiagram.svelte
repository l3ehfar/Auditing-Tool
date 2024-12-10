<script lang="ts">
  import { droppedItems } from '$lib/store';
  import { onMount } from 'svelte';
  import { writable, get } from 'svelte/store';
  import { faMousePointer, faObjectGroup, faComment } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

  let affinityDiagramArea;

  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panOffset = writable({ x: 0, y: 0 });

  function startPanning(event) {
    if (isSelecting) return;
    if (!isPanning && !isDragging && !isResizing) {
      isPanning = true;

      const rect = affinityDiagramArea.getBoundingClientRect();
      panStartX = event.clientX - rect.left;
      panStartY = event.clientY - rect.top;

      document.body.style.cursor = 'grabbing';
    }
  }

  function onPanMove(event) {
    if (isPanning) {
      const rect = affinityDiagramArea.getBoundingClientRect();
      const currentX = event.clientX - rect.left;
      const currentY = event.clientY - rect.top;

      const deltaX = currentX - panStartX;
      const deltaY = currentY - panStartY;

      panOffset.update((offset) => ({
        x: offset.x + deltaX,
        y: offset.y + deltaY,
      }));

      panStartX = currentX;
      panStartY = currentY;
    }
  }

  function stopPanning() {
    if (isPanning) {
      isPanning = false;
      document.body.style.cursor = 'auto';
    }
  }

  export const zoomLevel = writable(1);

  function zoomIn() {
    zoomLevel.update((level) => Math.min(level + 0.1, 3));
  }

  function zoomOut() {
    zoomLevel.update((level) => Math.max(level - 0.1, 0.5));
  }

  function resetZoom() {
    zoomLevel.set(1);
  }

  function handleWheel(event) {
    event.preventDefault();

    const currentZoom = get(zoomLevel);
    const zoomChange = event.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.min(Math.max(currentZoom + zoomChange, 0.5), 3);

    if (newZoom === currentZoom) return;

    const rect = affinityDiagramArea.getBoundingClientRect();

    const mouseXInDiagram = (event.clientX - rect.left - get(panOffset).x) / currentZoom;
    const mouseYInDiagram = (event.clientY - rect.top - get(panOffset).y) / currentZoom;

    panOffset.update((offset) => ({
      x: offset.x - mouseXInDiagram * (newZoom - currentZoom),
      y: offset.y - mouseYInDiagram * (newZoom - currentZoom),
    }));

    zoomLevel.set(newZoom);
  }

  let isSelectionMode = writable(false);
  let isSelecting = false;
  let selectionStart = { x: 0, y: 0 };
  let selectionBox = writable({ x: 0, y: 0, width: 0, height: 0 });
  let selectedItems = writable([]);
  export const rectangles = writable([]);

  let nextId = 1;

  let isDragging = false;
  let draggedElement = null;
  let dragType = null;
  let startX = 0;
  let startY = 0;
  let initialX = 0;
  let initialY = 0;

  let initialItemPositions = [];

  let isResizing = false;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeStartWidth = 0;
  let resizeStartHeight = 0;
  let resizeStartLeft = 0;
  let resizeStartTop = 0;
  let resizeDirection = '';
  let resizingRectangle = null;

  function startResizing(event, rectangle, direction) {
    isResizing = true;
    resizeDirection = direction;
    resizingRectangle = rectangle;

    const zoom = get(zoomLevel);

    resizeStartX = event.clientX / zoom;
    resizeStartY = event.clientY / zoom;
    resizeStartWidth = rectangle.width;
    resizeStartHeight = rectangle.height;
    resizeStartLeft = rectangle.x;
    resizeStartTop = rectangle.y;

    document.addEventListener('pointermove', onResizeMove);
    document.addEventListener('pointerup', stopResizing);
  }

  function onResizeMove(event) {
    if (!isResizing || !resizingRectangle) return;

    const zoom = get(zoomLevel);

    let deltaX = event.clientX / zoom - resizeStartX;
    let deltaY = event.clientY / zoom - resizeStartY;

    rectangles.update((rects) => {
      return rects.map((rect) => {
        if (rect.id === resizingRectangle.id) {
          let newWidth = resizeStartWidth;
          let newHeight = resizeStartHeight;
          let newX = resizeStartLeft;
          let newY = resizeStartTop;

          if (resizeDirection.includes('right')) {
            newWidth = Math.max(20, resizeStartWidth + deltaX);
          }
          if (resizeDirection.includes('left')) {
            newWidth = Math.max(20, resizeStartWidth - deltaX);
            newX = resizeStartLeft + deltaX;
          }
          if (resizeDirection.includes('bottom')) {
            newHeight = Math.max(20, resizeStartHeight + deltaY);
          }
          if (resizeDirection.includes('top')) {
            newHeight = Math.max(20, resizeStartHeight - deltaY);
            newY = resizeStartTop + deltaY;
          }

          return {
            ...rect,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          };
        }
        return rect;
      });
    });
  }

  function stopResizing() {
    isResizing = false;
    resizingRectangle = null;
    document.removeEventListener('pointermove', onResizeMove);
    document.removeEventListener('pointerup', stopResizing);
  }

  function onDrop(event) {
  event.preventDefault();

  const droppedData = JSON.parse(event.dataTransfer.getData('text/plain'));
  const existingItem = get(droppedItems).find((item) => item.id === droppedData.id);

  const rect = affinityDiagramArea.getBoundingClientRect();
  const zoom = get(zoomLevel);
  const offset = get(panOffset);

  const x = (event.clientX - rect.left - offset.x) / zoom;
  const y = (event.clientY - rect.top - offset.y) / zoom;

  const rectanglesList = get(rectangles);
  const targetRectangle = rectanglesList.find((r) =>
    isItemInsideRectangle({ x, y, width: 1, height: 1 }, r),
  );

  const parentId = targetRectangle ? targetRectangle.id : null;

  let newItem = null;

  if (existingItem) {
    droppedItems.update((items) =>
      items.map((item) =>
        item.id === existingItem.id
          ? {
              ...item,
              x: parentId ? x : item.x, // Set absolute x
              y: parentId ? y : item.y, // Set absolute y
              parentId,
            }
          : item,
      ),
    );
  } else {
    newItem = {
      id: nextId++,
      ...droppedData,
      x,
      y,
      parentId,
    };
    droppedItems.update((items) => [...items, newItem]);
  }

  const itemId = existingItem ? existingItem.id : newItem?.id;
  if (itemId) {
    updateRectangleMemberships(itemId);
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
    const zoom = get(zoomLevel);

    startX = (event.clientX - rect.left) / zoom;
    startY = (event.clientY - rect.top) / zoom;
    initialX = element.x;
    initialY = element.y;

    if (dragType === 'item') {
      droppedItems.update((items) => {
        const otherItems = items.filter((i) => i.id !== element.id);
        return [...otherItems, element];
      });
    } else if (dragType === 'rectangle') {
      rectangles.update((rects) => {
        const otherRects = rects.filter((r) => r.id !== element.id);
        return [...otherRects, element];
      });

      const currentItems = get(droppedItems).filter((item) =>
        element.items.some((i) => i.id === item.id),
      );

      initialItemPositions = currentItems.map((item) => ({
        id: item.id,
        x: item.x,
        y: item.y,
      }));
    }
  }

  function onPointerMove(event) {
    if (isDragging && draggedElement) {
      event.preventDefault();
      const rect = affinityDiagramArea.getBoundingClientRect();
      const zoom = get(zoomLevel);

      const x = (event.clientX - rect.left) / zoom;
      const y = (event.clientY - rect.top) / zoom;

      const deltaX = x - startX;
      const deltaY = y - startY;

      if (dragType === 'item') {
        droppedItems.update((items) =>
          items.map((i) =>
            i.id === draggedElement.id ? { ...i, x: initialX + deltaX, y: initialY + deltaY } : i,
          ),
        );

        // Check rectangle membership updates
        updateRectangleMemberships(draggedElement.id);
      } else if (dragType === 'rectangle' && !isResizing) {
        rectangles.update((rects) =>
          rects.map((r) => {
            if (r.id === draggedElement.id) {
              const updatedRectangle = { ...r, x: initialX + deltaX, y: initialY + deltaY };

              const updatedItems = r.items.map((item) => {
                const initialItemPosition = initialItemPositions.find((pos) => pos.id === item.id);
                if (!initialItemPosition) return item;

                return {
                  ...item,
                  x: initialItemPosition.x + deltaX,
                  y: initialItemPosition.y + deltaY,
                };
              });

              droppedItems.update((items) =>
                items.map(
                  (item) => updatedItems.find((updatedItem) => updatedItem.id === item.id) || item,
                ),
              );

              return { ...updatedRectangle, items: updatedItems };
            }
            return r;
          }),
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
    droppedItems.update((items) => items.filter((item) => item.id !== id));

    rectangles.update((rects) =>
      rects.map((rectangle) => ({
        ...rectangle,
        items: rectangle.items.filter((item) => item.id !== id),
      })),
    );
  }

  function removeRectangle(id) {
    rectangles.update((rects) => rects.filter((rect) => rect.id !== id));
  }

  function toggleSelectionMode() {
    isSelectionMode.update((mode) => !mode);
  }

  function startSelection(event) {
    if (get(isSelectionMode)) {
      isSelecting = true;

      const rect = affinityDiagramArea.getBoundingClientRect();
      const zoom = get(zoomLevel);

      selectionStart = {
        x: (event.clientX - rect.left - get(panOffset).x) / zoom,
        y: (event.clientY - rect.top - get(panOffset).y) / zoom,
      };

      selectionBox.set({ x: selectionStart.x, y: selectionStart.y, width: 0, height: 0 });
      document.body.style.userSelect = 'none';
    }
  }

  function updateSelection(event) {
    if (isSelecting) {
      const rect = affinityDiagramArea.getBoundingClientRect();
      const zoom = get(zoomLevel);

      const x = (event.clientX - rect.left - get(panOffset).x) / zoom;
      const y = (event.clientY - rect.top - get(panOffset).y) / zoom;

      selectionBox.set({
        x: Math.min(x, selectionStart.x),
        y: Math.min(y, selectionStart.y),
        width: Math.abs(x - selectionStart.x),
        height: Math.abs(y - selectionStart.y),
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
        rectangles.update((rects) => [
          ...rects,
          { id: nextId++, x, y, width, height, items: itemsInSelection, text: '' },
        ]);
      }

      selectedItems.set([]);
      selectionBox.set({ x: 0, y: 0, width: 0, height: 0 });
      document.body.style.userSelect = 'auto';
    }
  }

  function createTextRectangle() {
    const zoom = get(zoomLevel); // Get the current zoom level
    const offset = get(panOffset); // Get the current pan offset

    // Use zoom and offset to determine the rectangle's position
    const x = 100 / zoom - offset.x / zoom;
    const y = 100 / zoom - offset.y / zoom;

    rectangles.update((rects) => [
      ...rects,
      {
        id: nextId++,
        x,
        y,
        width: 150 / zoom,
        height: 50 / zoom,
        items: [],
        text: '',
      },
    ]);
  }

  function highlightItemsInSelection() {
    const { x, y, width, height } = get(selectionBox);
    const selected = get(droppedItems).filter((item) => {
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
    return get(selectedItems).some((selected) => selected.id === item.id);
  }

  function updateRectangleDimensions(rectangle) {
    return rectangle;
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
  const item = get(droppedItems).find((i) => i.id === itemId);

  rectangles.update((rects) =>
    rects.map((rectangle) => {
      const isInside = isItemInsideRectangle(item, rectangle);
      const itemInRectangle = rectangle.items.some((i) => i.id === item.id);

      if (isInside && !itemInRectangle) {
        return {
          ...rectangle,
          items: [...rectangle.items, item],
        };
      } else if (!isInside && itemInRectangle) {
        return {
          ...rectangle,
          items: rectangle.items.filter((i) => i.id !== item.id),
        };
      }

      return rectangle;
    }),
  );
}


  function attachTextToRectangle(rectangleId) {
    const userText = prompt('Enter your hypothesis:');
    if (userText) {
      rectangles.update((rects) => {
        return rects.map((rect) => {
          if (rect.id === rectangleId) {
            return { ...rect, text: userText };
          }
          return rect;
        });
      });
    }
  }

  function updateRectangleText(rectangleId, newText) {
    rectangles.update((rects) =>
      rects.map((rect) => (rect.id === rectangleId ? { ...rect, text: newText } : rect)),
    );
  }

  function adjustHeight(event) {
    const element = event.target;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }
</script>

<div
  bind:this={affinityDiagramArea}
  class="affinity-diagram-area"
  class:rect-drawing={$isSelectionMode}
  on:pointerdown={(e) => {
    if (get(isSelectionMode)) {
      startSelection(e);
    } else {
      startPanning(e);
    }
  }}
  on:pointermove={(e) => {
    if (isSelecting) {
      updateSelection(e);
    } else if (isPanning) {
      onPanMove(e);
    }
  }}
  on:pointerup={(e) => {
    if (isSelecting) {
      endSelection();
    }
    stopPanning();
  }}
  on:pointerleave={() => {
    if (isSelecting) {
      endSelection();
    }
    stopPanning();
  }}
  on:wheel={handleWheel}
>
  <div class="zoom-controls">
    <button on:click={zoomIn} class="btn btn-sm btn-secondary">Zoom In</button>
    <button on:click={zoomOut} class="btn btn-sm btn-secondary">Zoom Out</button>
    <button on:click={resetZoom} class="btn btn-sm btn-secondary">Reset</button>
  </div>

  <!-- <button
    on:click={toggleSelectionMode}
    class="btn btn-sm btn-secondary selection-mode-button"
    class:btn-active={$isSelectionMode}
  >
    {#if $isSelectionMode}
      <FontAwesomeIcon icon={faMousePointer} />
    {:else}
      <FontAwesomeIcon icon={faObjectGroup} />
    {/if}
  </button> -->

  <button on:click={createTextRectangle} class="btn btn-sm btn-secondary text-only-button">
    <FontAwesomeIcon icon={faComment} />
  </button>

  <div class="drop-area">
    <div
      class="zoomable-content"
      style="
      transform: translate({$panOffset.x}px, {$panOffset.y}px) scale({$zoomLevel});
      transform-origin: 0 0;"
    >
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
          <div
            class="resize-handle top-left"
            on:pointerdown={(e) => startResizing(e, rectangle, 'top-left')}
          ></div>
          <div
            class="resize-handle bottom-right"
            on:pointerdown={(e) => startResizing(e, rectangle, 'bottom-right')}
          ></div>

          <button
            class="btn btn-xs btn-circle absolute top-1 right-1"
            on:click={() => removeRectangle(rectangle.id)}
            style="color:red"
          >
            ×
          </button>

          <textarea
            id={`textarea-${rectangle.id}`}
            placeholder="Add text here"
            bind:value={rectangle.text}
            class="hypothesis-input absolute bottom-1 left-1"
            on:input={adjustHeight}
            on:pointerdown={(e) => e.stopPropagation()}
          ></textarea>

          <!-- {#each rectangle.items as item (item.id)}
          <div
          class="dropped-item instax-style {isItemSelected(item) ? 'selected' : ''}"
          style="
            left: {item.x}px; 
            top: {item.y}px; 
            width: {item.width || 90}px;
            height: {item.height || 'auto'};
            position: absolute;
            background: yellow;
          "
          on:pointerdown={(e) => onPointerDown(e, item, 'item')}
        >
          <button
          class="btn btn-xs absolute top-1 right-1"
          on:click={() => removeItem(item.id)}
          style="color:red"
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
        {/each} -->

          <span class="rect-info">Instances: {rectangle.items.length}</span>
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
        position: absolute;
      "
      on:pointerdown={(e) => onPointerDown(e, item, 'item')}
    >
          <button
            class="btn btn-xs absolute top-1 right-1"
            on:click={() => removeItem(item.id)}
            style="color:red"
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
</div>

<style>
  :global(body) {
    --box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.1);
  }

  .text-only-button {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 10;
    width: 50px;
  }

  .affinity-diagram-area.rect-drawing {
    cursor: crosshair;
  }

  .affinity-diagram-area {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    box-shadow: var(--box-shadow);
    overflow: auto;
    cursor: grab;
  }

  .affinity-diagram-area:active {
    cursor: grabbing;
  }

  .selection-mode-button {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 10;
    width: 50px;
  }

  .zoomable-content {
    position: absolute;
    transform-origin: 0 0;
    will-change: transform;
    top: 0;
    left: 0;
  }

  .zoom-controls {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    display: flex;
    gap: 10px;
  }

  .hypothesis-input {
    width: calc(100% - 80px);
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.75rem;
    box-sizing: border-box;
    resize: none;
    overflow: hidden;
    position: absolute;
    bottom: 10px;
    left: 10px;
    min-height: 20px;
    line-height: 1.2rem;
  }

  .drop-area {
    flex: 1;
    position: relative;
    padding: 10px;
    border: 1px dashed #e6e6e6;
    border-radius: 8px;
    background-color: #fff;
    box-shadow: var(--box-shadow);
    overflow: scroll;
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
    user-select: none;
    touch-action: none;
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
    transition:
      background-color 0.3s ease,
      transform 0.2s ease;
  }

  .attach-text-button:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }

  .resize-handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: rgba(0, 0, 0, 0.5);
    cursor: pointer;
    z-index: 2;
  }

  .resize-handle.top-left,
  .resize-handle.bottom-right {
    cursor: nwse-resize;
  }

  .resize-handle.top-left {
    top: -5px;
    left: -5px;
  }
  .resize-handle.bottom-right {
    bottom: -5px;
    right: -5px;
  }
</style>
