<script lang="ts">
  import { ImageDisplay, input, label } from '$lib/marcelle';
  import { handleCapture } from '$lib/marcelle';
  import { marcelle } from '$lib/utils';

  function captureImage() {
    handleCapture(); // Call the capture function
  }
  import { store } from '$lib/marcelle';
  import Dataset from '$lib/dataset/Dataset.svelte';

  async function signOut() {
    console.log('Sign out initiated');
    try {
      await store.logout();
      console.log('Sign out successful, redirecting to login page');
      window.location.href = '/auth/login'; // Redirect to login
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }
</script>

<div class="flex flex-col h-screen">
  <div class="main-section">
    <div class="left-panel">
      <div class="slot-section">
        <div class="marcelle card">
          <div class="conf-row">
            <div use:marcelle={input}></div>
            <div use:marcelle={label}></div>
            <button class="btn" on:click={captureImage}>add to dataset</button>
            <div use:marcelle={ImageDisplay}></div>
          </div>
          <button on:click={signOut}>Sign Out</button>
        </div>
      </div>
      <div class="dataset-section">
        <Dataset />
      </div>
    </div>
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

  .main-section {
    display: flex;
    flex: 1;
    height: 100%;
    width: 100%;
  }

  .left-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 2px;
    gap: 2px;
    background-color: oklch(var(--b2));
  }

  .slot-section,
  .dataset-section {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2px;
    overflow: hidden;
  }
</style>
