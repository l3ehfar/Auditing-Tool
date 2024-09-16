<script lang="ts">
    import { ImageDisplay, caption, bindButtonEvents } from "$lib/marcelle";
    import { marcelle } from "$lib/utils";
    import { onMount, onDestroy } from 'svelte';
    import { comparisonTool } from "$lib/marcelle/components";
    import * as fabric from 'fabric';

    let addToComparisonButton: HTMLButtonElement | null = null;
    let comparisonToolComponent = new comparisonTool();
    let cleanup: () => void;

    let canvas: fabric.Canvas | null = null;
    let isDrawingMode = false;
    let canvasHistory: any[] = []; 

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

    function undoLastAction() {
        if (canvas && canvas.getObjects().length > 0) {
            const lastObject = canvas.getObjects().pop();
            canvas.remove(lastObject);
            canvasHistory.pop(); 
        }
    }

    onMount(() => {
        const canvasEl = document.getElementById('fabric-canvas') as HTMLCanvasElement;
        if (!canvasEl) return;

        const container = document.querySelector('.image-display') as HTMLDivElement;
        const width = container.clientWidth;
        const height = container.clientHeight;

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

        if (addToComparisonButton) {
            cleanup = bindButtonEvents(addToComparisonButton, comparisonToolComponent);
        }
        comparisonToolComponent.mount(document.getElementById('comparison-tool-container'));
    });

    onDestroy(() => {
        if (cleanup) cleanup();
    });
</script>

<div class="marcelle card">
    <div class="conf-row">
        <div class="group-components-container">
            <div class="marcelle-component image-display" use:marcelle={ImageDisplay}>
                <div class="canvas-container">
                    <canvas id="fabric-canvas"></canvas>
                </div>
            </div>
            <div class="marcelle-component caption" use:marcelle={caption}></div>
        </div>
        <div class="group-components-container-small">
            <button 
                class="btn btn-sm w-full {isDrawingMode ? 'btn-active btn-primary' : 'btn-primary'}" 
                on:click={toggleDrawingMode}
            >
                Manipulate Image
            </button>
            <button class="btn btn-sm btn-base-200 w-full" on:click={undoLastAction}>
                Undo
            </button>
            <button class="btn btn-sm btn-primary w-full">Generate Caption</button>
        </div>
        <div class="group-components-container-tool">
            <button bind:this={addToComparisonButton} class="btn btn-sm btn-primary w-full">Add To Comparison Tool</button>
            <div id="comparison-tool-container"></div>
        </div>
    </div>
</div>


<style>
.marcelle.card {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
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
    position: absolute;
    top: 0;
    left: 0;
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