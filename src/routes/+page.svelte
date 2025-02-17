<script lang="ts">
  import { kebabCase } from 'scule';
  import { store, type User } from '$lib/marcelle/store';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { fetchDatasetFromGitHub } from '$lib/marcelle';

  export let data: { user: User | null };

  let prolificID = data.user ? data.user.prolificID : '';
  $: email = `${kebabCase(prolificID)}@marcelle.org`;
  let password = '';
  let error: string | null = null;
  let success = false;

  let condition = '';

  async function signup(event: SubmitEvent) {
    event.preventDefault();
    error = null;
    success = false;

    console.log('Signup initiated:', { email, condition });

    try {
      const res = await store.service('users').create({ prolificID, email, password, condition });
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
            <span class="label-text">Prolific ID</span>
          </div>
          <input
            type="text"
            placeholder="Let's use our name for now"
            bind:value={prolificID}
            class="input input-bordered w-full"
            disabled={data.user !== null}
          />
        </label>

        <input
          type="email"
          value={email}
          placeholder="Email"
          disabled
          class="input input-bordered"
        />
        <label class="form-control w-full">
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
        </label>

        <select bind:value={condition} required class="select select-bordered w-full">
          <option value="" disabled selected>Select your condition</option>
          <option value="conditionOne">Condition One</option>
          <option value="conditionTwo">Condition Two</option>
          <option value="conditionThree">Condition Three</option>
        </select>

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
            placeholder="Let's use our name for now"
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
