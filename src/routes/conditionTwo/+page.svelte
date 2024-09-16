<script lang="ts">
    import { ImageDisplay, caption, bindButtonEvents } from "$lib/marcelle";
    import { marcelle } from "$lib/utils";
    import { onMount, onDestroy } from 'svelte';
    import { comparisonTool } from "$lib/marcelle/components";

    let addToComparisonButton: HTMLButtonElement | null = null;
    let comparisonToolComponent = new comparisonTool();
    let cleanup: () => void;

    onMount(() => {
        if (addToComparisonButton) {
            cleanup = bindButtonEvents(addToComparisonButton, comparisonToolComponent);
        }
        comparisonToolComponent.mount(document.getElementById('comparison-tool-container'));
    });

    onDestroy(() => {
        if (cleanup) cleanup(); // Cleanup event listeners when the component is destroyed
    });
</script>

<div class="marcelle card">
    <div class="conf-row">
        <div class="group-components-container">
            <div class="marcelle-component image-display" use:marcelle={ImageDisplay}></div>
            <div class="marcelle-component caption" use:marcelle={caption}></div>
        </div>
        <div class="group-components-container-small">
            <button class="btn btn-sm btn-primary w-full">Manipulate Image</button>
            <button class="btn btn-sm btn-primary w-full">Generate Caption</button>
            <button class="btn btn-sm btn-base-300 w-full">Convert to Original</button>
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

    .marcelle-component.caption{
        font-size: 0.8rem;
        color: var(--heading-color);
        min-height: 58px;
    }

    .conf-row {
        display: flex;
        gap: 10px;
        height: 100%; 
        align-items: center; /* Vertically centers the items */
    }

    .marcelle-component {
        padding: 5px;
        border: 1px solid #ddd;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 200px; 
    }

    .image-display {
        width: 200px;
        height: 200px;
        background-color: #fafafa; 
        border: 1px solid #ddd; 
        border-radius: 5px;
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

    .group-components-container-tool {
        display: flex;
        flex-direction: column; 
        gap: 5px; 
        max-width: 300px; 
        align-items: center; 
    }

    #comparison-tool-container {
        height: 100%; 
        display: flex;
        flex-direction: column;
    }

</style>
