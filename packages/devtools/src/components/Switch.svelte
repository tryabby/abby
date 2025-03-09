<script lang="ts">
  export let id: string;
  export let label: string;
  export let checked = false;
  export let onChange: (newValue: boolean) => void;
</script>

<div class="switch-container">
  <div class="switch-wrapper">
    <input
      type="checkbox"
      class="abby-switch"
      bind:checked
      {id}
      on:change={(e) => {
        onChange(e.currentTarget.checked);
      }}
    />
    <label class="abby-label" for={id}>
      <div class="toggle-track">
        <div class="toggle-thumb"></div>
      </div>
    </label>
  </div>
  <label class="switch-label" for={id}>{label}</label>
</div>

<style lang="scss">
  .switch-container {
    display: flex;
    align-items: center;
    padding: 0.5rem;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.03);
    transition: background 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }
  }

  .switch-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .switch-label {
    margin-left: 0.75rem;
    font-size: 0.875rem;
    cursor: pointer;
    user-select: none;
    line-height: 1.2;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .abby-switch {
    position: absolute;
    opacity: 0;
    height: 0;
    width: 0;
    margin: 0;
  }

  .abby-label {
    display: inline-block;
    cursor: pointer;
  }

  .toggle-track {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 36px;
    height: 20px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 34px;
    padding: 2px;
    transition: all 0.2s ease;
  }

  .toggle-thumb {
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 50%;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  .abby-switch:checked + .abby-label .toggle-track {
    background-color: rgb(249, 168, 212);
  }

  .abby-switch:checked + .abby-label .toggle-thumb {
    transform: translateX(16px);
  }

  .abby-switch:focus + .abby-label .toggle-track {
    box-shadow: 0 0 0 2px rgba(249, 168, 212, 0.25);
  }
</style>
