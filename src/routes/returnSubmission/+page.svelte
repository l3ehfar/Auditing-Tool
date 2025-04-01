<script lang="ts">
  import { onMount } from 'svelte';
  import { setProgress } from '$lib/marcelle/logging';
  import type { User } from '$lib/marcelle';
  import { checkAndRedirect } from '$lib/redirections';
  import { pageProgress } from '$lib/marcelle/progress';

  export let data: { user: User | null };

  pageProgress.set(100);

  onMount(async () => {
    await checkAndRedirect(data.user, 'returnSubmission');
    setProgress('returnSubmission');
  });
</script>

<div class="mx-auto w-full max-w-3xl">
  <div class="bg-white shadow-lg rounded-lg p-8">
    <h1 class="text-3xl font-bold text-center">End of Study</h1>

    <section class="mt-6">
      <p>
        You’ve been redirected due to inattention/inactivity. Please return the study on Prolific.
      </p>
    </section>
    <button
      class="btn btn-sm btn-primary"
      style="margin-top: 20px;"
      on:click={() => {
        window.location.href = 'https://app.prolific.com/submissions/complete?cc=C1O01G88';
      }}>Return Submission</button
    >
  </div>
</div>

<style>
  ul {
    margin-bottom: 12px;
  }
</style>
