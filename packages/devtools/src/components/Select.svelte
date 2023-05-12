<script lang="ts">
  export let options: Array<{ label: string; value: string }> = [];
  export let value: string;
  export let label: string;
  export let onChange: (newValue: string) => void;
</script>

<label>
  {label}
  <select
    bind:value
    on:change={(e) => {
      onChange(e.currentTarget.value);
    }}
  >
    {#each options as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
</label>

<style lang="scss">
  label {
    display: flex;
    flex-direction: column;
    margin: 10px 0;
  }

  select {
    -webkit-appearance: none;
    padding: 7px 40px 7px 12px;
    width: 100%;
    border-radius: 5px;
    border: 1px solid hsl(252 4% 45.2%);
    background: transparent;
    cursor: pointer;
    font-family: inherit;
    font-size: 16px;
    transition: all 150ms ease;
    margin-top: 5px;
    color: var(--pink);

    &:required:invalid {
      color: #5a667f;
    }

    option {
      color: #223254;
      &[value=""][disabled] {
        display: none;
      }
    }

    &:focus {
      outline: none;
      border-color: var(--pink);
      box-shadow: 0 0 0 2px rgba(var(--pink), 0.2);
    }
  }
</style>
