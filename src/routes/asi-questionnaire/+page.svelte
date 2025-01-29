<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { notification } from '@marcellejs/core';
  import { setProgress } from '$lib/marcelle/logging';
  import { type AsiQAnswers, asiQ, items } from '$lib/marcelle/asi-questionnaire';
  import type { User } from '$lib/marcelle';
  import { base } from '$app/paths';
  import { checkAndRedirect } from '$lib/redirections';
  import LikertScale from '$lib/LikertScale.svelte';

  export let data: { user: User | null };
  let answers: Partial<AsiQAnswers> = {};

  const keys = [
    'q1',
    'q2',
    'q3',
    'q4',
    'q5',
    'q6',
    'q7',
    'q8',
    'q9',
    'q10',
    'q11',
    'q12',
    'q13',
    'q14',
    'q15',
    'q16',
    'q17',
    'q18',
    'q19',
    'q20',
    'q21',
    'q22',
  ];

  $: progress = (Object.keys(answers).filter((k) => keys.includes(k)).length * 100) / keys.length;
  $: canSubmit = progress === 100;
  $: disabled = answers.submitted === true;

  onMount(async () => {
    await checkAndRedirect(data.user, 'asi-questionnaire');
    setProgress('asi-questionnaire');
    answers = await asiQ.retrieve();
  });

  function calculateASIResults(responses: AsiQAnswers): {
    hostileSexism: number;
    benevolentSexism: number;
    totalScore: number;
  } {
    const reverseCodedItems = ['q3', 'q6', 'q7', 'q13', 'q18', 'q21'];

    const hostileSexismItems = [
      'q2',
      'q4',
      'q5',
      'q7',
      'q10',
      'q11',
      'q14',
      'q15',
      'q16',
      'q18',
      'q21',
    ];
    const benevolentSexismItems = [
      'q1',
      'q3',
      'q6',
      'q8',
      'q9',
      'q12',
      'q13',
      'q17',
      'q19',
      'q20',
      'q22',
    ];

    const adjustedResponses = Object.fromEntries(
      Object.entries(responses).map(([key, value]) => [
        key,
        reverseCodedItems.includes(key) ? 5 - value : value,
      ]),
    );

    const hostileSexismScores = hostileSexismItems.map((key) => adjustedResponses[key] || 0);
    const hostileSexism =
      hostileSexismScores.reduce((sum, value) => sum + value, 0) / hostileSexismScores.length;

    const benevolentSexismScores = benevolentSexismItems.map((key) => adjustedResponses[key] || 0);
    const benevolentSexism =
      benevolentSexismScores.reduce((sum, value) => sum + value, 0) / benevolentSexismScores.length;

    const allItems = [...hostileSexismItems, ...benevolentSexismItems];
    const allScores = allItems.map((key) => adjustedResponses[key] || 0);
    const totalScore = allScores.reduce((sum, value) => sum + value, 0) / allScores.length;

    return { hostileSexism, benevolentSexism, totalScore };
  }

  function record(key: keyof typeof answers, e: any) {
    answers[key] = e.detail;
    asiQ.record(answers);
  }

  function submit() {
    const { hostileSexism, benevolentSexism, totalScore } = calculateASIResults(
      answers as AsiQAnswers,
    );
    asiQ.record({
      scores: {
        hostileSexism: hostileSexism,
        benevolentSexism: benevolentSexism,
        totalScore: totalScore,
      },
    });

    asiQ.submit().then(() => {
      goto(`${base}/main`);
    });
  }
</script>

<div class="bg-base-100 min-h-screen p-4 flex items-center justify-center">
  <div class="container mx-auto max-w-2xl">
    <div class="bg-white shadow-lg rounded-lg p-8">
      <div class="sticky-container">
        <div class="w-full bg-gray-200 h-4 mb-4 rounded-full overflow-hidden">
          <div class="bg-blue-500 h-4 rounded-full transition-all" style="width: {progress}%"></div>
        </div>
      </div>
      <h1 class="text-xl font-medium text-center mb-8">Ambivalent Sexism Inventory (ASI)</h1>
      <h2 class="text-sm font-semibold mb-6">
        The statements on this page concern women, men, and their relationships in contemporary
        society. Please indicate the degree to which you agree or disagree with each statement by
        clicking on the numbered buttons below. The inventory takes roughly 5 minutes to complete.
      </h2>
      <form class="space-y-6">
        <div class="space-y-4">
          {#each items as { question, name }}
            <LikertScale
              {question}
              {name}
              value={answers[name]}
              on:change={(e) => record(name, e)}
              {disabled}
            />
          {/each}
        </div>
      </form>
    </div>
    <div class="text-center mt-8">
      <button on:click={submit} class="btn btn-primary" disabled={!canSubmit}>Submit</button>
    </div>
  </div>
</div>

<style>
  .container {
    text-align: center;
  }

  .bg-white {
    max-width: 700px;
    margin: 0 auto;
  }

  .sticky-container {
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 10;
    padding: 10px 10px 1px 10px;
    /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);  */
  }
</style>
