<script lang="ts">
  import { store } from '$lib/marcelle';
  import { goto } from '$app/navigation';

  let name = '';
  let email = '';
  let password = '';
  let error: string | null = null;
  let success = false;

  let condition = '';

  async function signup(event: SubmitEvent) {
    event.preventDefault();
    error = null;
    success = false;

    console.log('Signup initiated:', { name, email, condition });

    try {
      const user = await store.service('users').create({ name, email, password, condition });
      console.log('Signup successful:', user);

      const userId = user.id;

      localStorage.clear();

      localStorage.setItem('userId', userId);
      localStorage.setItem('lastUserId', userId);
      localStorage.setItem('userCondition', condition);
      localStorage.setItem('disableInputs', 'false');
      localStorage.setItem('PQTimeLeft', '30');

      success = true;

      goto('/pre-questionnaire');
    } catch (err) {
      error = err.message;
      console.error('Signup failed:', err);
    }
  }
</script>

<section>
  <h1>Sign Up</h1>
  {#if error}
    <div class="error">{error}</div>
  {/if}
  {#if success}
    <div class="success">Account created successfully!</div>
  {/if}
  <form on:submit|preventDefault={signup}>
    <input type="text" bind:value={name} placeholder="Name" required />
    <input type="email" bind:value={email} placeholder="Email" required />
    <input type="password" bind:value={password} placeholder="Password" required minlength="8" />

    <select bind:value={condition} required>
      <option value="" disabled selected>Select your condition</option>
      <option value="conditionOne">Condition One</option>
      <option value="conditionTwo">Condition Two</option>
      <option value="conditionThree">Condition Three</option>
    </select>

    <button type="submit">Sign Up</button>
  </form>
</section>

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

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
