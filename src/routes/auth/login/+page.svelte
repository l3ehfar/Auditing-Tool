<script context="module" lang="ts">
    import { store } from '$lib/marcelle';
  
    export async function load() {
      try {
        await store.connect();
        console.log('User already logged in, redirecting to /pre-questionnaire');
        return { status: 302, redirect: '/pre-questionnaire' }; // Redirect if already logged in
      } catch (error) {
        console.log('No user session found, displaying login page');
        return {}; // Show login page if not logged in
      }
    }
  </script>
  
  <script lang="ts">
    import { goto } from '$app/navigation';
    let error: string | null = null;
  
    async function login(event: SubmitEvent) {
      event.preventDefault();
      error = null;
  
      const formData = new FormData(event.currentTarget as HTMLFormElement);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
  
      console.log('Login initiated:', { email });
  
      try {
        await store.login(email, password);
        console.log('Login successful, connecting to backend...');
        await store.connect(); // Backend connection
        console.log('Backend connection established, redirecting to /app/');
        goto('/app/');
      } catch (err) {
        error = err.message;
        console.error('Login failed:', err);
      }
    }
  </script>
  
  <section>
    <h1>Login</h1>
    {#if error}
      <div class="error">{error}</div>
    {/if}
    <form on:submit|preventDefault={login}>
      <input type="email" name="email" placeholder="Email" required />
      <input type="password" name="password" placeholder="Password" required />
      <button type="submit">Log In</button>
    </form>
  </section>
  
  <style>
    section {
      margin: 2rem auto;
      max-width: 400px;
    }
  
    .error {
      color: red;
      margin-bottom: 1rem;
    }
  
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  </style>
  