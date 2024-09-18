<script lang="ts">
    import { ImageDisplay, caption, $imageStream as imageStream, generateCaption } from "$lib/marcelle";
    import { marcelle } from "$lib/utils";
    import { onMount, onDestroy, tick } from 'svelte';
    import * as fabric from 'fabric';
    
    import { faPencilAlt, faMouse, faMousePointer, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
    import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';

    let cleanup: () => void;
    let canvas: fabric.Canvas | null = null;
    let isDrawingMode = false;
    let canvasHistory: any[] = [];
    let imageObject: fabric.Image | null = null;
    
    let brushSize = 12; 
    let brushColor = "#000000"; 

    function toggleDrawingMode() {
        isDrawingMode = !isDrawingMode;
        if (canvas) {
            canvas.isDrawingMode = isDrawingMode;

            if (canvas.isDrawingMode) {
                if (!canvas.freeDrawingBrush) {
                    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
                }
                updateBrushSettings(); // Update brush settings when toggling
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

    function generateCaptionForCombinedImage() {
        const combinedImage = getCanvasImage(); 
        if (combinedImage) {
            generateCaption(combinedImage); 
        } else {
            console.error('Failed to capture canvas image');
        }
    }

    function undoLastAction() {
        if (canvas && canvas.getObjects().length > 1) {  
            const lastObject = canvas.getObjects().pop();
            if (lastObject !== imageObject) {  
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
                        if (imageObject) {
                            canvas.remove(imageObject);
                        }

                        imageObject = new fabric.Image(imgElement, {
                            left: 0,
                            top: 0,
                            selectable: false, 
                            evented: false,  
                        });

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
                class="btn btn-sm w-full {isDrawingMode ? 'btn-active btn-secondary' : 'btn-secondary'}" 
                on:click={toggleDrawingMode}
            >
                {#if isDrawingMode}
                    <FontAwesomeIcon icon={faMousePointer} />
                {:else}
                    <FontAwesomeIcon icon={faPencilAlt} />
                {/if}
            </button>

            {#if isDrawingMode}
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
                        <button
                            class="btn btn-xs btn-circle"
                            style="background-color: #ff0000;"
                            on:click={() => changeBrushColor('#ff0000')}
                        >
                        </button>
                        <button
                            class="btn btn-xs btn-circle"
                            style="background-color: #ffffff; border: 1px solid #ddd;"
                            on:click={() => changeBrushColor('#ffffff')}
                        >
                        </button>
                        <button
                            class="btn btn-xs btn-circle"
                            style="background-color: #000000;"
                            on:click={() => changeBrushColor('#000000')}
                        >
                        </button>
                    </div>
                </div>
            {/if}

            <button class="btn btn-sm w-full" on:click={undoLastAction}>
                <FontAwesomeIcon icon={faRotateLeft}/>
            </button>
            <button class="btn btn-sm btn-secondary w-full" on:click={generateCaptionForCombinedImage}>
                Generate Caption
            </button>
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

.brush-settings {
    margin-top: 10px;
    width: 100%;
    text-align: center;
}

.color-palette {
    margin-top: 10px;
    display: flex;
    justify-content: space-between;
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
