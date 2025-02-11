<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { setProgress } from '$lib/marcelle/logging';
  import { type PreQAnswers, preQ } from '$lib/marcelle/pre-questionnaire';
  import type { User } from '$lib/marcelle';
  import { base } from '$app/paths';
  import { checkAndRedirect } from '$lib/redirections';
  import { pageProgress } from '$lib/marcelle/progress';

  export let data: { user: User | null };
  let answers: Partial<PreQAnswers> = {};

  const keys = ['accuracy', 'understanding', 'intuitive', 'effort'];

  $: pageProgress.set(
    (Object.keys(answers).filter((k) => keys.includes(k)).length * 100) / keys.length,
  );
  $: canSubmit = $pageProgress === 100;
  $: disableInputs = answers.submitted === true;

  onMount(async () => {
    await checkAndRedirect(data.user, 'pre-questionnaire');
    setProgress('pre-questionnaire');
    answers = await preQ.retrieve();
  });

  function record(key: keyof typeof answers, e: any) {
    answers[key] = e.target.value;
    preQ.record(answers);
  }

  function submit() {
    preQ.submit().then(() => {
      goto(`${base}/asi-questionnaire`);
    });
  }
</script>

<div class="text-center mx-auto w-full max-w-3xl">
  <div class="bg-white shadow-lg rounded-lg p-8">
    <h1 class="text-2xl font-medium text-center mb-8">Pre-Questionnaire</h1>
    <section>
      <h2 class="text-lg font-semibold mb-6">Demographics</h2>
      <form class="space-y-6">
        <div class="form-control">
          <label class="label font-medium text-sm">
            Indicate your highest level of education:
          </label>
          <select
            name="accuracy"
            class="select select-bordered select-xs"
            disabled={disableInputs}
            value={answers.accuracy || ''}
            on:change={(e) => record('accuracy', e)}
          >
            <option value="" disabled>Select...</option>
            <option>High school or equivalent</option>
            <option>College</option>
            <option>Associate Degree</option>
            <option>Bachelor's Degree</option>
            <option>Master's Degree</option>
            <option>Doctoral degree</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label font-medium text-sm">
            Indicate your field of study/profession:
          </label>
          <select
            name="understanding"
            class="select select-bordered select-xs"
            disabled={disableInputs}
            value={answers.understanding || ''}
            on:change={(e) => record('understanding', e)}
          >
            <option value="" disabled>Select...</option>
            <option>Computer Science/Information Technology</option>
            <option>Engineering</option>
            <option>Mathematics/Statistics</option>
            <option>Social Sciences</option>
            <option>Life Sciences</option>
            <option>Arts/Humanities</option>
            <option>Other</option>
          </select>
        </div>
      </form>
    </section>

    <section class="mt-8">
      <h2 class="text-lg font-semibold mb-6">AI Literacy</h2>
      <form class="space-y-4">
        <!-- on:change={checkProgress} -->
        <div class="form-control">
          <label class="label font-medium text-sm">
            How familiar are you with the Machine Learning field?
          </label>
          <select
            name="intuitive"
            class="select select-bordered select-xs"
            disabled={disableInputs}
            value={answers.intuitive || ''}
            on:change={(e) => record('intuitive', e)}
          >
            <option value="" disabled>Select...</option>
            <option value="1"> (1) Not at all (have mostly just heard about the term)</option>
            <option value="2">
              (2) A little (have read some non-technical materials or explainers on the topic)</option
            >
            <option value="3">
              (3) To some extent (have read technical materials or explainers on the topic)</option
            >
            <option value="4"> (4) Quite a bit (have taken a course on this topic)</option>
            <option value="5"> (5) Very much (have taken multiple courses on this topic)</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label font-medium text-sm">
            How familiar are you with image captioning models?
          </label>
          <select
            name="effort"
            class="select select-bordered select-xs"
            disabled={disableInputs}
            value={answers.effort || ''}
            on:change={(e) => record('effort', e)}
          >
            <option value="" disabled>Select...</option>
            <option value="1"> (1) Not at all (just heard about them)</option>
            <option value="2"> (2) A little (know their applications)</option>
            <option value="3"> (3) To some extent (have worked with them)</option>
            <option value="4">
              (4) Quite a bit (read non-technical materials & worked with them)</option
            >
            <option value="5"> (5) Very much (familiar with technical details)</option>
          </select>
        </div>
      </form>
    </section>
  </div>
  <div class="text-center my-6">
    <button on:click={submit} class="btn btn-primary" disabled={!canSubmit}>Submit</button>
  </div>
</div>

<style>
  :global(body) {
    background-color: #ffffff;
  }
</style>
