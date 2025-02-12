<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { setProgress } from '$lib/marcelle/logging';
  import { type PostQAnswers, postQ, items } from '$lib/marcelle/post-questionnaire';
  import type { User } from '$lib/marcelle';
  import { base } from '$app/paths';
  import { checkAndRedirect } from '$lib/redirections';
  import LikertScale from '$lib/LikertScale.svelte';
  import { pageProgress } from '$lib/marcelle/progress';

  export let data: { user: User | null };
  let answers: Partial<PostQAnswers> = {};

  const keys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];

  $: pageProgress.set(
    (Object.keys(answers).filter((k) => keys.includes(k)).length * 100) / keys.length,
  );
  $: canSubmit = $pageProgress === 100;
  $: disabled = answers.submitted === true;

  onMount(async () => {
    await checkAndRedirect(data.user, 'post-questionnaire');
    setProgress('post-questionnaire');
    answers = await postQ.retrieve();
  });

  function record(key: keyof typeof answers, e: any) {
    if (key === 'openEndedResponse') {
      answers[key] = e.target.value; 
    } else {
      answers[key] = e.detail; 
    }
    postQ.record(answers);
  }

  function submit() {
    postQ.submit().then(() => {
      goto(`${base}/debrief`);
    });
  }
</script>

<div class="text-center mx-auto w-full max-w-3xl">
  <div class="bg-white shadow-lg rounded-lg p-8">
    <h1 class="text-2xl font-medium text-center mb-8">Post-Study Questionnaire</h1>
    <form class="space-y-6">
      <div class="space-y-4">
        {#each items as { question, name }}
          {#if name === 'openEndedResponse'}
            <div>
              <label for={name} class="block text-left">{question}</label>
              <textarea
                id={name}
                bind:value={answers[name]}
                on:input={(e) => record(name, e)}
                class="w-full p-2 border border-gray-300 rounded-lg"
                rows="4"
                placeholder="Your response (optional)"
                {disabled}
              ></textarea>
            </div>
          {:else}
            <LikertScale
              {question}
              {name}
              value={answers[name]}
              on:change={(e) => record(name, e)}
              {disabled}
            />
          {/if}
        {/each}
      </div>
    </form>
  </div>
  <div class="text-center my-6">
    <button on:click={submit} class="btn btn-primary" disabled={!canSubmit}>Submit</button>
  </div>
</div>

<style>
  .bg-white {
    max-width: 700px;
    margin: 0 auto;
  }
</style>
