<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { notification } from '@marcellejs/core';

  let asiTimeLeft = 30;
  let totalQuestions = 4;
  let answeredQuestions = 0;
  let progress = 0;
  let canSubmit = false;
  let disableInputs = false;

  let timerInterval: NodeJS.Timer;

  async function loadUserData(userId: string) {
    try {
      const savedResponses = JSON.parse(localStorage.getItem(`ASI-${userId}`) || '{}');
      console.log('Loaded ASI responses:', savedResponses);

      Object.entries(savedResponses).forEach(([name, value]) => {
        const radio = document.querySelector(
          `input[name="${name}"][value="${value}"]`,
        ) as HTMLInputElement;
        if (radio) radio.checked = true;
      });

      checkProgress();
    } catch (err) {
      console.error('Error loading ASI data:', err);
    }
  }

  function saveResponse(question: string, value: string) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('Cannot save response: User ID is missing.');
      return;
    }

    const savedResponses = JSON.parse(localStorage.getItem(`ASI-${userId}`) || '{}');
    savedResponses[question] = value;
    localStorage.setItem(`ASI-${userId}`, JSON.stringify(savedResponses));
    console.log(`Saved response for ${question}: ${value}`);
    checkProgress();
  }

  onMount(() => {
    const userId = localStorage.getItem('userId');
    const lastUserId = localStorage.getItem('lastUserId');
    const alreadySubmitted = localStorage.getItem(`ASISubmitted-${userId}`) === 'true';

    if (!userId) {
      console.warn('No user ID found. Redirecting to signup...');
      goto('/auth/signup');
      return;
    }

    console.log('Logged-in user ID:', userId);

    if (alreadySubmitted) {
      console.log('ASI questionnaire already submitted. Redirecting...');
      goto('/conditionTwo');
      return;
    }

    if (userId !== lastUserId) {
      console.log('New user detected. Resetting timer and states.');
      asiTimeLeft = 30;
      disableInputs = false;

      localStorage.removeItem('asiTimeLeft');
      localStorage.removeItem('disableInputs');

      localStorage.setItem('lastUserId', userId);
    } else {
      console.log('Returning user detected. Loading saved data.');
      const savedTime = parseInt(localStorage.getItem('asiTimeLeft') || '30');
      const savedDisableState = localStorage.getItem('disableInputs') === 'true';

      asiTimeLeft = savedTime;
      disableInputs = savedDisableState;
    }

    loadUserData(userId);

    // if (disableInputs) {
    //   console.log('Disabling inputs as the questionnaire is already completed.');
    // }

    if (!disableInputs) {
      timerInterval = setInterval(() => {
        if (asiTimeLeft > 0) {
          asiTimeLeft -= 1;
          localStorage.setItem('asiTimeLeft', asiTimeLeft.toString());
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
      const isAnswered = Array.from(radios).some((radio: HTMLInputElement) => radio.checked);

      if (!isAnswered) {
        unanswered.push(control);
        control.style.border = '2px solid red';
        control.style.borderRadius = '5px';

        radios.forEach((radio: HTMLInputElement) => {
          radio.addEventListener('change', () => {
            control.style.border = '';
            control.style.borderRadius = '';
          });
        });
      } else {
        control.style.border = '';
        control.style.borderRadius = '';
      }
    });

    return unanswered;
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

  function captureASIResponses() {
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

    localStorage.setItem(`ASI-${userId}`, JSON.stringify(responses));
    localStorage.setItem(`ASISubmitted-${userId}`, 'true'); 
    console.log('Saved ASI responses:', responses);

    goto('/conditionTwo');
  }

  function resetTimer() {
    clearInterval(timerInterval);
    asiTimeLeft = 30;
    disableInputs = false;
    localStorage.removeItem('asiTimeLeft');
    localStorage.removeItem('disableInputs');

    const formControls = document.querySelectorAll('.form-control');
    formControls.forEach((control) => {
      control.style.border = '';
    });

    timerInterval = setInterval(() => {
      if (asiTimeLeft > 0) {
        asiTimeLeft -= 1;
        localStorage.setItem('asiTimeLeft', asiTimeLeft.toString());
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
          captureASIResponses();
        }
      }
    }, 1000);
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
      <form class="space-y-6" on:change={checkProgress}>
        <div class="space-y-4">
          <div class="form-control">
            <label class="label font-medium text-sm"
              >1. No matter how accomplished he is, a man is not truly complete as a person unless
              he has the love of a woman.</label
            >
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              {#each [0, 1, 2, 3, 4, 5] as value}
                <label>
                  <input type="radio" name="q1" {value} disabled={disableInputs} on:change={() => saveResponse('q1', value.toString())} />
                  {value}
                </label>
              {/each}
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >2. Many women are actually seeking special favors, such as hiring policies that favor
              them over men, under the guise of asking for "equality."</label
            >
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              {#each [0, 1, 2, 3, 4, 5] as value}
                <label>
                  <input type="radio" name="q2" {value} disabled={disableInputs} on:change={() => saveResponse('q2', value.toString())} />
                  {value}
                </label>
              {/each}
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >3. In a disaster, women ought not necessarily to be rescued before men.</label
            >
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              {#each [0, 1, 2, 3, 4, 5] as value}
                <label>
                  <input type="radio" name="q3" {value} disabled={disableInputs} on:change={() => saveResponse('q3', value.toString())} />
                  {value}
                </label>
              {/each}
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >4. Most women interpret innocent remarks or acts as being sexist.</label
            >
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              {#each [0, 1, 2, 3, 4, 5] as value}
                <label>
                  <input type="radio" name="q4" {value} disabled={disableInputs} on:change={() => saveResponse('q4', value.toString())} />
                  {value}
                </label>
              {/each}
              <span>Agree strongly</span>
            </div>
          </div>
          <!-- <div class="form-control">
            <label class="label font-medium text-sm">5. Women are too easily offended. </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q5" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q5" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q5" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q5" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q5" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q5" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >6. People are often truly happy in life without being romantically involved with a
              member of the other sex.
            </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q6" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q6" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q6" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q6" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q6" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q6" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >7. Feminists are not seeking for women to have more power than men.
            </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q7" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q7" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q7" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q7" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q7" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q7" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >8. Many women have a quality of purity that few men possess.
            </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q8" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q8" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q8" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q8" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q8" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q8" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >9. Women should be cherished and protected by men.
            </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q9" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q9" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q9" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q9" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q9" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q9" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >10. Most women fail to appreciate fully all that men do for them.
            </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q10" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q10" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q10" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q10" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q10" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q10" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >11. Women seek to gain power by getting control over men.
            </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q11" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q11" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q11" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q11" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q11" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q11" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >12. Every man ought to have a woman whom he adores.
            </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q12" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q12" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q12" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q12" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q12" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q12" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm">13. Men are complete without women. </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q13" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q13" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q13" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q13" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q13" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q13" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >14. Women exaggerate problems they have at work.
            </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q14" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q14" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q14" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q14" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q14" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q14" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >15. Once a woman gets a man to commit to her, she usually tries to put him on a tight
              leash.
            </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q15" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q15" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q15" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q15" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q15" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q15" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >16. When women lose to men in a fair competition, they typically complain about being
              discriminated against.
            </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q16" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q16" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q16" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q16" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q16" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q16" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >17. A good woman should be set on a pedestal by her man.
            </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q17" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q17" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q17" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q17" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q17" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q17" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >18. There are actually very few women who get a kick out of teasing men by seeming
              sexually available and then refusing male advances.
            </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q18" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q18" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q18" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q18" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q18" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q18" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
          <div class="form-control">
            <label class="label font-medium text-sm"
              >19. Women, compared to men, tend to have a superior moral sensibility.
            </label>
            <div class="likert-scale flex justify-between">
              <span>Disagree strongly</span>
              <label><input type="radio" name="q19" value="0" disabled={disableinputs} /> 0</label>
              <label><input type="radio" name="q19" value="1" disabled={disableinputs} /> 1</label>
              <label><input type="radio" name="q19" value="2" disabled={disableinputs} /> 2</label>
              <label><input type="radio" name="q19" value="3" disabled={disableinputs} /> 3</label>
              <label><input type="radio" name="q19" value="4" disabled={disableinputs} /> 4</label>
              <label><input type="radio" name="q19" value="5" disabled={disableinputs} /> 5</label>
              <span>Agree strongly</span>
            </div>
          </div>
        </div>
        <div class="form-control">
          <label class="label font-medium text-sm"
            >20. Men should be willing to sacrifice their own well being in order to provide
            financially for the women in their lives.
          </label>
          <div class="likert-scale flex justify-between">
            <span>Disagree strongly</span>
            <label><input type="radio" name="q20" value="0" disabled={disableinputs} /> 0</label>
            <label><input type="radio" name="q20" value="1" disabled={disableinputs} /> 1</label>
            <label><input type="radio" name="q20" value="2" disabled={disableinputs} /> 2</label>
            <label><input type="radio" name="q20" value="3" disabled={disableinputs} /> 3</label>
            <label><input type="radio" name="q20" value="4" disabled={disableinputs} /> 4</label>
            <label><input type="radio" name="q20" value="5" disabled={disableinputs} /> 5</label>
            <span>Agree strongly</span>
          </div>
        </div>
        <div class="form-control">
          <label class="label font-medium text-sm"
            >21. Feminists are making entirely reasonable demands of men.
          </label>
          <div class="likert-scale flex justify-between">
            <span>Disagree strongly</span>
            <label><input type="radio" name="q21" value="0" disabled={disableinputs} /> 0</label>
            <label><input type="radio" name="q21" value="1" disabled={disableinputs} /> 1</label>
            <label><input type="radio" name="q21" value="2" disabled={disableinputs} /> 2</label>
            <label><input type="radio" name="q21" value="3" disabled={disableinputs} /> 3</label>
            <label><input type="radio" name="q21" value="4" disabled={disableinputs} /> 4</label>
            <label><input type="radio" name="q21" value="5" disabled={disableinputs} /> 5</label>
            <span>Agree strongly</span>
          </div>
        </div>
        <div class="form-control">
          <label class="label font-medium text-sm"
            >22. Women, as compared to men, tend to have a more refined sense of culture and good
            taste.
          </label>
          <div class="likert-scale flex justify-between">
            <span>Disagree strongly</span>
            <label><input type="radio" name="q22" value="0" disabled={disableinputs} /> 0</label>
            <label><input type="radio" name="q22" value="1" disabled={disableinputs} /> 1</label>
            <label><input type="radio" name="q22" value="2" disabled={disableinputs} /> 2</label>
            <label><input type="radio" name="q22" value="3" disabled={disableinputs} /> 3</label>
            <label><input type="radio" name="q22" value="4" disabled={disableinputs} /> 4</label>
            <label><input type="radio" name="q22" value="5" disabled={disableinputs} /> 5</label>
            <span>Agree strongly</span>
          </div>
        </div> -->
        </div>
      </form>
    </div>
    <div class="text-center mt-8">
      <button on:click={captureASIResponses} class="btn btn-primary" disabled={!canSubmit}
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
    padding: 20px 10px 1px 10px;
    margin-bottom: 200px;
    /* box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);  */
  }
</style>
