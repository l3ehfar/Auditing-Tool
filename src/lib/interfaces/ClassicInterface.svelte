<script lang="ts">
  import { caption, $imageStream as imageStream, generateCaption } from '$lib/marcelle';
  import { marcelle } from '$lib/utils';
  import { onMount, onDestroy, tick } from 'svelte';
  import * as fabric from 'fabric';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faUpDownLeftRight } from '@fortawesome/free-solid-svg-icons';
  import { $imageIdStream as imageIdStream } from '$lib/marcelle';

  let canvas: fabric.Canvas | null = null;
  let imageObject: fabric.Image | null = null;

  let currentInstanceId: string | null = null;

  imageIdStream.subscribe((id) => {
    currentInstanceId = id;
  });

  // let canvasEl: HTMLCanvasElement | null = null;
  let dragOverlay: HTMLDivElement | null = null;

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
        caption: currentCaption || 'No caption generated',
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

    canvas = new fabric.Canvas(canvasEl, {
      isDrawingMode: false,
      width: width,
      height: height,
    });

    dragOverlay = document.querySelector('#drag-overlay');

    if (dragOverlay) {
      dragOverlay.addEventListener('dragstart', onDragStart);
    }

    imageStream
      .filter((img) => !!img)
      .subscribe((img) => {
        loadImageToCanvas(img);
      });
  });

  onDestroy(() => {
    if (dragOverlay) {
      dragOverlay.removeEventListener('dragstart', onDragStart);
    }
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

  // function generateCaptionForCombinedImage() {
  //   const combinedImage = getCanvasImage();
  //   if (combinedImage) {
  //     generateCaption(combinedImage);
  //   } else {
  //     console.error('Failed to capture canvas image');
  //   }
  // }
</script>

<div class="bg-white p-8">
  <div
    class="group-components-container instax-style shadow-xl"
    draggable="true"
    on:dragstart={onDragStart}
  >
    <div class="canvas-container">
      <canvas id="fabric-canvas" width="200" height="200"></canvas>
      <div id="drag-overlay" class="drag-overlay"></div>
    </div>
    <div class="marcelle-component caption" use:marcelle={caption}></div>
    <div class="drag-icon">
      <FontAwesomeIcon icon={faUpDownLeftRight} />
    </div>
  </div>
</div>

<style>
  .marcelle-component.caption {
    font-size: 0.8rem;
    color: var(--heading-color);
    padding: 5px;
    text-align: center;
    border: none;
    cursor: grab;
  }

  :global(.card-title) {
    display: none;
  }

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
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: transparent;
    z-index: 20;
    cursor: grab;
  }

  .group-components-container {
    display: flex;
    position: relative;
    flex-direction: column;
    gap: 5px;
    align-items: center;
  }

  .drag-icon {
    position: absolute;
    bottom: 2px;
    right: 2px;
    cursor: grab;
    color: oklch(var(--in));
  }

  .instax-style {
    background-color: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 10px;
    /* box-shadow: 0 1px 1px rgba(0, 0, 0, 0.4); */
    width: 220px;
    /* height: 270px; */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  canvas {
    border-radius: 4px;
    margin-bottom: 10px;
  }

  .marcelle-component.caption {
    min-height: 40px;
    /* max-height: 60px; */
    text-align: center;
    padding: 5px;
  }
</style>
