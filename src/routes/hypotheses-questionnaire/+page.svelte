<script lang="ts">
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { setProgress } from '$lib/marcelle/logging';
    import { checkAndRedirect } from '$lib/redirections';
    import type { User } from '$lib/marcelle';
    import SchemasFinished from '$lib/schemas/SchemasFinished.svelte';
  
    export let data: { user: User | null };
  
    onMount(async () => {
      await checkAndRedirect(data.user, 'hypotheses-questionnaire');
      setProgress('hypotheses-questionnaire');
    });
  </script>
  
  <SchemasFinished />
  