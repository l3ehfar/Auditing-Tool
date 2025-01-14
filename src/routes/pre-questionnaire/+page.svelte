<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { notification } from '@marcellejs/core';
  
  let timeLeft = 30;
  let totalQuestions = 4;
  let answeredQuestions = 0;
  let progress = 0;
  let canSubmit = false;
  let disableInputs = false;

  let timerInterval: NodeJS.Timer;

  onMount(() => {
    const savedTime = parseInt(localStorage.getItem('timeLeft') || '30');
    const savedDisableState = localStorage.getItem('disableInputs') === 'true';

    timeLeft = savedTime;
    disableInputs = savedDisableState;

    if (!disableInputs) {
      timerInterval = setInterval(() => {
        if (timeLeft > 0) {
          timeLeft -= 1;
          localStorage.setItem('timeLeft', timeLeft.toString());
        } else {
          clearInterval(timerInterval);

          const unansweredQuestions = highlightUnansweredQuestions();

          if (unansweredQuestions.length > 0) {
            notification({
              title: 'Error',
              message: 'Please answer all questions before time runs out.',
              duration: 5000,
              type: 'danger'
            });
          } else {
            
            disableInputs = true;
            localStorage.setItem('disableInputs', 'true');
            captureDemographics();
          }
        }
      }, 1000);
    }
  });

  function highlightUnansweredQuestions() {
    const selects = document.querySelectorAll('select');
    const unansweredQuestions = Array.from(selects).filter(
      (select) => (select as HTMLSelectElement).value === '',
    );

    unansweredQuestions.forEach((select) => {
      (select as HTMLSelectElement).style.border = '2px solid red';
    });

    return unansweredQuestions;
  }

  function checkProgress() {
    const selects = document.querySelectorAll('select');
    answeredQuestions = Array.from(selects).filter(
      (select) => (select as HTMLSelectElement).value !== '',
    ).length;

    selects.forEach((select) => {
      if ((select as HTMLSelectElement).value !== '') {
        (select as HTMLSelectElement).style.border = '';
      }
    });

    progress = (answeredQuestions / totalQuestions) * 100; 
    canSubmit = answeredQuestions === totalQuestions;
  }

  function captureDemographics() {
    const formData: { [key: string]: string } = {};

    const demographicsForm = document.querySelector('section:nth-child(1) form') as HTMLFormElement;
    if (demographicsForm) {
      const educationSelect = demographicsForm.querySelector(
        '[name="accuracy"]',
      ) as HTMLSelectElement;
      const fieldSelect = demographicsForm.querySelector(
        '[name="understanding"]',
      ) as HTMLSelectElement;

      formData['education'] = educationSelect.value;
      formData['field'] = fieldSelect.value;
    }

    const aiLiteracyForm = document.querySelector('section:nth-child(2) form') as HTMLFormElement;
    if (aiLiteracyForm) {
      const mlFamiliaritySelect = aiLiteracyForm.querySelector(
        '[name="intuitive"]',
      ) as HTMLSelectElement;
      const imageCaptioningSelect = aiLiteracyForm.querySelector(
        '[name="effort"]',
      ) as HTMLSelectElement;

      formData['mlFamiliarity'] = mlFamiliaritySelect.value;
      formData['imageCaptioning'] = imageCaptioningSelect.value;
    }

    console.log('Captured Data:', formData);
    goto('/ASI-questionnaire');
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timeLeft = 30;
    disableInputs = false;
    localStorage.removeItem('timeLeft');
    localStorage.removeItem('disableInputs');

    const selects = document.querySelectorAll('select');
    selects.forEach((select) => {
      (select as HTMLSelectElement).style.border = ''; 
    });

    timerInterval = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft -= 1;
        localStorage.setItem('timeLeft', timeLeft.toString());
      } else {
        clearInterval(timerInterval);

        
        const unansweredQuestions = highlightUnansweredQuestions();

        if (unansweredQuestions.length > 0) {
          notification({
              title: 'Error',
              message: 'Please answer all questions before time runs out.',
              duration: 5000,
              type: 'danger'
            });
        } else {
          disableInputs = true;
          localStorage.setItem('disableInputs', 'true');
          captureDemographics();
        }
      }
    }, 1000);
  }
</script>

<div class="bg-base-100 min-h-screen p-4">
  <div class="container mx-auto">
    <h1 class="text-xl font-medium text-center mb-8">Pre-Questionnaire</h1>

    <div class="w-full bg-gray-200 h-4 mb-4 rounded-full overflow-hidden">
      <div class="bg-blue-500 h-4 rounded-full transition-all" style="width: {progress}%"></div>
    </div>

    <div class="flex justify-between items-center mb-6">
      <p>Time left: {timeLeft} seconds</p>
      <!-- <p>Progress: {Math.round(progress)}%</p> -->
      <button on:click={resetTimer} class="btn btn-secondary ml-4">Reset Timer</button>
    </div>

    <div class="flex flex-wrap space-x-6">
      <section class="bg-white shadow-lg rounded-lg p-8 flex-1">
        <h2 class="text-lg font-semibold mb-6">Demographics</h2>
        <form class="space-y-6" on:change={checkProgress}>
          <div class="form-control">
            <label class="label font-medium text-sm">
              Indicate your highest level of education:
            </label>
            <select
              name="accuracy"
              class="select select-bordered select-xs"
              disabled={disableInputs}
            >
              <option value="">Select...</option>
              <option>High school or equivalent</option>
              <option>College</option>
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
            >
              <option value="">Select...</option>
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

      <section class="bg-white shadow-lg rounded-lg p-8 flex-1">
        <h2 class="text-lg font-semibold mb-6">AI Literacy</h2>
        <form class="space-y-4" on:change={checkProgress}>
          <div class="form-control">
            <label class="label font-medium text-sm">
              How familiar are you with the Machine Learning field?
            </label>
            <select
              name="intuitive"
              class="select select-bordered select-xs"
              disabled={disableInputs}
            >
              <option value="">Select...</option>
              <option value="1"> (1) Not at all</option>
              <option value="2"> (2) Only a little</option>
              <option value="3"> (3) To some extent</option>
              <option value="4"> (4) Rather much</option>
              <option value="5"> (5) Very much</option>
            </select>
          </div>

          <div class="form-control">
            <label class="label font-medium text-sm">
              How familiar are you with image captioning models?
            </label>
            <select name="effort" class="select select-bordered select-xs" disabled={disableInputs}>
              <option value="">Select...</option>
              <option value="1"> (1) Not at all</option>
              <option value="2"> (2) Only a little</option>
              <option value="3"> (3) To some extent</option>
              <option value="4"> (4) Rather much</option>
              <option value="5"> (5) Very much</option>
            </select>
          </div>
        </form>
      </section>
    </div>

    <div class="text-center mt-8">
      <button on:click={captureDemographics} class="btn btn-primary" disabled={!canSubmit}>
        Submit
      </button>
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: #ffffff;
  }
</style>
