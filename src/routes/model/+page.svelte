<script lang="ts">
    import { ImageDisplay, input, label, caption } from "$lib/marcelle";
    import { marcelle } from "$lib/utils";
    import {handleCapture} from '$lib/marcelle';
    import { onMount, onDestroy } from 'svelte';
    import { comparisonTool } from "$lib/marcelle/components";
    import { notification } from "@marcellejs/core";

    let captureButton: HTMLButtonElement;
    let addToComparisonButton: HTMLButtonElement;

    let comparisonToolComponent = new comparisonTool();

    onMount(() => {
        if (captureButton) {
            captureButton.addEventListener('click', handleCaptureWithNotification);
        }
        if (addToComparisonButton) {
            addToComparisonButton.addEventListener('click', addToComparison);
        }
        comparisonToolComponent.mount(document.getElementById('comparison-tool-container'));
    });

    onDestroy(() => {
        if (captureButton) {
            captureButton.removeEventListener('click', handleCaptureWithNotification);
        }
        if (addToComparisonButton) {
            addToComparisonButton.removeEventListener('click', addToComparison);
        }
    });

    function handleCaptureWithNotification() {
        const labelValue = label.$value.get();
        if (!labelValue) {
            notification({
                title: 'Missing Label',
                message: 'Please provide a label before uploading to the dataset.',
                duration: 5000,
                type: 'danger'
            });
            return; 
        }

        handleCapture();
        notification({
            title: 'Upload Successful',
            message: 'The item was successfully uploaded to the dataset.',
            duration: 3000,
        });
    }

    function addToComparison() {
        const imageData = input.$images.get();
        const labelValue = label.$value.get();
        const captionValue = caption.$value.get();
        const thumbnailData = input.$thumbnails.get();

        if (!labelValue) {
            notification({
                title: 'Missing Label',
                message: 'Please provide a label before adding to the comparison tool.',
                duration: 5000,
                type: 'danger'
            });
            return; 
        }

        if (imageData && labelValue) {
            const comparisonItem = {
                thumbnail: thumbnailData,
                label: labelValue,
                caption: captionValue,
            };
            comparisonToolComponent.addToComparison(comparisonItem);
            notification({
                title: 'Item Added',
                message: 'Item successfully added to the comparison tool.',
                duration: 3000,
            });
        }
    }
</script>

<div class="content">
    <div class="marcelle card">
        <div class="conf-row">
            <div class="group-components-container">
                <div use:marcelle={input}></div>
                <div use:marcelle={label}></div>
                <button bind:this={captureButton} class="btn btn-sm btn-primary w-full">Upload to Dataset</button>
            </div>
            <div class="marcelle-component image-display" use:marcelle={ImageDisplay}></div>
            <div class="group-components-container">
                <h3>model-generated caption:</h3>
                <div class="marcelle-component caption" use:marcelle={caption}></div>
                <button bind:this={addToComparisonButton} class="btn btn-sm btn-primary w-full">Add to Comparing Tool</button>
            </div>
        </div>
    </div>
    <div class="marcelle card">
        <div id="comparison-tool-container"></div>
    </div>
</div>

<style>
    .content {
    padding-top: 48px;
    }

    .btn {
        color: var(--heading-color);
        font-weight: normal;
    }

    h3 {
    font-size: 0.8rem;
    color: var(--heading-color);
    text-align: left;
    align-self: flex-start; 
    width: 100%;
    margin-top: 15px;
    font-weight: bold;
    }

    .conf-row {
        display: flex;
        gap: 10px; /* Space between components */
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

    .marcelle.card{
        margin: 0;
        margin-top: 4px;
        margin-left: 5px;
        margin-right: 5px;
    }

    .marcelle-component.caption {
        color: var(--heading-color);
        margin-bottom: 20px;
        margin-top: 5px;
        min-height: 100px;
        border: none;
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

    .group-components-container {
        display: flex;
        flex-direction: column; 
        gap: 5px; 
        width: 100%; 
        max-width: 200px; 
        align-items: center; 
    }
</style>
