<script lang="ts">
  import { onMount } from 'svelte';
  import { checkAndRedirect } from '$lib/redirections';
  import { type User } from '$lib/marcelle';
  import { setProgress } from '$lib/marcelle/logging';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  export let data: { user: User | null };
  let player: any;

  const VIDEO_URLS: Record<string, string> = {
    conditionOne: 'https://www.youtube.com/embed/BXHdz2zcVnQ?cc_load_policy=1&hl=en&modestbranding=1&rel=0',
    conditionTwo: 'https://www.youtube.com/embed/qP6wghCxGnM?cc_load_policy=1&hl=en&modestbranding=1&rel=0',
    conditionThree: 'https://www.youtube.com/embed/puD0GKNsE_w?cc_load_policy=1&hl=en&modestbranding=1&rel=0',
  };

  const userCondition = data.user?.condition || 'conditionOne';
  const videoUrl = VIDEO_URLS[userCondition];

  function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player');
  }

  onMount(async () => {
   
    setProgress('video-tutorial');

    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }
  });

  function submit() {
    goto(`${base}/main`);
  }
</script>

<div class="text-center mx-auto w-full max-w-3xl">
  <div class="bg-white shadow-lg rounded-lg p-8">
    <h1 class="text-2xl font-medium text-center mb-8">Video Tutorial</h1>
    <h2 class="font-semibold mb-6">
      Please watch the video tutorial before moving to the next step. You can return to this video
      at any time during the study if you need to review the instructions.
    </h2>

    <div class="video-wrapper">
      <iframe
        id="youtube-player"
        src={videoUrl}
        frameborder="0"
        allow="autoplay; encrypted-media; fullscreen"
        allowfullscreen
      ></iframe>
    </div>

    <div class="text-center my-6">
      <button on:click={submit} class="btn btn-primary">Proceed</button>
    </div>
  </div>
</div>

<style>
  .video-wrapper {
    position: relative;
    width: 100%;
    height: 90vh; /* 90% of viewport height */
    display: flex;
    justify-content: center;
    align-items: center;
    background: black; /* Ensure no white gaps */
  }

  /* Make the iframe fully responsive */
  .video-wrapper iframe {
    position: absolute;
    width: 100%;
    height: 100%;
    border: none;
  }
</style>
