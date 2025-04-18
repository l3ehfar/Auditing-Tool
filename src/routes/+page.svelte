<script lang="ts">
  import { kebabCase } from 'scule';
  import { store, type User } from '$lib/marcelle/store';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { browser } from '$app/environment';

  if (browser) {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
    const isSmallScreen = window.innerWidth < 1024;

    const isOldBrowser = (() => {
      const ua = navigator.userAgent;

      const chrome = ua.match(/Chrome\/(\d+)/);
      if (chrome && parseInt(chrome[1]) < 90) return true;

      const firefox = ua.match(/Firefox\/(\d+)/);
      if (firefox && parseInt(firefox[1]) < 90) return true;

      const safari = ua.match(/Version\/(\d+).+Safari/);
      if (safari && parseInt(safari[1]) < 13) return true;

      const edge = ua.match(/Edg\/(\d+)/);
      if (edge && parseInt(edge[1]) < 90) return true;

      return false;
    })();

    if (isMobile || isSmallScreen || isOldBrowser) {
      goto(`${base}/desktop-only`);
    }
  }

  export let data: {
    user: User | null;
    prolificID: string;
    studyID: string;
    sessionID: string;
    condition: string;
  };

  let prolificID = data.user ? data.user.prolificID : data.prolificID;
  let prolificIDMissing = !prolificID;

  function isPlaceholder(val: string) {
    return val?.includes('%') || val?.includes('{') || val?.includes('}');
  }

  if (isPlaceholder(prolificID)) {
    prolificIDMissing = true;
    prolificID = '';
  }

  function generateRandomID(length = 8) {
    return Math.random()
      .toString(36)
      .substring(2, 2 + length);
  }

  $: email =
    prolificID && prolificID.trim()
      ? `${kebabCase(prolificID)}@marcelle.org`
      : `anonymous-${generateRandomID()}@marcelle.org`;

  let password = generateRandomID();
  let error: string | null = null;
  let success = false;

  let condition = data.condition;

  if (!condition) {
    const random = Math.floor(Math.random() * 3) + 1;
    const conditionMap: Record<string, string> = {
      '1': 'conditionOne',
      '2': 'conditionTwo',
      '3': 'conditionThree',
    };
    condition = conditionMap[random.toString()];
  }

  let studyID = data.studyID;
  if (!studyID || isPlaceholder(studyID)) {
    studyID = `67d04afd45ed6e73327a7ed1`;
  }

  let sessionID = data.sessionID;
  if (!sessionID || isPlaceholder(sessionID)) {
    sessionID = `session-${generateRandomID()}`;
  }

  async function signup(event: SubmitEvent) {
    event.preventDefault();
    error = null;
    success = false;

    console.log('Signup initiated:', { email, condition });

    try {
      const res = await store.service('users').create({
        prolificID,
        studyID,
        sessionID,
        email,
        password,
        condition,
      });
      console.log('Created user', res);

      localStorage.setItem('user_timer', '1800');

      const user = await store.login(email, password);
      console.log('Signup successful:', user);

      success = true;

      goto(`${base}/introduction`).then(() => {
        location.reload();
      });
    } catch (err: any) {
      error = err.message;
      console.error('Signup failed:', err);
    }
  }

  async function signOut() {
    try {
      await store.logout();
      location.reload();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  }
</script>

<div class="max-w-3xl w-full bg-white mx-auto py-8">
  <section>
    <h2 class="font-title text-center text-lg transition-all duration-200 md:text-2xl w-full">
      Study Sensemaking in User-Driven Algorithm Auditing
    </h2>
    <div class="my-6">
      You will participate in a study to audit an image captioning model, which generates textual
      descriptions of images. The goal is to identify whether the captions display gender biases
      when describing people in medical jobs.
    </div>
  </section>
  <section>
    <h2 class="font-title text-center text-lg transition-all duration-200 md:text-2xl w-full">
      {#if data.user}
        You are connected
      {:else}
        Sign Up
      {/if}
    </h2>
    {#if error}
      <div class="error">{error}</div>
    {/if}
    {#if success}
      <div class="success">Account created successfully!</div>
    {/if}
    {#if data.user === null}
      <form on:submit|preventDefault={signup} class="flex flex-col w-full gap-4">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Prolific PID</span>
          </div>
          <input
            type="text"
            placeholder="Enter your Prolific ID"
            bind:value={prolificID}
            class="input input-bordered w-full"
            disabled={data.user !== null || !prolificIDMissing}
          />
          {#if prolificIDMissing}
            <p class="text-warning text-sm mt-1">
              We couldn't detect your Prolific ID. Please enter it manually.
            </p>
          {/if}
          <input
            type="text"
            placeholder="your prolific id"
            bind:value={prolificID}
            class="input input-bordered w-full"
            disabled
          />
        </label>
        <!-- <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Study ID</span>
          </div>
          <input type="text" value={data.studyID} class="input input-bordered w-full" disabled />
        </label> -->
        <!-- <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Session ID</span>
          </div>
          <input type="text" value={sessionID} class="input input-bordered w-full" disabled />
        </label> -->

        <!-- <input
          type="email"
          value={email}
          placeholder="Email"
          disabled
          class="input input-bordered"
        /> -->
        <!-- <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Choose a password</span>
            {#if password.length > 0 && password.length < 8}
              <span class="label-text text-error">Minimum 8 characters</span>
            {/if}
          </div>
          <input
            type="password"
            placeholder="Type here"
            bind:value={password}
            minlength="8"
            class="input input-bordered w-full"
            class:input-error={password.length > 0 && password.length < 8}
          />
        </label> -->

        <!-- <select bind:value={condition} required class="select select-bordered w-full" disabled>
          <option value="" disabled selected>Select your condition</option>
          <option value="conditionOne">Condition One</option>
          <option value="conditionTwo">Condition Two</option>
          <option value="conditionThree">Condition Three</option>
        </select> -->

        <button class="btn btn-secondary">Continue</button>
      </form>
    {:else}
      <div class="flex flex-col w-full gap-4">
        <label class="form-control w-full">
          <div class="label">
            <span class="label-text">Prolific ID</span>
          </div>
          <input
            type="text"
            placeholder="your prolific id"
            bind:value={prolificID}
            class="input input-bordered w-full"
            disabled={data.user !== null}
          />
        </label>
        {#await import('$lib/marcelle/logging').then(({ getProgress }) => getProgress())}
          <div>Retrieving session...</div>
        {:then progress}
          <a href="{base}/{progress.page || 'introduction'}" class="btn btn-secondary"
            >Continue the study</a
          >
        {/await}
      </div>
      <div class="mt-10 text-center">
        <button on:click={signOut} class="btn btn-outline btn-error btn-sm">Disconnect</button>
      </div>
    {/if}
  </section>
</div>

<style>
  section {
    margin: 2rem auto;
    max-width: 400px;
  }

  .error {
    color: red;
  }

  .success {
    color: green;
  }
</style>
