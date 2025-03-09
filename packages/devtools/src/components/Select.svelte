<script lang="ts">
  export let options: Array<{ label: string; value: string }> = [];
  export let value: string;
  export let label: string;
  export let onChange: (newValue: string) => void;
</script>

<div class="select-container">
  <label class="select-label">
    {label}
    <div class="select-wrapper">
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
      <div class="select-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </div>
  </label>
</div>

<style lang="scss">
  .select-container {
    padding: 0.5rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.03);
    transition: background 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }
  }

  .select-label {
    display: flex;
    flex-direction: column;
    font-size: 0.875rem;
    width: 100%;
  }

  .select-wrapper {
    position: relative;
    margin-top: 0.5rem;
    width: 100%;
  }

  .select-icon {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    color: rgb(249, 168, 212);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  select {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    padding: 0.5rem 2.25rem 0.5rem 0.75rem;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);
    color: white;
    font-family: inherit;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: rgb(249, 168, 212);
      box-shadow: 0 0 0 1px rgb(249, 168, 212, 0.4);
    }

    option {
      background-color: #121929;
      color: white;
      padding: 0.5rem;
    }
  }
</style>
