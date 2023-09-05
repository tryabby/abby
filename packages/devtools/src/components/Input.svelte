<script lang="ts">
  export let type: HTMLInputElement["type"] = "text";
  export let onChange: (newValue: string | number) => void;
  export let value: string | number;
  export let label: string;
  export let id: string;
</script>

<label>
  {label}
  <input
    {id}
    {type}
    {value}
    on:change={(e) => {
      if (type === "number") {
        onChange(e.currentTarget.valueAsNumber);
        return;
      }
      onChange(e.currentTarget.value);
    }}
  />
</label>

<style lang="scss">
  label {
    display: flex;
    flex-direction: column;
    margin: 10px 0;
  }

  input {
    padding: 7px 40px 7px 12px;
    width: 100%;
    border-radius: 5px;
    border: 1px solid hsl(252 4% 45.2%);
    background: transparent;
    font-family: inherit;
    font-size: 16px;
    transition: all 150ms ease;
    margin-top: 5px;
    color: var(--pink);
    box-sizing: border-box;

    &:required:invalid {
      color: #5a667f;
    }

    &:focus {
      outline: none;
      border-color: var(--pink);
      box-shadow: 0 0 0 2px rgba(var(--pink), 0.2);
    }
  }
</style>
