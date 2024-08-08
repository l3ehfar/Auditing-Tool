<script>
    import { ImageDisplay, input, label, capture, addToSubset, compare } from "$lib/marcelle";
    import { marcelle } from "$lib/utils";
</script>

<div class="content">
    <div class="marcelle card">
        <div class="conf-row">
            <div class="marcelle-component" use:marcelle={input}></div>
            <div class="marcelle-component image-display" use:marcelle={ImageDisplay}></div>
            <div class="label-capture-container">
                <div use:marcelle={label}></div>
                <div use:marcelle={capture}></div>
                <div use:marcelle={addToSubset}></div>
                <div use:marcelle={compare}></div>
            </div>
        </div>
    </div>
</div>

  
<style>
    .content {
        padding-top: 40px;
    }
    .conf-row {
        display: flex;
        gap: 10px; /* Space between components */
    }

    .marcelle-component {
        background-color: white; /* Ensure the background is white */
        padding: 5px;
        border: 1px solid #ddd; /* Light border for separation */
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 200px; /* Ensure components have a minimum width */
    }

    .image-display {
        width: 200px;
        height: 200px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #fafafa; /* Light background for the image area */
        border: 1px solid #ddd; /* Light border for separation */
        border-radius: 5px;
    }

    .image-display img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    }

    .label-capture-container {
        padding-top: 10px;
        display: flex;
        flex-direction: column; /* Stack the label and capture vertically */
        gap: 10px; /* Space between label and capture components */
        width: 100%; /* Ensure full width usage if needed */
        max-width: 200px; /* Adjust max-width as needed */
    }

</style>
  