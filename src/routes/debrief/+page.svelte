<script lang="ts">
  import { onMount } from 'svelte';
  import { setProgress } from '$lib/marcelle/logging';
  import type { User } from '$lib/marcelle';
  import { checkAndRedirect } from '$lib/redirections';
  import { pageProgress } from '$lib/marcelle/progress';

  export let data: { user: User | null };

  pageProgress.set(100);

  onMount(async () => {
    await checkAndRedirect(data.user, 'debrief');
    setProgress('debrief');
  });
</script>

<div class="mx-auto w-full max-w-3xl">
  <div class="bg-white shadow-lg rounded-lg p-8">
    <h1 class="text-3xl font-bold text-center">End of Study – Thank You!</h1>

    <section class="mt-6">
      <p>
        Thank you for participating in our study. Your insights will help us better understand how
        users detect and document gender bias in algorithmic systems.
      </p>
    </section>

    <section class="mt-6">
      <p>
        Your responses will be anonymized and used for research purposes to improve algorithm
        auditing methods. If you have any questions, would like to withdraw your data, or request a
        summary of the research findings, please contact us at: <strong>Jules Françoise</strong> –
        <a href="mailto:jules.francoise@lisn.fr" class="text-blue-600 underline"
          >jules.francoise@lisn.fr</a
        >
      </p>
    </section>
    <section class="mt-6"><p>Once again, we appreciate your time and contribution! Please click the following button to complete and submit the study on Prolific.</p></section>
    <button
    class="btn btn-sm btn-primary"
    style="margin-top: 20px;"
    on:click={() => {
      window.location.href = 'https://app.prolific.com/submissions/complete?cc=C1KD169B';
    }}>Complete Submission</button
  >
  </div>
</div>

<style>
  ul {
    margin-bottom: 12px;
  }
</style>
