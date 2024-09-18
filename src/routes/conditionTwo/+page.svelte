<script lang="ts">
    import { ImageDisplay, caption, $imageStream as imageStream, generateCaption } from "$lib/marcelle";
    import { marcelle } from "$lib/utils";
    import { onMount, onDestroy, tick } from 'svelte';
    import * as fabric from 'fabric';
    import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';

    let cleanup: () => void;
    let canvas: fabric.Canvas | null = null;
    let isDrawingMode = false;
    let canvasHistory: any[] = [];
    let imageObject: fabric.Image | null = null;  

    function toggleDrawingMode() {
        if (canvas) {
            isDrawingMode = !isDrawingMode;
            canvas.isDrawingMode = isDrawingMode;

            if (canvas.isDrawingMode) {
                if (!canvas.freeDrawingBrush) {
                    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                }
                canvas.freeDrawingBrush.width = 12;
                canvas.freeDrawingBrush.color = "#ff0000";
            }
        }
    }

    function getCanvasImage(): ImageData | null {
        const canvasEl = document.querySelector('#fabric-canvas') as HTMLCanvasElement;
        const ctx = canvasEl?.getContext('2d');
        if (ctx) {
            return ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
        }
        return null;
    }

    function generateCaptionForCombinedImage() {
        const combinedImage = getCanvasImage(); // Get the combined image (selected + drawing)
        if (combinedImage) {
            generateCaption(combinedImage);  // Generate caption using the combined image
        } else {
            console.error('Failed to capture canvas image');
        }
    }



    function undoLastAction() {
        if (canvas && canvas.getObjects().length > 1) {  
            const lastObject = canvas.getObjects().pop();
            if (lastObject !== imageObject) {  // Do not remove the image object
                canvas.remove(lastObject);
                canvasHistory.pop();
            } else {
                canvas.getObjects().push(lastObject);  
            }
        }
    }

    function loadImageToCanvas(img: ImageData) {
        if (canvas) {
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
                        // Remove the previous image object if exists
                        if (imageObject) {
                            canvas.remove(imageObject);
                        }

                        // Create a new fabric image object
                        imageObject = new fabric.Image(imgElement, {
                            left: 0,
                            top: 0,
                            selectable: false, 
                            evented: false,  
                        });

                        // Clear all objects from the canvas and re-add the image first
                        const objects = canvas.getObjects().filter(obj => obj !== imageObject);
                        canvas.clear();
                        canvas.add(imageObject);
                        objects.forEach(obj => canvas.add(obj));
                        canvas.renderAll();
                    }
                };
            }
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

        canvas.on('mouse:up', () => {
            if (canvas.isDrawingMode) {
                canvasHistory.push(canvas.toJSON());
            }
        });

        imageStream.filter(img => !!img).subscribe((img) => {
            loadImageToCanvas(img);  
        });
    });

    onDestroy(() => {
        if (cleanup) cleanup();
    });
</script>

<div class="marcelle card">
    <div class="conf-row">
        <div class="group-components-container">
            <div class="canvas-container">
                <canvas id="fabric-canvas" width="200" height="200"></canvas>
            </div>
            <div class="marcelle-component caption" use:marcelle={caption}></div>
        </div>
        <div class="group-components-container-small">
            <button 
                class="btn btn-sm w-full {isDrawingMode ? 'btn-active btn-primary' : 'btn-primary'}" 
                on:click={toggleDrawingMode}
            >
            <i class="{isDrawingMode ? 'fas fa-pencil-alt' : 'fas fa-mouse'}"></i> 
            </button>
            <button class="btn btn-sm btn-base-200 w-full" on:click={undoLastAction}>
                Undo
            </button>
            <button class="btn btn-sm btn-primary w-full" on:click={generateCaptionForCombinedImage}>Generate Caption</button>
        </div>
    </div>
</div>

<style>
.marcelle.card {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
    width: 100%;
    align-items: center;
}

.btn {
    font-size: 0.7rem;
    font-weight: normal;
}

.marcelle-component.caption {
    font-size: 0.8rem;
    color: var(--heading-color);
    min-height: 58px;
    padding: 5px;
}

.conf-row {
    display: flex;
    gap: 10px;
    height: 100%; 
    align-items: center;
}

.marcelle-component {
    border: 1px solid #ddd;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 200px; 
}

.image-display {
    position: relative;
    width: 200px;
    height: 200px;
    background-color: #fafafa;
    border: 1px solid #ddd;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
}

.canvas-container {
    width: 100%;
    height: 100%;
}

canvas {
    width: 100%;
    height: 100%;
    pointer-events: auto;
    z-index: 10;
    background-color: transparent;
}

.group-components-container {
    display: flex;
    flex-direction: column; 
    gap: 5px; 
    max-width: 200px; 
    align-items: center; 
}

.group-components-container-small {
    display: flex;
    flex-direction: column;
    gap: 5px;
    max-width: 100px;
    align-items: center;
}
</style>
