<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let name: string;
  export let question: string;
  export let disabled: boolean = false;
  export let value: number | undefined;

  const dispatch = createEventDispatcher();
  function select(v: number) {
    dispatch('change', v as typeof value);
  }
</script>

<div class="form-control">
  <label class="label font-medium text-left" for={name}>{question}</label>
  <div class="likert-scale flex justify-between">
    <span>Disagree strongly</span>
    {#each [1, 2, 3, 4, 5] as v}
      <label class="label-text">
        <input
          type="radio"
          {name}
          value={v}
          {disabled}
          checked={value === v}
          on:change={() => select(v)}
        />
        {v}
      </label>
    {/each}
    <span>Agree strongly</span>
  </div>
</div>

<style scoped>
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

  .likert-scale span {
    width: 20%;
    text-align: center;
    font-weight: bold;
  }
</style>
