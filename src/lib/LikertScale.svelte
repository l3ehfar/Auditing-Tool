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

  const scaleLabels = [
    'Disagree Strongly', // 0
    'Disagree Somewhat', // 1
    'Disagree Slightly', // 2
    'Agree Slightly', // 3
    'Agree Somewhat', // 4
    'Agree Strongly', // 5
  ];

</script>

<div class="form-control">
  <label class="label font-medium text-left" for={name}>{question}</label>
  <div class="likert-scale flex justify-between">
    {#each [0, 1, 2, 3, 4, 5] as v}
      <div class="likert-option">
        <span class="scale-label">{scaleLabels[v]}</span>
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
      </div>
    {/each}
  </div>
</div>

<style scoped>
  .likert-scale label {
    display: inline-block;
    text-align: center;
    width: 14%;
    font-size: 0.85rem;
    font-weight: bold;
  }

  .likert-scale input {
    margin: 0 auto;
    display: block;
  }

  .likert-scale span {
    width: 20%;
    font-size: smaller;
    text-align: center;
  }
</style>
