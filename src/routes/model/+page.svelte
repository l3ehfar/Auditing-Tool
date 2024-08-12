<script lang="ts">
    import { ImageDisplay, input, label, caption } from "$lib/marcelle";
    import { marcelle } from "$lib/utils";
    import {handleCapture} from '$lib/marcelle';
    import { onMount, onDestroy } from 'svelte';

    let captureButton: HTMLButtonElement;

    onMount(() => {
        if (captureButton) {
            captureButton.addEventListener('click', handleCapture);
        }
    });

    onDestroy(() => {
        if (captureButton) {
            captureButton.removeEventListener('click', handleCapture);
        }
    });
</script>

<div class="content">
    <div class="marcelle card">
        <div class="conf-row">
            <!-- Container for Input and Caption -->
            <div class="input-caption-container">
                <div class="marcelle-component" use:marcelle={input}></div>
                <div class="marcelle-component caption" use:marcelle={caption}></div>
            </div>
            <!-- Image Display -->
            <div class="marcelle-component image-display" use:marcelle={ImageDisplay}></div>
            <!-- Label, Capture, and Compare -->
            <div class="label-capture-container">
                <div use:marcelle={label}></div>
                <button bind:this={captureButton} class="btn btn-sm btn-primary">Upload to Dataset</button>
                <!-- <div class="dropdown dropdown-top">
                    <div tabIndex={0} role="button" class="btn btn-sm m-1 btn-primary w-full">Upload to Subset</div>
                    <ul tabIndex={0} class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                        <li><button>Subset 1</button></li>
                        <li><button>Subset 2</button></li>
                        <li><button>make a new subset</button></li>
                    </ul>
                </div> -->
                <button class="btn btn-sm btn-primary">Add to Comparing Tool</button>
            </div>
        </div>
    </div>
</div>


<style>
    .content {
    padding-top: 40px;
    }

    .btn {
        color: var(--heading-color);
    }

    .conf-row {
        display: flex;
        gap: 10px; /* Space between components */
    }

    .marcelle-component {
        background-color: white; 
        padding: 5px;
        border: 1px solid #ddd;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 200px; 
    }

    .marcelle-component.caption {
        padding: 5px;
        border: 2px solid oklch(var(--in));;
        border-radius: 5px;
        color: var(--heading-color);
    }
    

    .image-display {
        width: 200px;
        height: 200px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #fafafa; 
        border: 1px solid #ddd; 
        border-radius: 5px;
    }


    .label-capture-container {
        padding-top: 10px;
        display: flex;
        flex-direction: column; 
        gap: 10px; 
        width: 100%; 
        max-width: 200px; 
    }

    .input-caption-container {
        display: flex;
        flex-direction: column; 
        gap: 5px;
        align-items: center; 
        min-width: 200px; 
    }

</style>