<script lang="ts">
    import { exportedHypotheses } from '$lib/store';
    import { get } from 'svelte/store';
  
    let data = get(exportedHypotheses);
  
    if (!Array.isArray(data)) {
      data = [];
    }
  
    console.log('Received data:', data);
  </script>
  
  <div class="bg-base-100 min-h-screen p-4">
    <div class="container mx-auto">
      <h1 class="text-xl font-medium text-center mb-8">Post-Questionnaire</h1>
      {#if data.length > 0}
        <!-- DaisyUI Carousel -->
        <div class="carousel carousel-center space-x-4">
          {#each data as { id, text }}
            <div class="carousel-item">
              <div class="bg-white shadow-lg rounded-lg p-6 w-96">
                <h3 class="text-base font-semibold mb-4">Hypothesis {id}</h3>
                <p class="mb-6">{text}</p>
                <form class="questionnaire space-y-4">
                  <div class="form-control">
                    <label class="label font-medium text-sm"
                      >How confident are you about this hypothesis?
                      </label
                    >
                    <div class="likert-scale flex justify-between">
                      <label><input type="radio" name="confidence-{id}" value="1"/> Very Uncertain</label>
                      <label><input type="radio" name="confidence-{id}" value="2"/> Uncertain</label>
                      <label><input type="radio" name="confidence-{id}" value="3"/> Neutral</label>
                      <label><input type="radio" name="confidence-{id}" value="4"/> Confident</label>
                      <label><input type="radio" name="confidence-{id}" value="5"/> Very Confident</label>
                    </div>
                  </div>
  
                  <div class="form-control">
                    <label class="label font-medium text-sm">
                      Did you find any examples that go against your hypothesis? (e.g. cases where your hypothesis doesn't hold true.)
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
  
                  <div class="form-control">
                    <label class="label font-medium text-sm">
                      How often does the bias described in your hypothesis occur?
                    </label>
                    <div class="likert-scale flex justify-between">
                      <label><input type="radio" name="frequency-{id}" value="1"/> Never</label>
                      <label><input type="radio" name="frequency-{id}" value="2"/> Rarely</label>
                      <label><input type="radio" name="frequency-{id}" value="3"/> Sometimes</label>
                      <label><input type="radio" name="frequency-{id}" value="4"/> Often</label>
                      <label><input type="radio" name="frequency-{id}" value="5"/> Always</label>
                    </div>
                  </div>

                  <div class="form-control">
                    <label class="label font-medium text-sm">
                      How problematic is the bias described in your hypothesis?
                    </label>
                    <div class="likert-scale flex justify-between">
                      <label><input type="radio" name="problematic-{id}" value="1"/> Not problematic</label>
                      <label><input type="radio" name="problematic-{id}" value="2"/> Slightly problematic</label>
                      <label><input type="radio" name="problematic-{id}" value="3"/> Somewhat problematic</label>
                      <label><input type="radio" name="problematic-{id}" value="4"/> problematic</label>
                      <label><input type="radio" name="problematic-{id}" value="5"/> Very problematic</label>
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

      <!-- Views on the Image Captioning Model Section -->
    <section class="bg-white shadow-lg rounded-lg p-8 mb-12">
        <h2 class="text-lg font-semibold mb-6">Views on the Image Captioning Model</h2>
        <form class="space-y-6">
          <div class="form-control">
            <label class="label font-medium text-sm">
              How well do you think this image captioning model fulfills its purpose, that is, accurately describing images?
            </label>
            <select name="accuracy" class="select select-bordered select-xs">
              <option value="1">1: Very poorly</option>
              <option value="2">2: Poorly</option>
              <option value="3">3: Neutral</option>
              <option value="4">4: Accurately</option>
              <option value="5">5: Very accurately</option>
            </select>
          </div>
  
          <div class="form-control">
            <label class="label font-medium text-sm">
              How well do you think you understand the behavior of the image captioning model after this audit?
            </label>
            <select name="understanding" class="select select-bordered select-xs">
              <option value="1">1: Not at all</option>
              <option value="2">2: Slightly</option>
              <option value="3">3: Moderately</option>
              <option value="4">4: Well</option>
              <option value="5">5: Very well</option>
            </select>
          </div>
  
          <div class="form-control">
            <label class="label font-medium text-sm">
              To what extent do you think algorithmic biases could cause harm in real-world applications?
            </label>
            <select name="bias-impact" class="select select-bordered select-xs">
              <option value="1">1: Not at all</option>
              <option value="2">2: Slightly</option>
              <option value="3">3: Moderately</option>
              <option value="4">4: Significantly</option>
              <option value="5">5: Very significantly</option>
            </select>
          </div>
        </form>
      </section>
  
      <!-- Views on the Auditing Interface Section -->
      <section class="bg-white shadow-lg rounded-lg p-8 mb-12">
        <h2 class="text-lg font-semibold mb-6">Views on the Auditing Interface</h2>
        <form class="space-y-4">
          <div class="form-control">
            <label class="label font-medium text-sm">
              I found the interface intuitive and easy to use.
            </label>
            <select name="intuitive" class="select select-bordered select-xs">
              <option value="1">1: Strongly Disagree</option>
              <option value="2">2: Disagree</option>
              <option value="3">3: Neutral</option>
              <option value="4">4: Agree</option>
              <option value="5">5: Strongly Agree</option>
            </select>
          </div>
  
          <div class="form-control">
            <label class="label font-medium text-sm">
              The interface required too much effort to learn or use effectively.
            </label>
            <select name="effort" class="select select-bordered select-xs">
              <option value="1">1: Strongly Disagree</option>
              <option value="2">2: Disagree</option>
              <option value="3">3: Neutral</option>
              <option value="4">4: Agree</option>
              <option value="5">5: Strongly Agree</option>
            </select>
          </div>

            
          <div class="form-control">
            <label class="label font-medium text-sm">
                The interface provided sufficient tools to explore and test my hypotheses.
            </label>
            <select name="uncover-bias" class="select select-bordered select-xs">
              <option value="1">1: Strongly Disagree</option>
              <option value="2">2: Disagree</option>
              <option value="3">3: Neutral</option>
              <option value="4">4: Agree</option>
              <option value="5">5: Strongly Agree</option>
            </select>
          </div>
  
          <div class="form-control">
            <label class="label font-medium text-sm">
              The interface helped me uncover biases I would not have identified otherwise.
            </label>
            <select name="uncover-bias" class="select select-bordered select-xs">
              <option value="1">1: Strongly Disagree</option>
              <option value="2">2: Disagree</option>
              <option value="3">3: Neutral</option>
              <option value="4">4: Agree</option>
              <option value="5">5: Strongly Agree</option>
            </select>
          </div>
  
  
          <div class="form-control">
            <label class="label font-medium text-sm">
              Is there anything else you would like to share about your experience?
            </label>
            <textarea name="additional-comments" placeholder="Add your comments here..." class="textarea textarea-bordered textarea-xs"></textarea>
          </div>
        </form>
      </section>

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
  </style>
  