<script lang="ts">
  import { fetchDatasetFromGitHub, ImageDisplay, input, label, trainingSet } from '$lib/marcelle';
  import { handleCapture } from '$lib/marcelle';
  import { marcelle } from '$lib/utils';
  import { datasetBrowser } from '@marcellejs/core';

  const browser = datasetBrowser(trainingSet);
</script>

<div class="text-center mx-auto w-full max-w-3xl">
  <div class="bg-white shadow-lg rounded-lg p-8">
    <h2>Upload dataset</h2>
    <button class="btn btn-primary" on:click={fetchDatasetFromGitHub}>Upload</button>
    <div use:marcelle={browser}></div>
  </div>
</div>
