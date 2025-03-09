<script lang="ts">
  export let type: HTMLInputElement["type"] = "text";
  export let onChange: (newValue: string | number) => void;
  export let value: string | number;
  export let label: string;
  export let id: string;
</script>

<div class="input-container">
  <label class="input-label" for={id}>
    {label}
    <span class="input-label__type"
      >{type === "number" ? "Number" : "String"}</span
    >
  </label>
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
</div>

<style lang="scss">
  .input-container {
    padding: 0.5rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.03);
    transition: background 0.2s ease;

    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }
  }

  .input-label {
    font-size: 0.875rem;

    &__type {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.4);
      margin-left: 0.5rem;
    }
  }

  input {
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
    color: white;
    font-family: inherit;
    font-size: 0.875rem;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: rgb(249, 168, 212);
      box-shadow: 0 0 0 1px rgba(249, 168, 212, 0.4);
    }

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }
  }
</style>
