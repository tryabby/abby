<script lang="ts">
  export let id: string;
  export let label: string;
  export let checked = false;
  export let onChange: (newValue: boolean) => void;
</script>

<div class="switch">
  <input
    type="checkbox"
    class="abby-switch"
    bind:checked
    {id}
    on:change={(e) => {
      onChange(e.currentTarget.checked);
    }}
  /><label class="abby-label" for={id}>{label}</label>
  {label}
</div>

<style lang="scss">
  .abby-switch {
    all: unset;
    height: 0;
    width: 0;
    visibility: hidden;
  }
  .switch {
    display: flex;
    align-items: center;
    margin: 10px 0;
    label {
      margin-right: 10px;
    }

    .abby-label {
      cursor: pointer;
      text-indent: -9999px;
      width: 45px;
      height: 25px;
      background: rgba(249, 168, 212, 0.3);
      display: block;
      border-radius: 25px;
      position: relative;
      transition: background 0.1s ease-in-out;
    }

    .abby-label:after {
      content: "";
      position: absolute;
      top: 2.25px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: #fff;
      border-radius: 50px;
      transition: 0.3s;
    }

    .abby-switch:checked + .abby-label {
      background: var(--pink);
    }

    .abby-switch:checked + .abby-label:after {
      left: calc(100% - 2px);
      transform: translateX(-100%);
    }

    .abby-label:active:after {
      width: 25px;
    }
  }
</style>
