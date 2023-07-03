<script lang="ts">
  import { createDialog } from "@melt-ui/svelte";
  import { scale } from "svelte/transition";
  import JsonEditor from "./JsonEditor.svelte";

  export let onChange = (value: Record<string, unknown>) => {};
  export let value: Record<string, unknown> = {};

  const { trigger, portal, overlay, content, title, description, close, open } = createDialog();
</script>

<div>
  <button {...$trigger} use:trigger.action class="trigger">JSON Editor</button>
  <div use:portal>
    {#if $open}
      <div {...$overlay} class="backdrop" />
      <div
        transition:scale={{ duration: 150, start: 0.96 }}
        {...$content}
        use:content.action
        class="content"
      >
        <JsonEditor
          on:change={(e) => {
            value = e.detail;
          }}
          {value}
        />
        <div class="buttons">
          <button use:close.action class="cancel">Cancel</button>
          <button
            class="save"
            use:close.action
            on:click={() => {
              onChange(value);
            }}>Save</button
          >
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .trigger {
    border-radius: 6px;
    background-color: var(--pink);
    color: white;
    padding: 0.5rem 1rem;
  }

  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9998;
    background: rgba(0, 0, 0, 0.5);
    width: 100vw;
    height: 100vh;
  }
  .content {
    z-index: 9999;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #1e1e1e;
    border-radius: 6px;
    width: 80vw;
    max-width: 800px;
    max-height: 80vh;
    height: 100%;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 1rem 0.5rem;
    padding: 1rem;
    background-color: #1e1e1e;

    button {
      border-radius: 6px;
      padding: 0.5rem 1rem;
      border: none;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
    }
    .cancel {
      background-color: hsl(210 40% 96.1%);
      color: hsl(222.2 47.4% 11.2%);
    }
    .save {
      background-color: hsl(323 72.8% 59.2%);
      color: white;
    }
  }
</style>
