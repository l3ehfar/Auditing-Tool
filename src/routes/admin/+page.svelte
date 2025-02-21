<script lang="ts">
  import { fetchMainDatasetFromGitHub, fetchTutorialDatasetFromGitHub, trainingSet, tutorialDataset } from '$lib/marcelle';
  import { marcelle } from '$lib/utils';
  import { datasetBrowser } from '@marcellejs/core';

  const mainbrowser = datasetBrowser(trainingSet);
  const tutorialbrowser = datasetBrowser(tutorialDataset);
</script>

<div class="text-center mx-auto w-full max-w-3xl">
  <div class="bg-white shadow-lg rounded-lg p-8">
    <h2>Upload dataset</h2>
    <button class="btn btn-primary" on:click={fetchMainDatasetFromGitHub}>Upload main dataset</button>
    <button class="btn btn-primary" on:click={fetchTutorialDatasetFromGitHub}>Upload tutorial dataset</button>
    <div use:marcelle={mainbrowser}></div>
    <div use:marcelle={tutorialbrowser}></div>
  </div>
</div>
