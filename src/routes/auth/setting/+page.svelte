<script lang="ts">
    import { store } from "$lib/marcelle";
    let user = store.user;
    let newPassword = '';
    let confirmPassword = '';
    let error: string | null = null;
    let success = false;
  
    async function updatePassword(event: SubmitEvent) {
      event.preventDefault();
      error = null;
      success = false;
  
      if (newPassword !== confirmPassword) {
        error = "Passwords don't match!";
        return;
      }
  
      try {
        await store.service('users').patch(user._id, { password: newPassword });
        success = true;
      } catch (err) {
        error = err.message;
      }
    }
  </script>
  
  <section>
    <h1>Settings</h1>
    {#if error}
      <div class="error">{error}</div>
    {/if}
    {#if success}
      <div class="success">Password updated successfully!</div>
    {/if}
    <p>Name: {user.name}</p>
    <p>Email: {user.email}</p>
    <form on:submit|preventDefault={updatePassword}>
      <input type="password" bind:value={newPassword} placeholder="New Password" minlength="8" required />
      <input type="password" bind:value={confirmPassword} placeholder="Confirm Password" minlength="8" required />
      <button type="submit">Update Password</button>
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
  