<script lang="ts">
  import {
    ImageDisplay,
    caption,
    $imageStream as imageStream,
    generateCaption,
  } from '$lib/marcelle';
  import { marcelle } from '$lib/utils';
  import { onMount, onDestroy, tick } from 'svelte';
  import * as fabric from 'fabric';
  import {
    faPencilAlt,
    faMousePointer,
    faRotateLeft,
    faUpDownLeftRight,
  } from '@fortawesome/free-solid-svg-icons';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { logEvent } from '$lib/marcelle/log';
  import { $imageIdStream as imageIdStream } from '$lib/marcelle';

  let cleanup: () => void;
  let canvas: fabric.Canvas | null = null;
  let isDrawingMode = true;
  let canvasHistory: any[] = [];
  let imageObject: fabric.Image | null = null;

  let currentInstanceId: string | null = null;

  imageIdStream.subscribe((id) => {
    currentInstanceId = id;
  });

  let canvasEl: HTMLCanvasElement | null = null;
  let dragOverlay: HTMLDivElement | null = null;
  let isDragMode = false;

  let brushSize = 12;
  let brushColor = '#000000';

  function toggleDrawingMode() {
    isDrawingMode = !isDrawingMode;
    if (canvas) {
      canvas.isDrawingMode = isDrawingMode;

      if (dragOverlay) {
        dragOverlay.style.display = isDrawingMode ? 'none' : 'block';
      }

      if (canvas.isDrawingMode) {
        if (!canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        }
        updateBrushSettings();
      }
    }
  }

  function updateBrushSettings() {
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = brushSize;
      canvas.freeDrawingBrush.color = brushColor;
    }
  }

  function changeBrushColor(color: string) {
    brushColor = color;
    updateBrushSettings();
  }

  function getCanvasImage(): ImageData | null {
    const canvasEl = document.querySelector('#fabric-canvas') as HTMLCanvasElement;
    const ctx = canvasEl?.getContext('2d');
    if (ctx) {
      return ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
    }
    return null;
  }

  function onDragStart(event: DragEvent) {
    const canvasElement = document.querySelector('#fabric-canvas') as HTMLCanvasElement;
    const currentCaption = caption.$value.get();

    if (canvasElement) {
      const canvasUrl = canvasElement.toDataURL('image/png');
      const data = JSON.stringify({
        type: 'image-caption',
        src: canvasUrl,
        caption: currentCaption || 'Try Again',
        instanceId: currentInstanceId || null,
      });

      event.dataTransfer?.setData('text/plain', data);
    } else {
      console.error('Canvas element not found');
    }
  }

  onMount(async () => {
    await tick();
    const canvasEl = document.querySelector('#fabric-canvas') as HTMLCanvasElement;
    const width = 200;
    const height = 200;

    if (canvas) {
      canvas.dispose();
      canvas = null;
    }

    canvas = new fabric.Canvas(canvasEl, {
      isDrawingMode: true,
      width: width,
      height: height,
    });

    dragOverlay = document.querySelector('#drag-overlay');

    if (dragOverlay) {
      dragOverlay.addEventListener('dragstart', onDragStart);
    }

    if (canvas.isDrawingMode) {
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      }
      updateBrushSettings();
    }

    canvas.on('mouse:up', () => {
      if (canvas.isDrawingMode) {
        canvasHistory.push(canvas.toJSON());

        logEvent('mask-image');

        (async () => {
          await generateCaptionForCombinedImage();
        })();
      }
    });

    imageStream
      .filter((img) => !!img)
      .subscribe((img) => {
        loadImageToCanvas(img);
      });
  });

  onDestroy(() => {
    if (canvas) {
      canvas.dispose();
      canvas = null;
    }

    if (dragOverlay) {
      dragOverlay.removeEventListener('dragstart', onDragStart);
    }

    if (cleanup) cleanup();
  });

  function loadImageToCanvas(img: ImageData) {
    if (canvas) {
      canvas.clear();

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;

      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(img, 0, 0);

        const imgElement = new Image();
        imgElement.src = tempCanvas.toDataURL();

        imgElement.onload = function () {
          if (canvas) {
            if (imageObject) {
              canvas.remove(imageObject);
            }

            imageObject = new fabric.Image(imgElement, {
              left: 0,
              top: 0,
              selectable: false,
              evented: false,
            });

            canvas.add(imageObject);
            canvas.renderAll();
          }
        };
      }
    }
  }

  function undoLastAction() {
    if (canvas && canvas.getObjects().length > 1) {
      const lastObject = canvas.getObjects().pop();
      if (lastObject !== imageObject) {
        canvas.remove(lastObject);
        canvasHistory.pop();

        generateCaptionForCombinedImage();
      } else {
        canvas.getObjects().push(lastObject);
      }
    }
  }

  async function generateCaptionForCombinedImage() {
    caption.$value.set('<em>Caption is being generated...</em>');

    const combinedImage = getCanvasImage();
    if (!combinedImage) {
      caption.$value.set('Failed to capture image');
      console.error('Failed to capture canvas image');
      return;
    }

    try {
      const newCaption = await generateCaption(combinedImage);
      caption.$value.set(newCaption);
    } catch (error) {
      caption.$value.set('Error generating caption');
      console.error('Error generating caption:', error);
    }
  }
</script>

<div class="marcelle card">
  <div class="button-row">
    <!-- <div class="drawing-tutorial">
      <button
        class="btn btn-sm {isDrawingMode ? 'btn-active btn-secondary' : 'btn-secondary'}"
        on:click={toggleDrawingMode}
      >
        {#if isDrawingMode}
          <FontAwesomeIcon icon={faMousePointer} />
        {:else}
          <FontAwesomeIcon icon={faPencilAlt} />
        {/if}
      </button>
    </div> -->
    <!-- 
    {#if isDrawingMode} -->
    <div class="brush-settings">
      <label for="brush-size" class="text-xs">Brush Size: {brushSize}px</label>
      <input
        id="brush-size"
        type="range"
        min="1"
        max="50"
        bind:value={brushSize}
        on:input={updateBrushSettings}
        class="range range-primary"
      />
      <div class="color-palette">
        <!-- <button
            class="btn btn-xs btn-circle"
            style="background-color: #ff0000;"
            on:click={() => changeBrushColor('#ff0000')}
          ></button> -->
        <!-- <button
            class="btn btn-xs btn-circle"
            style="background-color: #676767; border: 1px solid #ddd;"
            on:click={() => changeBrushColor('#e6e6e6')}
          ></button> -->
        <button
          class="btn btn-xs btn-circle"
          style="background-color: #000000;"
          on:click={() => changeBrushColor('#000000')}
        ></button>
      </div>
    </div>
    <!-- {/if} -->

    <button class="btn btn-sm" on:click={undoLastAction}>
      <FontAwesomeIcon icon={faRotateLeft} />
    </button>
  </div>
  <div class="group-components-container instax-style" draggable="true" on:dragstart={onDragStart}>
    <div class="canvas-container">
      <canvas id="fabric-canvas" width="200" height="200"></canvas>
      <div id="drag-overlay" class="drag-overlay"></div>
    </div>
    <div class="marcelle-component caption" use:marcelle={caption}></div>
    <div class="drag-icon">
      <FontAwesomeIcon icon={faUpDownLeftRight} />
    </div>
  </div>
  <!-- <div class="generate-caption-container">
    <div
      class="tooltip tooltip-bottom tooltip-accent"
      data-tip="the model may take a few seconds to generate captions"
    >
      <button class="btn btn-sm btn-secondary w-full" on:click={generateCaptionForCombinedImage}>
        Generate Caption
      </button>
    </div>
  </div> -->
</div>

<style>
  .marcelle.card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    height: 100%;
    width: 100%;
  }

  .btn {
    font-size: 0.7rem;
    font-weight: normal;
  }

  .marcelle-component.caption {
    font-size: 0.8rem;
    color: var(--heading-color);
    padding: 5px;
    text-align: center;
    border: none;
    cursor: grab;
  }

  /* .conf-row {
    display: flex;
    gap: 10px;
    height: 100%;
    align-items: center;
  } */

  .marcelle-component {
    border: 1px solid #ddd;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .canvas-container {
    position: relative;
    width: 200px;
    height: 200px;
  }

  canvas {
    width: 100%;
    height: 100%;
    pointer-events: auto;
    z-index: 10;
    background-color: transparent;
  }

  .drag-overlay {
    display: none;
  }

  .button-row {
    display: flex;
    gap: 10px;
    justify-content: center;
    align-items: center;
  }

  .group-components-container {
    display: flex;
    position: relative;
    flex-direction: column;
    gap: 5px;
    align-items: center;
    margin-top: 10px;
  }

  .drag-icon {
    position: absolute;
    bottom: 2px;
    right: 2px;
    cursor: grab;
    color: oklch(var(--in));
  }

  .generate-caption-container {
    margin-top: 10px;
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .instax-style {
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 1px 1px rgba(0, 0, 0, 0.4);
    width: 220px;
    height: 270px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  canvas {
    border-radius: 4px;
    margin-bottom: 10px;
  }

  .tooltip::before {
    max-width: 30rem;
    white-space: normal;
    border-radius: 0.25rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    padding-top: 0.15rem;
    padding-bottom: 0.15rem;
    font-size: 0.7rem;
    line-height: 1rem;
    background-color: var(--tooltip-color);
    color: var(--tooltip-text-color);
    width: max-content;
  }

  .marcelle-component.caption {
    min-height: 40px;
    max-height: 60px;
    text-align: center;
    padding: 5px;
  }

  /* .group-components-container-small {
    display: flex;
    flex-direction: column;
    gap: 5px;
    max-width: 100px;
    align-items: center;
  } */

  .brush-settings {
    width: 100px;
    text-align: center;
  }

  .color-palette {
    margin-top: 10px;
    display: flex;
    justify-content: center;
    gap: 10px;
  }

  .color-btn {
    width: 30px;
    height: 30px;
    border: 1px solid #ccc;
    border-radius: 50%;
    cursor: pointer;
    padding: 0;
    outline: none;
  }
</style>
