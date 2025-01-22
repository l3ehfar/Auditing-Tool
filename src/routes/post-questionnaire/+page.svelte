<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { notification } from '@marcellejs/core';

  let PQTimeLeft = 30;
  let totalQuestions = 13;
  let answeredQuestions = 0;
  let progress = 0;
  let canSubmit = false;
  let disableInputs = false;

  let timerInterval: NodeJS.Timer;

  async function loadUserData(userId: string) {
    try {
      const savedResponses = JSON.parse(localStorage.getItem(`PQ-${userId}`) || '{}');
      console.log('Loaded post-questionnaire responses:', savedResponses);

      Object.entries(savedResponses).forEach(([name, value]) => {
        const radio = document.querySelector(
          `input[name="${name}"][value="${value}"]`,
        ) as HTMLInputElement;
        if (radio) radio.checked = true;
        const textarea = document.querySelector(`textarea[name="${name}"]`) as HTMLTextAreaElement;
        if (textarea) textarea.value = value as string;
      });

      checkProgress();
    } catch (err) {
      console.error('Error loading post-questionnaire data:', err);
    }
  }

  function saveResponse(question: string, value: string) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('Cannot save response: User ID is missing.');
      return;
    }

    const savedResponses = JSON.parse(localStorage.getItem(`PQ-${userId}`) || '{}');

    savedResponses[question] = value;

    localStorage.setItem(`PQ-${userId}`, JSON.stringify(savedResponses));
    // console.log(`Saved response for ${question}: ${value}`);
  }

  onMount(() => {
    const userId = localStorage.getItem('userId');
    const lastUserId = localStorage.getItem('lastUserId');
    const alreadySubmitted = localStorage.getItem(`PQSubmitted-${userId}`) === 'true';

    if (!userId) {
      console.warn('No user ID found. Redirecting to signup...');
      goto('/auth/signup');
      return;
    }

    console.log('Logged-in user ID:', userId);

    // if (alreadySubmitted) {
    //   console.log('ASI questionnaire already submitted. Redirecting...');
    //   goto('/conditionTwo');
    //   return;
    // }

    if (userId !== lastUserId) {
      console.log('New user detected. Resetting timer and states.');
      PQTimeLeft = 30;
      disableInputs = false;

      localStorage.removeItem('PQTimeLeft');
      localStorage.removeItem('disableInputs');

      localStorage.setItem('lastUserId', userId);
    } else {
      console.log('Returning user detected. Loading saved data.');
      const savedTime = parseInt(localStorage.getItem('PQTimeLeft') || '30');
      const savedDisableState = localStorage.getItem('disableInputs') === 'true';

      PQTimeLeft = savedTime;
      disableInputs = savedDisableState;
    }

    loadUserData(userId);

    // if (disableInputs) {
    //   console.log('Disabling inputs as the questionnaire is already completed.');
    // }

    if (!disableInputs) {
      timerInterval = setInterval(() => {
        if (PQTimeLeft > 0) {
          PQTimeLeft -= 1;
          localStorage.setItem('PQTimeLeft', PQTimeLeft.toString());
        } else {
          clearInterval(timerInterval);

          const unansweredQuestions = highlightUnansweredQuestions();

          if (unansweredQuestions.length > 0) {
            notification({
              title: 'Error',
              message: 'Please answer all questions before time runs out.',
              duration: 5000,
              type: 'danger',
            });
          } else {
            disableInputs = true;
            localStorage.setItem('disableInputs', 'true');
            // captureASIResponses();
          }
        }
      }, 1000);
    }
  });

  function highlightUnansweredQuestions() {
    const formControls = document.querySelectorAll('.form-control');
    const unanswered = [];

    formControls.forEach((control) => {
      const radios = control.querySelectorAll('input[type="radio"]');
      const textarea = control.querySelector('textarea');
      const name = radios[0]?.name || textarea?.name;

      // Check if the question is the optional open-ended one and skip it
      if (name !== 'additional-comments') {
        const isAnswered =
          Array.from(radios).some((radio: HTMLInputElement) => radio.checked) ||
          (textarea && textarea.value.trim() !== ''); // Include open-ended question in validation

        if (!isAnswered) {
          unanswered.push(control);
          control.style.border = '2px solid red';
          control.style.borderRadius = '5px';

          // Add event listener to remove highlighting once answered
          if (radios.length > 0) {
            radios.forEach((radio: HTMLInputElement) => {
              radio.addEventListener('change', () => {
                control.style.border = '';
                control.style.borderRadius = '';
              });
            });
          }

          if (textarea) {
            textarea.addEventListener('input', () => {
              control.style.border = '';
              control.style.borderRadius = '';
            });
          }
        } else {
          control.style.border = '';
          control.style.borderRadius = '';
        }
      }
    });

    return unanswered;
  }

  function checkProgress() {
    const radios = document.querySelectorAll('form input[type="radio"]');
    const textareas = document.querySelectorAll('form textarea');

    // Group radios by question name
    const groupedByQuestion = Array.from(radios).reduce(
      (acc, radio: HTMLInputElement) => {
        acc[radio.name] = acc[radio.name] || [];
        acc[radio.name].push(radio);
        return acc;
      },
      {} as Record<string, HTMLInputElement[]>,
    );

    // Count answered radio questions
    let answeredRadios = Object.values(groupedByQuestion).filter((options) =>
      options.some((opt) => opt.checked),
    ).length;

    // Count answered textareas
    let answeredTextareas = Array.from(textareas).filter((textarea: HTMLTextAreaElement) => {
      return textarea.name !== 'additional-comments' && textarea.value.trim() !== ''; // Exclude optional
    }).length;

    // Total answered mandatory questions
    answeredQuestions = answeredRadios + answeredTextareas;

    // Calculate progress excluding the optional question
    progress = (answeredQuestions / (totalQuestions - 1)) * 100; // Subtract 1 for the optional question
    canSubmit = answeredQuestions === totalQuestions - 1; // All mandatory questions answered
  }

  function capturePQResponses() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('Cannot save data: User ID is missing.');
      return;
    }

    const responses: { [key: string]: string } = {};
    const radios = document.querySelectorAll('form input[type="radio"]:checked');
    radios.forEach((radio: HTMLInputElement) => {
      responses[radio.name] = radio.value;
    });

    const textareas = document.querySelectorAll('form textarea');
    textareas.forEach((textarea: HTMLTextAreaElement) => {
      responses[textarea.name] = textarea.value.trim(); // Ensure no trailing spaces
    });

    localStorage.setItem(`PQ-${userId}`, JSON.stringify(responses));
    localStorage.setItem(`PQSubmitted-${userId}`, 'true');
    console.log('Saved PQ responses:', responses);
    notification({
      title: 'Answers Submitted',
      message: 'Your answers have been successfully submitted.',
      duration: 3000,
    });
  }

  function resetTimer() {
    clearInterval(timerInterval);
    PQTimeLeft = 30;
    disableInputs = false;
    localStorage.removeItem('PQTimeLeft');
    localStorage.removeItem('disableInputs');

    const formControls = document.querySelectorAll('.form-control');
    formControls.forEach((control) => {
      control.style.border = '';
    });

    timerInterval = setInterval(() => {
      if (PQTimeLeft > 0) {
        PQTimeLeft -= 1;
        localStorage.setItem('PQTimeLeft', PQTimeLeft.toString());
      } else {
        clearInterval(timerInterval);

        const unansweredQuestions = highlightUnansweredQuestions();

        if (unansweredQuestions.length > 0) {
          notification({
            title: 'Error',
            message: 'Please answer all questions before time runs out.',
            duration: 5000,
            type: 'danger',
          });
        } else {
          disableInputs = true;
          localStorage.setItem('disableInputs', 'true');
          capturePQResponses();
        }
      }
    }, 1000);
  }
</script>

<div class="bg-base-100 min-h-screen p-4 flex items-center justify-center">
  <div class="container mx-auto max-w-2xl">
    <div class="p-8">
      <div class="sticky-container">
        <div class="w-full bg-gray-200 h-4 mb-4 rounded-full overflow-hidden">
          <div class="bg-blue-500 h-4 rounded-full transition-all" style="width: {progress}%"></div>
        </div>
      </div>
      <h1 class="text-xl font-medium text-center mb-8">Post-Questionnaire</h1>
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
                <input
                  type="radio"
                  name="accuracy"
                  value="1"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('accuracy', event.target.value)}
                /> Very poorly
              </label>
              <label>
                <input
                  type="radio"
                  name="accuracy"
                  value="2"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('accuracy', event.target.value)}
                /> Poorly
              </label>
              <label>
                <input
                  type="radio"
                  name="accuracy"
                  value="3"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('accuracy', event.target.value)}
                /> Neutral
              </label>
              <label>
                <input
                  type="radio"
                  name="accuracy"
                  value="4"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('accuracy', event.target.value)}
                /> Accurately
              </label>
              <label>
                <input
                  type="radio"
                  name="accuracy"
                  value="5"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('accuracy', event.target.value)}
                /> Very accurately
              </label>
            </div>
          </div>

          <div class="form-control">
            <label class="label font-medium text-sm">
              2. How well do you think you understand the behavior of the image captioning model
              after this audit?
            </label>
            <div class="likert-scale flex justify-between">
              <label>
                <input
                  type="radio"
                  name="understanding"
                  value="1"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('understanding', event.target.value)}
                /> Not at all
              </label>
              <label>
                <input
                  type="radio"
                  name="understanding"
                  value="2"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('understanding', event.target.value)}
                /> Slightly
              </label>
              <label>
                <input
                  type="radio"
                  name="understanding"
                  value="3"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('understanding', event.target.value)}
                /> Moderately
              </label>
              <label>
                <input
                  type="radio"
                  name="understanding"
                  value="4"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('understanding', event.target.value)}
                /> Well
              </label>
              <label>
                <input
                  type="radio"
                  name="understanding"
                  value="5"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('understanding', event.target.value)}
                /> Very well
              </label>
            </div>
          </div>

          <div class="form-control">
            <label class="label font-medium text-sm">
              3. In your opinion, which populations might have been most affected negatively or
              harmed by the biases you observed in the captions?
            </label>
            <p style="font-size: 0.7rem; margin-bottom:2px; margin-left: 10px;">
              age-based groups, gender-based groups, racial or ethnic groups, socioeconomic groups,
              other marginalized groups (e.g., LGBTQ+, people with disabilities, immigrants)
            </p>
            <textarea
              name="population-targeted"
              placeholder="Add your comments here..."
              class="textarea textarea-bordered textarea-xs"
              disabled={disableInputs}
              on:input={(event) => saveResponse('populations-affected', event.target.value)}
            ></textarea>
          </div>
        </form>
      </section>
      <section
        class="bg-white shadow-lg rounded-lg p-8 mb-12 max-w-2xl mx-auto"
        style="margin-top: 20px;"
      >
        <h2 class="text-lg font-semibold mb-6">Views on the Auditing Interface</h2>
        <form class="space-y-6" on:change={checkProgress}>
          <div class="form-control">
            <label class="label font-medium text-sm">
              1. I found the interface intuitive and easy to use.
            </label>
            <div class="likert-scale flex justify-between">
              <label
                ><input
                  type="radio"
                  name="intuitive"
                  value="1"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('intuitive', event.target.value)}
                /> Strongly Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="intuitive"
                  value="2"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('intuitive', event.target.value)}
                /> Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="intuitive"
                  value="3"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('intuitive', event.target.value)}
                /> Neutral</label
              >
              <label
                ><input
                  type="radio"
                  name="intuitive"
                  value="4"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('intuitive', event.target.value)}
                /> Agree</label
              >
              <label
                ><input
                  type="radio"
                  name="intuitive"
                  value="5"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('intuitive', event.target.value)}
                /> Strongly Agree</label
              >
            </div>
          </div>

          <div class="form-control">
            <label class="label font-medium text-sm">
              2. The interface required too much effort to learn or use effectively.
            </label>
            <div class="likert-scale flex justify-between">
              <label
                ><input
                  type="radio"
                  name="effort"
                  value="1"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('effort', event.target.value)}
                /> Strongly Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="effort"
                  value="2"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('effort', event.target.value)}
                /> Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="effort"
                  value="3"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('effort', event.target.value)}
                /> Neutral</label
              >
              <label
                ><input
                  type="radio"
                  name="effort"
                  value="4"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('effort', event.target.value)}
                /> Agree</label
              >
              <label
                ><input
                  type="radio"
                  name="effort"
                  value="5"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('effort', event.target.value)}
                /> Strongly Agree</label
              >
            </div>
          </div>

          <div class="form-control">
            <label class="label font-medium text-sm">
              3. I discovered potential issues with the system I hadn’t anticipated.
            </label>
            <div class="likert-scale flex justify-between">
              <label
                ><input
                  type="radio"
                  name="uncover-bias"
                  value="1"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('uncover-bias', event.target.value)}
                /> Strongly Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="uncover-bias"
                  value="2"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('uncover-bias', event.target.value)}
                /> Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="uncover-bias"
                  value="3"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('uncover-bias', event.target.value)}
                /> Neutral</label
              >
              <label
                ><input
                  type="radio"
                  name="uncover-bias"
                  value="4"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('uncover-bias', event.target.value)}
                /> Agree</label
              >
              <label
                ><input
                  type="radio"
                  name="uncover-bias"
                  value="5"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('uncover-bias', event.target.value)}
                /> Strongly Agree</label
              >
            </div>
          </div>

          <div class="form-control">
            <label class="label font-medium text-sm">
              4. I would have discovered these same issues without a tool like the one I used.
            </label>
            <div class="likert-scale flex justify-between">
              <label
                ><input
                  type="radio"
                  name="same-issues"
                  value="1"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('same-issues', event.target.value)}
                /> Strongly Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="same-issues"
                  value="2"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('same-issues', event.target.value)}
                /> Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="same-issues"
                  value="3"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('same-issues', event.target.value)}
                /> Neutral</label
              >
              <label
                ><input
                  type="radio"
                  name="same-issues"
                  value="4"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('same-issues', event.target.value)}
                /> Agree</label
              >
              <label
                ><input
                  type="radio"
                  name="same-issues"
                  value="5"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('same-issues', event.target.value)}
                /> Strongly Agree</label
              >
            </div>
          </div>

          <div class="form-control">
            <label class="label font-medium text-sm">
              5. The tool was useful in aiding understanding of the overall behavior of the image
              captioning model.
            </label>
            <div class="likert-scale flex justify-between">
              <label
                ><input
                  type="radio"
                  name="understanding-system"
                  value="1"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('understanding-system', event.target.value)}
                /> Strongly Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="understanding-system"
                  value="2"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('understanding-system', event.target.value)}
                /> Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="understanding-system"
                  value="3"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('understanding-system', event.target.value)}
                /> Neutral</label
              >
              <label
                ><input
                  type="radio"
                  name="understanding-system"
                  value="4"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('understanding-system', event.target.value)}
                /> Agree</label
              >
              <label
                ><input
                  type="radio"
                  name="understanding-system"
                  value="5"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('understanding-system', event.target.value)}
                /> Strongly Agree</label
              >
            </div>
          </div>

          <div class="form-control">
            <label class="label font-medium text-sm">
              6. The interface improved my ability to validate or disprove my hypotheses. (or The
              interface provided sufficient tools to explore and test my hypotheses.?)
            </label>
            <div class="likert-scale flex justify-between">
              <label
                ><input
                  type="radio"
                  name="validate-hypotheses"
                  value="1"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('validate-hypotheses', event.target.value)}
                /> Strongly Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="validate-hypotheses"
                  value="2"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('validate-hypotheses', event.target.value)}
                /> Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="validate-hypotheses"
                  value="3"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('validate-hypotheses', event.target.value)}
                /> Neutral</label
              >
              <label
                ><input
                  type="radio"
                  name="validate-hypotheses"
                  value="4"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('validate-hypotheses', event.target.value)}
                /> Agree</label
              >
              <label
                ><input
                  type="radio"
                  name="validate-hypotheses"
                  value="5"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('validate-hypotheses', event.target.value)}
                /> Strongly Agree</label
              >
            </div>
          </div>

          <div class="form-control">
            <label class="label font-medium text-sm">
              7. The interface helped me efficiently collect evidence for my hypotheses.
            </label>
            <div class="likert-scale flex justify-between">
              <label
                ><input
                  type="radio"
                  name="collect-evidence"
                  value="1"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('collect-evidence', event.target.value)}
                /> Strongly Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="collect-evidence"
                  value="2"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('collect-evidence', event.target.value)}
                /> Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="collect-evidence"
                  value="3"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('collect-evidence', event.target.value)}
                /> Neutral</label
              >
              <label
                ><input
                  type="radio"
                  name="collect-evidence"
                  value="4"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('collect-evidence', event.target.value)}
                /> Agree</label
              >
              <label
                ><input
                  type="radio"
                  name="collect-evidence"
                  value="5"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('collect-evidence', event.target.value)}
                /> Strongly Agree</label
              >
            </div>
          </div>

          <div class="form-control">
            <label class="label font-medium text-sm">
              8. Overall, I found this interface helpful in conducting the auditing task.
            </label>
            <div class="likert-scale flex justify-between">
              <label
                ><input
                  type="radio"
                  name="helpful-interface"
                  value="1"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('helpful-interface', event.target.value)}
                /> Strongly Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="helpful-interface"
                  value="2"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('helpful-interface', event.target.value)}
                /> Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="helpful-interface"
                  value="3"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('helpful-interface', event.target.value)}
                /> Neutral</label
              >
              <label
                ><input
                  type="radio"
                  name="helpful-interface"
                  value="4"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('helpful-interface', event.target.value)}
                /> Agree</label
              >
              <label
                ><input
                  type="radio"
                  name="helpful-interface"
                  value="5"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('helpful-interface', event.target.value)}
                /> Strongly Agree</label
              >
            </div>
          </div>

          <div class="form-control">
            <label class="label font-medium text-sm">
              9. In using this auditing tool, I had little control to guide the audit.
            </label>
            <div class="likert-scale flex justify-between">
              <label
                ><input
                  type="radio"
                  name="control"
                  value="1"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('control', event.target.value)}
                /> Strongly Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="control"
                  value="2"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('control', event.target.value)}
                /> Disagree</label
              >
              <label
                ><input
                  type="radio"
                  name="control"
                  value="3"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('control', event.target.value)}
                /> Neutral</label
              >
              <label
                ><input
                  type="radio"
                  name="control"
                  value="4"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('control', event.target.value)}
                /> Agree</label
              >
              <label
                ><input
                  type="radio"
                  name="control"
                  value="5"
                  disabled={disableInputs}
                  on:change={(event) => saveResponse('control', event.target.value)}
                /> Strongly Agree</label
              >
            </div>
          </div>

          <div class="form-control">
            <label class="label font-medium text-sm">
              10. Is there anything else you would like to share about your experience?
            </label>
            <textarea
              name="additional-comments"
              placeholder="Add your comments here..."
              class="textarea textarea-bordered textarea-xs"
              disabled={disableInputs}
              on:input={(event) => saveResponse('additional-comments', event.target.value)}
            ></textarea>
          </div>
        </form>
      </section>
    </div>
    <div class="text-center mt-8">
      <button on:click={capturePQResponses} class="btn btn-primary" disabled={!canSubmit}
        >Submit</button
      >
    </div>
  </div>
</div>

<style>
  :global(body) {
    background-color: #ffffff;
  }

  .container {
    text-align: center;
  }

  .bg-white {
    max-width: 700px;
    margin: 0 auto;
  }

  .likert-scale label {
    display: inline-block;
    text-align: center;
    width: 14%;
    font-size: 0.85rem;
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
    font-weight: bold;
  }
  .sticky-container {
    position: sticky;
    top: 0;
    background-color: white;
    z-index: 10;
    padding: 10px 10px 1px 10px;
  }
</style>
