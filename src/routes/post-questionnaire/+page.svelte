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
                    <label class="label font-medium text-sm">
                      How confident are you about this hypothesis?
                    </label>
                    <select name="confidence-{id}" class="select select-xs select-bordered">
                      <option value="1">1: Very uncertain</option>
                      <option value="2">2: Uncertain</option>
                      <option value="3">3: Neutral</option>
                      <option value="4">4: Confident</option>
                      <option value="5">5: Very confident</option>
                    </select>
                  </div>
  
                  <div class="form-control">
                    <label class="label font-medium text-sm">
                      Did you find counterexamples to your hypothesis?
                    </label>
                    <select name="counterexamples-{id}" class="select select-xs select-bordered">
                      <option value="1">1: No counterexamples</option>
                      <option value="2">2: 1–2 counterexamples</option>
                      <option value="3">3: 3–5 counterexamples</option>
                      <option value="4">4: 6–9 counterexamples</option>
                      <option value="5">5: 10 or more counterexamples</option>
                    </select>
                  </div>
  
                  <div class="form-control">
                    <label class="label font-medium text-sm">
                      How often does the bias described in your hypothesis occur?
                    </label>
                    <select name="frequency-{id}" class="select select-xs select-bordered">
                      <option value="1">1: Never</option>
                      <option value="2">2: Rarely</option>
                      <option value="3">3: Sometimes</option>
                      <option value="4">4: Often</option>
                      <option value="5">5: All the time</option>
                    </select>
                  </div>
  
                  <div class="form-control">
                    <label class="label font-medium text-sm">
                      How problematic is the bias described in your hypothesis?
                    </label>
                    <select name="problematic-{id}" class="select select-xs select-bordered">
                      <option value="1">1: Not problematic</option>
                      <option value="2">2: Slightly problematic</option>
                      <option value="3">3: Somewhat problematic</option>
                      <option value="4">4: Problematic</option>
                      <option value="5">5: Very problematic</option>
                    </select>
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
  </style>
  