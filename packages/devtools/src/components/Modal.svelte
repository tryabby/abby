<script lang="ts">
  import { createDialog } from "@melt-ui/svelte";
  import { scale, fade } from "svelte/transition";
  import JsonEditor from "./JsonEditor.svelte";

  export let onChange = (value: Record<string, unknown>) => {};
  export let value: Record<string, unknown> = {};

  const { trigger, portal, overlay, content, title, description, close, open } =
    createDialog();
</script>

<div>
  <button {...$trigger} use:trigger.action class="trigger">Edit JSON</button>
  <div use:portal>
    {#if $open}
      <div {...$overlay} class="backdrop" transition:fade={{ duration: 200 }} />
      <div
        transition:scale={{ duration: 200, start: 0.95 }}
        {...$content}
        use:content.action
        class="content"
      >
        <div class="modal-header">
          <h3>JSON Editor</h3>
          <button use:close.action class="close-btn" aria-label="Close">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" x2="6" y1="6" y2="18"></line>
              <line x1="6" x2="18" y1="6" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="editor-container">
          <JsonEditor
            on:change={(e) => {
              value = e.detail;
            }}
            {value}
          />
        </div>
        <div class="buttons">
          <button use:close.action class="cancel">Cancel</button>
          <button
            class="save"
            use:close.action
            on:click={() => {
              onChange(value);
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .trigger {
    all: unset;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background-color: rgba(249, 168, 212, 0.2);
    color: rgb(249, 168, 212);
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid rgba(249, 168, 212, 0.3);

    &:hover {
      background-color: rgba(249, 168, 212, 0.3);
    }

    &:focus {
      box-shadow: 0 0 0 2px rgba(249, 168, 212, 0.4);
      outline: none;
    }
  }

  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9998;
    background: rgba(0, 0, 0, 0.7);
    width: 100vw;
    height: 100vh;
    backdrop-filter: blur(4px);
  }

  .content {
    z-index: 9999;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #121929;
    border-radius: 12px;
    width: 90vw;
    max-width: 800px;
    max-height: 90vh;
    height: auto;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
  }
  .content,
  .buttons button {
    font-family:
      "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono",
      monospace;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background-color: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);

    h3 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: rgb(249, 168, 212);
    }

    .close-btn {
      all: unset;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: white;
      }
    }
  }

  .editor-container {
    height: 300px;
    width: 100%;
    overflow: auto;
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1rem;
    background-color: rgba(0, 0, 0, 0.1);
    border-top: 1px solid rgba(255, 255, 255, 0.08);

    button {
      border: none;
      border-radius: 6px;
      padding: 0.6rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .cancel {
      background-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);

      &:hover {
        background-color: rgba(255, 255, 255, 0.15);
      }
    }

    .save {
      background-color: rgb(249, 168, 212);
      color: #121212;
      font-weight: 600;

      &:hover {
        filter: brightness(1.1);
      }
    }
  }
</style>
