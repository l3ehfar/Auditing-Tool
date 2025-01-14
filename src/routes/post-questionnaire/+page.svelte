<script lang="ts">
  import { exportedHypotheses } from '$lib/store';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import { notification } from '@marcellejs/core';
  import { writable } from 'svelte/store';

  let data = get(exportedHypotheses);
  let postqtimeleft = 10; 
  let totalQuestions = ( data.length * 4 ) + 16;
  let answeredQuestions = 0;
  let progress = 0;
  let canSubmit = false;
  let disableinputs = false;

  let timerInterval: NodeJS.Timer;
  let timeDisplay = writable(formatTime(postqtimeleft));

  if (!Array.isArray(data)) {
    data = [];
  }

  onMount(() => {
    const savedTime = parseInt(localStorage.getItem('postqtimeleft') || '10', 10);
    const savedDisableState = localStorage.getItem('disableinputs') === 'true';

    postqtimeleft = savedTime;
    disableinputs = savedDisableState;

    if (!disableinputs) {
      startTimer();
    } else {
      postqtimeleft = 0;
      timeDisplay.set(formatTime(postqtimeleft));
    }
  });

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (postqtimeleft > 0) {
        postqtimeleft -= 1;
        timeDisplay.set(formatTime(postqtimeleft));
      } else {
        clearInterval(timerInterval);
        handleTimeout();
      }
    }, 1000);
  }

  function handleTimeout() {
    const unansweredQuestions = highlightUnansweredQuestions();

    if (unansweredQuestions.length > 0) {
      notification({
        title: 'Error',
        message: 'Please answer all required questions before submission.',
        duration: 5000,
        type: 'danger',
      });
    } else {
      disableinputs = true;
      captureASI();
    }
  }

  function highlightUnansweredQuestions() {
    const formControls = document.querySelectorAll('.form-control');
    const unanswered = [];

    formControls.forEach((control) => {
      const radios = control.querySelectorAll('input[type="radio"]');
      const isAnswered = Array.from(radios).some((radio: HTMLInputElement) => radio.checked);

      if (!isAnswered) {
        if (!control.querySelector('textarea')) { // Skip open-ended questions
          unanswered.push(control);
          control.style.border = '2px solid red';
          control.style.borderRadius = '5px';
          control.style.padding = '10px';
        }
      } else {
        control.style.border = '';
        control.style.padding = '';
      }

      radios.forEach((radio: HTMLInputElement) => {
        radio.addEventListener('change', () => {
          if (radio.checked) {
            control.style.border = '';
            control.style.padding = '';
          }
        });
      });
    });

    return unanswered;
  }

  function captureASI() {
    clearInterval(timerInterval);
    // goto('/post-questionnaire-summary');
  }

  function resetTimer() {
    clearInterval(timerInterval);
    postqtimeleft = 10;
    disableinputs = false;
    localStorage.removeItem('postqtimeleft');
    localStorage.removeItem('disableinputs');

    timeDisplay.set(formatTime(postqtimeleft));
    startTimer();

    const formControls = document.querySelectorAll('.form-control');
    formControls.forEach((control) => {
      control.style.border = '';
      control.style.padding = '';
    });

    progress = 0;
    answeredQuestions = 0;
    canSubmit = false;
  }

  function checkProgress() {
    const radios = document.querySelectorAll('form input[type="radio"]');
    const groupedByQuestion = Array.from(radios).reduce(
      (acc, radio: HTMLInputElement) => {
        acc[radio.name] = acc[radio.name] || [];
        acc[radio.name].push(radio);
        return acc;
      },
      {} as Record<string, HTMLInputElement[]>,
    );

    answeredQuestions = Object.values(groupedByQuestion).filter((options) =>
      options.some((opt) => opt.checked),
    ).length;

    progress = (answeredQuestions / totalQuestions) * 100;
    canSubmit = answeredQuestions === totalQuestions;
  }
</script>

<div class="bg-base-100 min-h-screen p-4">
  <div class="container mx-auto">
    <h1 class="text-xl font-medium text-center mb-8">Post-Questionnaire</h1>
    <div class="sticky-container">
      <div class="w-full bg-gray-200 h-4 mb-4 rounded-full overflow-hidden">
        <div class="bg-blue-500 h-4 rounded-full transition-all" style="width: {progress}%"></div>
      </div>
      <div class="flex justify-between items-center mb-6">
        <p>Time left: {$timeDisplay}</p>
        <button on:click={resetTimer} class="btn btn-secondary ml-4">Reset Timer</button>
      </div>
    </div>
    {#if data.length > 0}
      <!-- DaisyUI Carousel -->
      <div class="carousel carousel-center space-x-4">
        {#each data as { id, text }}
          <div class="carousel-item">
            <div class="bg-white shadow-lg rounded-lg p-6 w-96">
              <h3 class="text-base font-semibold mb-4">Hypothesis {id}</h3>
              <p class="mb-6">{text}</p>
              <form class="questionnaire space-y-4">
                <div class="form-control" on:change={checkProgress}>
                  <label class="label font-medium text-sm"
                    >How confident are you about this hypothesis?
                  </label>
                  <div class="likert-scale flex justify-between">
                    <label
                      ><input type="radio" name="confidence-{id}" value="1" /> Very Uncertain</label
                    >
                    <label><input type="radio" name="confidence-{id}" value="2" /> Uncertain</label>
                    <label><input type="radio" name="confidence-{id}" value="3" /> Neutral</label>
                    <label><input type="radio" name="confidence-{id}" value="4" /> Confident</label>
                    <label
                      ><input type="radio" name="confidence-{id}" value="5" /> Very Confident</label
                    >
                  </div>
                </div>

                <div class="form-control" on:change={checkProgress}>
                  <label class="label font-medium text-sm">
                    Did you find any examples that go against your hypothesis? (e.g. cases where
                    your hypothesis doesn't hold true.)
                  </label>
                  <div class="radio-options flex space-x-4">
                    <label>
                      <input type="radio" name="counterexamples-{id}" value="yes" /> Yes
                    </label>
                    <label>
                      <input type="radio" name="counterexamples-{id}" value="no" /> No
                    </label>
                  </div>
                </div>

                <div class="form-control" on:change={checkProgress}>
                  <label class="label font-medium text-sm">
                    How often does the bias described in your hypothesis occur?
                  </label>
                  <div class="likert-scale flex justify-between">
                    <label><input type="radio" name="frequency-{id}" value="1" /> Never</label>
                    <label><input type="radio" name="frequency-{id}" value="2" /> Rarely</label>
                    <label><input type="radio" name="frequency-{id}" value="3" /> Sometimes</label>
                    <label><input type="radio" name="frequency-{id}" value="4" /> Often</label>
                    <label><input type="radio" name="frequency-{id}" value="5" /> Always</label>
                  </div>
                </div>

                <div class="form-control" on:change={checkProgress}>
                  <label class="label font-medium text-sm">
                    How problematic is the bias described in your hypothesis?
                  </label>
                  <div class="likert-scale flex justify-between">
                    <label
                      ><input type="radio" name="problematic-{id}" value="1" /> Not problematic</label
                    >
                    <label
                      ><input type="radio" name="problematic-{id}" value="2" /> Slightly problematic</label
                    >
                    <label
                      ><input type="radio" name="problematic-{id}" value="3" /> Somewhat problematic</label
                    >
                    <label
                      ><input type="radio" name="problematic-{id}" value="4" /> problematic</label
                    >
                    <label
                      ><input type="radio" name="problematic-{id}" value="5" /> Very problematic</label
                    >
                  </div>
                </div>

                <div class="form-control">
                  <label class="label font-medium text-sm">
                    Do you have additional comments about this hypothesis?
                  </label>
                  <textarea
                    name="comments-{id}"
                    placeholder="Add your comments here..."
                    class="textarea textarea-xs textarea-bordered"
                  ></textarea>
                </div>
              </form>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-center text-xs font-medium">No hypotheses to display.</p>
    {/if}

    <section class="bg-white shadow-lg rounded-lg p-8 mb-12 max-w-2xl mx-auto">
      <h2 class="text-lg font-semibold mb-6">Views on the Image Captioning Model</h2>
      <form class="space-y-6" on:change={checkProgress}>
        <div class="form-control">
          <label class="label font-medium text-sm">
            1. How well do you think this image captioning model fulfills its purpose, that is,
            accurately describing images?
          </label>
          <div class="likert-scale flex justify-between">
            <label>
              <input type="radio" name="accuracy" value="1" /> Very poorly
            </label>
            <label>
              <input type="radio" name="accuracy" value="2" /> Poorly
            </label>
            <label>
              <input type="radio" name="accuracy" value="3" /> Neutral
            </label>
            <label>
              <input type="radio" name="accuracy" value="4" /> Accurately
            </label>
            <label>
              <input type="radio" name="accuracy" value="5" /> Very accurately
            </label>
          </div>
        </div>

        <div class="form-control">
          <label class="label font-medium text-sm">
           2.  How well do you think you understand the behavior of the image captioning model after
            this audit?
          </label>
          <div class="likert-scale flex justify-between">
            <label>
              <input type="radio" name="understanding" value="1" /> Not at all
            </label>
            <label>
              <input type="radio" name="understanding" value="2" /> Slightly
            </label>
            <label>
              <input type="radio" name="understanding" value="3" /> Moderately
            </label>
            <label>
              <input type="radio" name="understanding" value="4" /> Well
            </label>
            <label>
              <input type="radio" name="understanding" value="5" /> Very well
            </label>
          </div>
        </div>

        <div class="form-control">
          <label class="label font-medium text-sm">
           3.  To what extent do you think algorithmic biases could cause harm in real-world
            applications?
          </label>
          <div class="likert-scale flex justify-between">
            <label>
              <input type="radio" name="bias-impact" value="1" /> Not at all
            </label>
            <label>
              <input type="radio" name="bias-impact" value="2" /> Slightly
            </label>
            <label>
              <input type="radio" name="bias-impact" value="3" /> Moderately
            </label>
            <label>
              <input type="radio" name="bias-impact" value="4" /> Significantly
            </label>
            <label>
              <input type="radio" name="bias-impact" value="5" /> Very significantly
            </label>
          </div>
        </div>

        <div class="form-control">
          <label class="label font-medium text-sm">
            4. To what extent did you perceive bias against women in the captioning model's descriptions?
          </label>
          <div class="likert-scale flex justify-between">
            <label>
              <input type="radio" name="bias-perception" value="1" /> No bias observed
            </label>
            <label>
              <input type="radio" name="bias-perception" value="2" /> Minimal bias
            </label>
            <label>
              <input type="radio" name="bias-perception" value="3" /> Moderate bias
            </label>
            <label>
              <input type="radio" name="bias-perception" value="4" /> Significant bias
            </label>
            <label>
              <input type="radio" name="bias-perception" value="5" /> Strong bias observed
            </label>
          </div>
        </div>        
      </form>
    </section>

    <section class="bg-white shadow-lg rounded-lg p-8 mb-12 max-w-2xl mx-auto">
      <h2 class="text-lg font-semibold mb-6">Views on the Auditing Interface</h2>
      <form class="space-y-6" on:change={checkProgress}>
        <div class="form-control">
          <label class="label font-medium text-sm">
           1. I found the interface intuitive and easy to use.
          </label>
          <div class="likert-scale flex justify-between">
            <label><input type="radio" name="intuitive" value="1" /> Strongly Disagree</label>
            <label><input type="radio" name="intuitive" value="2" /> Disagree</label>
            <label><input type="radio" name="intuitive" value="3" /> Neutral</label>
            <label><input type="radio" name="intuitive" value="4" /> Agree</label>
            <label><input type="radio" name="intuitive" value="5" /> Strongly Agree</label>
          </div>
        </div>
    
        <div class="form-control">
          <label class="label font-medium text-sm">
            2. The interface required too much effort to learn or use effectively.
          </label>
          <div class="likert-scale flex justify-between">
            <label><input type="radio" name="effort" value="1" /> Strongly Disagree</label>
            <label><input type="radio" name="effort" value="2" /> Disagree</label>
            <label><input type="radio" name="effort" value="3" /> Neutral</label>
            <label><input type="radio" name="effort" value="4" /> Agree</label>
            <label><input type="radio" name="effort" value="5" /> Strongly Agree</label>
          </div>
        </div>
    
        <div class="form-control">
          <label class="label font-medium text-sm">
           3. The interface provided sufficient tools to explore and test my hypotheses.
          </label>
          <div class="likert-scale flex justify-between">
            <label><input type="radio" name="tools" value="1" /> Strongly Disagree</label>
            <label><input type="radio" name="tools" value="2" /> Disagree</label>
            <label><input type="radio" name="tools" value="3" /> Neutral</label>
            <label><input type="radio" name="tools" value="4" /> Agree</label>
            <label><input type="radio" name="tools" value="5" /> Strongly Agree</label>
          </div>
        </div>
    
        <div class="form-control">
          <label class="label font-medium text-sm">
            4. The interface helped me uncover biases I would not have identified otherwise.
          </label>
          <div class="likert-scale flex justify-between">
            <label><input type="radio" name="uncover-bias" value="1" /> Strongly Disagree</label>
            <label><input type="radio" name="uncover-bias" value="2" /> Disagree</label>
            <label><input type="radio" name="uncover-bias" value="3" /> Neutral</label>
            <label><input type="radio" name="uncover-bias" value="4" /> Agree</label>
            <label><input type="radio" name="uncover-bias" value="5" /> Strongly Agree</label>
          </div>
        </div>
    
        <div class="form-control">
          <label class="label font-medium text-sm">
           5. The interface made it difficult to detect nuanced patterns of bias.
          </label>
          <div class="likert-scale flex justify-between">
            <label><input type="radio" name="difficult-patterns" value="1" /> Strongly Disagree</label>
            <label><input type="radio" name="difficult-patterns" value="2" /> Disagree</label>
            <label><input type="radio" name="difficult-patterns" value="3" /> Neutral</label>
            <label><input type="radio" name="difficult-patterns" value="4" /> Agree</label>
            <label><input type="radio" name="difficult-patterns" value="5" /> Strongly Agree</label>
          </div>
        </div>
    
        <div class="form-control">
          <label class="label font-medium text-sm">
           6. The interface did not reveal any biases I wasn’t already expecting.
          </label>
          <div class="likert-scale flex justify-between">
            <label><input type="radio" name="no-new-biases" value="1" /> Strongly Disagree</label>
            <label><input type="radio" name="no-new-biases" value="2" /> Disagree</label>
            <label><input type="radio" name="no-new-biases" value="3" /> Neutral</label>
            <label><input type="radio" name="no-new-biases" value="4" /> Agree</label>
            <label><input type="radio" name="no-new-biases" value="5" /> Strongly Agree</label>
          </div>
        </div>
    
        <div class="form-control">
          <label class="label font-medium text-sm">
           7. The interface helped me understand the systemic patterns of bias in the model's behavior.
          </label>
          <div class="likert-scale flex justify-between">
            <label><input type="radio" name="systemic-bias" value="1" /> Strongly Disagree</label>
            <label><input type="radio" name="systemic-bias" value="2" /> Disagree</label>
            <label><input type="radio" name="systemic-bias" value="3" /> Neutral</label>
            <label><input type="radio" name="systemic-bias" value="4" /> Agree</label>
            <label><input type="radio" name="systemic-bias" value="5" /> Strongly Agree</label>
          </div>
        </div>
    
        <div class="form-control">
          <label class="label font-medium text-sm">
           8. I struggled to connect individual instances to systemic patterns of bias using the interface.
          </label>
          <div class="likert-scale flex justify-between">
            <label><input type="radio" name="struggle-patterns" value="1" /> Strongly Disagree</label>
            <label><input type="radio" name="struggle-patterns" value="2" /> Disagree</label>
            <label><input type="radio" name="struggle-patterns" value="3" /> Neutral</label>
            <label><input type="radio" name="struggle-patterns" value="4" /> Agree</label>
            <label><input type="radio" name="struggle-patterns" value="5" /> Strongly Agree</label>
          </div>
        </div>
    
        <div class="form-control">
          <label class="label font-medium text-sm">
           9. The interface improved my ability to validate or disprove my hypotheses.
          </label>
          <div class="likert-scale flex justify-between">
            <label><input type="radio" name="validate-hypotheses" value="1" /> Strongly Disagree</label>
            <label><input type="radio" name="validate-hypotheses" value="2" /> Disagree</label>
            <label><input type="radio" name="validate-hypotheses" value="3" /> Neutral</label>
            <label><input type="radio" name="validate-hypotheses" value="4" /> Agree</label>
            <label><input type="radio" name="validate-hypotheses" value="5" /> Strongly Agree</label>
          </div>
        </div>
    
        <div class="form-control">
          <label class="label font-medium text-sm">
           10. The interface was insufficient for effectively testing hypotheses.
          </label>
          <div class="likert-scale flex justify-between">
            <label><input type="radio" name="insufficient-testing" value="1" /> Strongly Disagree</label>
            <label><input type="radio" name="insufficient-testing" value="2" /> Disagree</label>
            <label><input type="radio" name="insufficient-testing" value="3" /> Neutral</label>
            <label><input type="radio" name="insufficient-testing" value="4" /> Agree</label>
            <label><input type="radio" name="insufficient-testing" value="5" /> Strongly Agree</label>
          </div>
        </div>
    
        <div class="form-control">
          <label class="label font-medium text-sm">
            11. The interface helped me efficiently collect evidence for my hypotheses.
          </label>
          <div class="likert-scale flex justify-between">
            <label><input type="radio" name="collect-evidence" value="1" /> Strongly Disagree</label>
            <label><input type="radio" name="collect-evidence" value="2" /> Disagree</label>
            <label><input type="radio" name="collect-evidence" value="3" /> Neutral</label>
            <label><input type="radio" name="collect-evidence" value="4" /> Agree</label>
            <label><input type="radio" name="collect-evidence" value="5" /> Strongly Agree</label>
          </div>
        </div>
    
        <div class="form-control">
          <label class="label font-medium text-sm">
           12. Overall, I found this interface helpful in conducting the auditing tasks.
          </label>
          <div class="likert-scale flex justify-between">
            <label><input type="radio" name="helpful-interface" value="1" /> Strongly Disagree</label>
            <label><input type="radio" name="helpful-interface" value="2" /> Disagree</label>
            <label><input type="radio" name="helpful-interface" value="3" /> Neutral</label>
            <label><input type="radio" name="helpful-interface" value="4" /> Agree</label>
            <label><input type="radio" name="helpful-interface" value="5" /> Strongly Agree</label>
          </div>
        </div>
    
        <div class="form-control">
          <label class="label font-medium text-sm">
           13. Is there anything else you would like to share about your experience?
          </label>
          <textarea
            name="additional-comments"
            placeholder="Add your comments here..."
            class="textarea textarea-bordered textarea-xs"
          ></textarea>
        </div>
      </form>
    </section>
    

    <div class="text-center mt-8">
      <button on:click={captureASI} class="btn btn-primary" disabled={!canSubmit}>Submit</button>
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: #ffffff;
  }

  .carousel {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding: 10px;
    padding-bottom: 15px;
  }

  .carousel-item {
    flex: none;
    scroll-snap-align: start;
  }

  .likert-scale label {
    display: inline-block;
    text-align: center;
    width: 14%;
    font-size: 0.7rem;
  }

  .likert-scale input {
    margin: 0 auto;
    display: block;
  }

  .form-control {
    text-align: left;
  }

  .likert-scale span {
    width: 20%;
    text-align: center;
    font-size: 0.7rem;
  }

  .radio-options label {
    display: inline-block;
    text-align: center;
    width: 14%;
    font-size: 0.7rem;
  }

  .sticky-container {
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 10;
    padding: 20px 10px 1px 10px;
    margin-bottom: 10px;
  }

</style>
