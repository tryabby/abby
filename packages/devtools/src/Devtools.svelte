<script lang="ts">
  import Switch from "./components/Switch.svelte";
  import CloseIcon from "./components/CloseIcon.svelte";
  import Select from "./components/Select.svelte";
  import type { Abby } from "@tryabby/core";
  import type { Shortcut } from "./lib/types";
  import { onDestroy, onMount, tick } from "svelte";
  import Mousetrap from "mousetrap";

  import { crossfade } from "svelte/transition";
  import { quintInOut } from "svelte/easing";
  import { getShowDevtools, setShowDevtools } from "./lib/storage";

  export let position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right" = "bottom-right";

  export let defaultShow: boolean = false;

  export let shortcut: Shortcut | Array<Shortcut> = ["command+.", "ctrl+."];

  export let abby: Abby<any, any, any>;

  let show = false;

  const onToggleVisibility = () => {
    show = !show;
    setShowDevtools(show);
  };

  const onMessage = (event: MessageEvent) => {
    if (event.data === "abby:toggle-devtools") {
      onToggleVisibility();
    }
    if (event.data === "abby:close-devtools") {
      show = false;
      setShowDevtools(show);
    }
    if (event.data === "abby:open-devtools") {
      show = true;
      setShowDevtools(show);
    }
  };

  // hacky way to sync props <> state
  onMount(async () => {
    const { hasStoredValue, showDevtools } = getShowDevtools();

    if (hasStoredValue) {
      show = showDevtools;
    } else {
      show = defaultShow;
    }

    Mousetrap.bind(shortcut, onToggleVisibility);
    window.addEventListener("message", onMessage);
  });

  onDestroy(() => {
    Mousetrap.unbind(shortcut);
    window.removeEventListener("message", onMessage);
  });

  const { flags, tests } = abby?.getProjectData() ?? {};

  const [send, receive] = crossfade({
    duration: 200,
    easing: quintInOut,
  });

  let key = "devtools";
</script>

{#if show}
  <div
    in:send={{ key }}
    out:receive={{ key }}
    id="devtools"
    style:--right={position === "top-right" || position === "bottom-right"
      ? "1rem"
      : "auto"}
    style:--bottom={position === "bottom-left" || position === "bottom-right"
      ? "1rem"
      : "auto"}
    style:--left={position === "top-left" || position === "bottom-left"
      ? "1rem"
      : "auto"}
    style:--top={position === "top-left" || position === "top-right"
      ? "1rem"
      : "auto"}
  >
    <div class="header">
      <h1>Abby Devtools</h1>
      <button on:click={onToggleVisibility}>
        <CloseIcon />
      </button>
    </div>
    <small
      >Env: <span style="color: var(--pink); font-weight: medium;"
        >{abby.getConfig().currentEnvironment}</span
      ></small
    >
    <hr />
    <h2>Flags:</h2>

    {#each Object.entries(flags) as [flagName, flagValue]}
      <Switch
        id={flagName}
        label={flagName}
        checked={flagValue}
        onChange={(newValue) => abby.updateFlag(flagName, newValue)}
      />
    {/each}

    <hr />
    <h2>A/B Tests:</h2>
    {#each Object.entries(tests) as [testName, { selectedVariant, variants }]}
      <Select
        label={testName}
        value={selectedVariant}
        options={variants.map((v) => ({
          label: v,
          value: v,
        }))}
        onChange={(newValue) => abby.updateLocalVariant(testName, newValue)}
      />
    {/each}
  </div>
{:else}
  <button
    in:send={{ key }}
    out:receive={{ key }}
    on:click={onToggleVisibility}
    id="devtools-collapsed"
    style:--right={position === "top-right" || position === "bottom-right"
      ? "1rem"
      : "auto"}
    style:--bottom={position === "bottom-left" || position === "bottom-right"
      ? "1rem"
      : "auto"}
    style:--left={position === "top-left" || position === "bottom-left"
      ? "1rem"
      : "auto"}
    style:--top={position === "top-left" || position === "top-right"
      ? "1rem"
      : "auto"}
  >
    A/B
  </button>
{/if}

<style lang="scss">
  #devtools-collapsed {
    --pink: hsl(323 72.8% 59.2%);
    bottom: var(--bottom);
    right: var(--right);
    left: var(--left);
    top: var(--top);
    z-index: 9999;
    position: fixed;
    color: var(--pink);
    font-weight: bold;
    background: hsl(224 71% 4%);
    font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo,
      Consolas, "DejaVu Sans Mono", monospace;

    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1),
      0 4px 6px -4px rgb(0 0 0 / 0.1);
  }

  #devtools {
    --pink: hsl(323 72.8% 59.2%);
    font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo,
      Consolas, "DejaVu Sans Mono", monospace;
    position: fixed;
    bottom: var(--bottom);
    right: var(--right);
    left: var(--left);
    top: var(--top);
    background: hsl(224 71% 4%);
    padding: 15px 10px;
    padding-top: 10px;
    z-index: 9999;
    border-radius: 6px;
    font-size: 14px;
    color: hsl(213 31% 91%);
    min-width: 300px;

    hr {
      margin: 1rem 0;
      border-color: rgba(255, 255, 255, 0.4);
      border-bottom: 0;
    }
    small {
      display: block;
      margin-top: 10px;
      font-size: 0.8rem;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      button {
        all: unset;
        display: contents;
        cursor: pointer;
      }
    }
    h1,
    h2 {
      all: unset;
      color: var(--pink);
    }

    h1 {
      font-size: 1.5rem;
      font-weight: bold;
    }

    h2 {
      font-size: 1.1rem;
      font-weight: 600;
    }
  }
</style>
