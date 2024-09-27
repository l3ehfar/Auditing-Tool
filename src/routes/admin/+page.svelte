<script lang="ts">
    import { ImageDisplay, input, label } from "$lib/marcelle";  
    import { handleCapture } from "$lib/marcelle";
    import { marcelle } from "$lib/utils";
    
    function captureImage() {
        handleCapture();  // Call the capture function
    }

</script>

<div class="marcelle card">
    <div class="conf-row">
       <div use:marcelle={input}></div>
        <div use:marcelle={label}></div>
        <button  class="btn" on:click={captureImage}>add to dataset</button>
        <div use:marcelle={ImageDisplay}></div>
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
        padding: 5px;
        text-align: center;
        border: none;
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
        flex-direction: column; 
        gap: 5px; 
        align-items: center;
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

    .marcelle-component.caption {
        min-height: 40px;
        max-height: 60px;
        text-align: center;
        padding: 5px;
    }

    .group-components-container-small {
        display: flex;
        flex-direction: column;
        gap: 5px;
        max-width: 100px;
        align-items: center;
    }
</style>




          