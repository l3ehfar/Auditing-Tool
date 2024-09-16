<script lang="ts">
    import { ImageDisplay, input, label, caption } from "$lib/marcelle";
    import { marcelle } from "$lib/utils";

    let captureButton: HTMLButtonElement;
</script>

<div class="marcelle card">
    <div class="conf-row">
        <div class="group-components-container">
            <!-- <div use:marcelle={input}></div>
            <div use:marcelle={label}></div>
            <button bind:this={captureButton} class="btn btn-sm btn-primary w-full">Upload to Dataset</button> -->
        </div>
        <div class="marcelle-component image-display" use:marcelle={ImageDisplay}></div>
        <div class="group-components-container">
            <div class="marcelle-component caption" use:marcelle={caption}></div>
        </div>
    </div>
</div>

<style>
    .marcelle.card {
        display: flex;
        flex-direction: column;
        height: 100%;
        margin: 5px;
        padding: 10px;
        width: 100%;
        box-sizing: border-box;
        align-items: center;
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

    .marcelle-component.caption {
        color: var(--heading-color);
        margin: 30px 0 20px 0;
        min-height: 100px;
    }

    /* .btn {
        color: var(--heading-color);
        font-weight: normal;
    } */

    .group-components-container {
        display: flex;
        flex-direction: column;
        gap: 5px;
        max-width: 200px;
        align-items: center;
    }
    
</style>
