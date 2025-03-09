<script lang="ts">
  import type { Abby } from "@tryabby/core";
  import Mousetrap from "mousetrap";
  import { onDestroy, onMount } from "svelte";
  import CloseIcon from "./components/CloseIcon.svelte";
  import Select from "./components/Select.svelte";
  import Switch from "./components/Switch.svelte";
  import type { Shortcut } from "./lib/types";

  import { quintInOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";
  import { slide } from "svelte/transition";
  import Input from "./components/Input.svelte";
  import Modal from "./components/Modal.svelte";
  import {
    getSections,
    getShowDevtools,
    setShowDevtools,
    setSections,
  } from "./lib/storage";
  import ChevronIcon from "./components/ChevronIcon.svelte";

  export let position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right" = "bottom-right";

  export let defaultShow = false;

  export let shortcut: Shortcut | Array<Shortcut> = ["command+.", "ctrl+."];

  export let abby: Abby<any, any, any, any, any>;

  let show = false;
  // Track open/closed state of each section
  let openSections = {
    flags: true,
    remoteConfig: true,
    tests: true,
  };

  const toggleSection = (section) => {
    openSections[section] = !openSections[section];
    setSections(openSections);
  };

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
    const savedSections = getSections();

    openSections = savedSections;

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

  const { flags, tests, remoteConfig } = abby?.getProjectData() ?? {};

  const [send, receive] = crossfade({
    duration: 300,
    easing: quintInOut,
  });

  const key = "devtools";

  const flagsEntries = Object.entries(flags || {});
  const remoteConfigEntries = Object.entries(remoteConfig || {});
  const testsEntries = Object.entries(tests || {});

  $: {
    console.log(remoteConfigEntries);
  }
</script>

{#if show}
  <div
    in:send={{ key }}
    out:receive={{ key }}
    id="abby-devtools"
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
      <h1 class="logo">Abby Devtools</h1>
      <button
        on:click={onToggleVisibility}
        class="close-btn"
        aria-label="Close"
      >
        <CloseIcon />
      </button>
    </div>
    <div class="env-tag">
      <span>Environment:</span>
      <span class="env-value">{abby.getConfig().currentEnvironment}</span>
    </div>
    <hr />
    <div class="content">
      <div class="section">
        <button
          class="section-header"
          on:click={() => toggleSection("flags")}
          aria-expanded={openSections.flags}
        >
          <h2>Feature Flags</h2>
          <ChevronIcon open={openSections.flags} />
        </button>

        {#if openSections.flags}
          <div class="section-content" transition:slide={{ duration: 200 }}>
            <div class="controls-grid">
              {#if flagsEntries.length > 0}
                {#each flagsEntries as [flagName, flagValue]}
                  <Switch
                    id={flagName}
                    label={flagName}
                    checked={flagValue.value}
                    onChange={(newValue) => {
                      window.postMessage(
                        { type: "abby:update-flag", flagName, newValue },
                        "*"
                      );
                      abby.updateFlag(flagName, newValue);
                    }}
                  />
                {/each}
              {:else}
                <div class="section-empty-state">
                  <p>No feature flags found</p>
                  <p class="hint">
                    Add feature flags in your Abby configuration
                  </p>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
      <hr />

      <div class="section">
        <button
          class="section-header"
          on:click={() => toggleSection("remoteConfig")}
          aria-expanded={openSections.remoteConfig}
        >
          <h2>Remote Config</h2>
          <ChevronIcon open={openSections.remoteConfig} />
        </button>

        {#if openSections.remoteConfig}
          <div class="section-content" transition:slide={{ duration: 200 }}>
            <div class="controls-grid">
              {#if remoteConfigEntries.length > 0}
                {#each remoteConfigEntries as [remoteConfigName, remoteConfigValue]}
                  {#if typeof remoteConfigValue.value === "string" || typeof remoteConfigValue.value === "number"}
                    <Input
                      id={remoteConfigName}
                      label={remoteConfigName}
                      type={typeof remoteConfigValue.value === "string"
                        ? "text"
                        : "number"}
                      value={remoteConfigValue.value}
                      onChange={(newValue) => {
                        window.postMessage(
                          {
                            type: "abby:update-flag",
                            remoteConfigName,
                            newValue,
                          },
                          "*"
                        );
                        abby.updateRemoteConfig(remoteConfigName, newValue);
                      }}
                    />
                  {:else if typeof remoteConfigValue.value === "object"}
                    <div class="config-object">
                      <p class="config-label">{remoteConfigName}</p>
                      <Modal
                        value={remoteConfigValue.value}
                        onChange={(newValue) => {
                          window.postMessage(
                            {
                              type: "abby:update-flag",
                              remoteConfigName,
                              newValue,
                            },
                            "*"
                          );
                          abby.updateRemoteConfig(remoteConfigName, newValue);
                        }}
                      />
                    </div>
                  {/if}
                {/each}
              {:else}
                <div class="section-empty-state">
                  <p>No remote configs found</p>
                  <p class="hint">
                    Add remote configs in your Abby configuration
                  </p>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
      <hr />

      <div class="section">
        <button
          class="section-header"
          on:click={() => toggleSection("tests")}
          aria-expanded={openSections.tests}
        >
          <h2>A/B Tests</h2>
          <ChevronIcon open={openSections.tests} />
        </button>

        {#if openSections.tests}
          <div class="section-content" transition:slide={{ duration: 200 }}>
            <div class="controls-grid">
              {#if testsEntries.length > 0}
                {#each testsEntries as [testName, { selectedVariant, variants }]}
                  <Select
                    label={testName}
                    value={selectedVariant}
                    options={variants.map((v) => ({
                      label: v,
                      value: v,
                    }))}
                    onChange={(newValue) => {
                      window.postMessage(
                        { type: "abby:select-variant", testName, newValue },
                        "*"
                      );
                      abby.updateLocalVariant(testName, newValue);
                    }}
                  />
                {/each}
              {:else}
                <div class="section-empty-state">
                  <p>No A/B tests found</p>
                  <p class="hint">Add A/B tests in your Abby configuration</p>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      </div>

      {#if flagsEntries.length === 0 && remoteConfigEntries.length === 0 && testsEntries.length === 0}
        <hr />
        <div class="empty-state">
          <p>No flags, remote configs, or A/B tests found.</p>
          <p class="hint">
            Make sure you have defined them in your Abby configuration.
          </p>
        </div>
      {/if}
    </div>
  </div>
{:else}
  <button
    class="toggle-btn"
    in:send={{ key }}
    out:receive={{ key }}
    on:click={onToggleVisibility}
    id="abby-devtools-collapsed"
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
    <span>Ab</span>
  </button>
{/if}

<style lang="scss">
  :root {
    --abby-accent: rgb(249, 168, 212);
    --abby-accent-light: rgba(249, 168, 212, 0.2);
    --abby-bg: #121929;
    --abby-text: hsl(213 31% 91%);
    --abby-border: rgba(255, 255, 255, 0.12);
    --abby-section-bg: rgba(255, 255, 255, 0.03);
    --abby-radius: 10px;
    --abby-radius-sm: 6px;
    --abby-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  }

  #abby-devtools-collapsed {
    position: fixed;
    z-index: 9999;
    bottom: var(--bottom);
    right: var(--right);
    left: var(--left);
    top: var(--top);
    color: var(--abby-accent);
    font-weight: bold;
    font-size: 18px;
    background: var(--abby-bg);
    font-family:
      ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas,
      "DejaVu Sans Mono", monospace;
    width: 48px;
    height: 48px;
    border-radius: var(--abby-radius);
    border: 2px solid var(--abby-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--abby-shadow);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    padding: 0;

    &:hover {
      transform: scale(1.05);
      background: #1a2437;
    }
  }

  .toggle-btn {
    all: unset;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    span {
      position: relative;
      top: -1px;
    }
  }

  #abby-devtools {
    font-family:
      ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas,
      "DejaVu Sans Mono", monospace;
    position: fixed;
    bottom: var(--bottom);
    right: var(--right);
    left: var(--left);
    top: var(--top);
    background: var(--abby-bg);
    z-index: 9999;
    border-radius: var(--abby-radius);
    border: 1px solid var(--abby-border);
    font-size: 14px;
    color: var(--abby-text);
    min-width: 350px;
    max-width: 450px;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 3rem);
    box-shadow: var(--abby-shadow);
    overflow: hidden;

    .logo {
      font-family: "Martian Mono", inherit;
      margin: 0;
      padding: 0;
    }

    hr {
      margin: 0.75rem 0;
      border: none;
      height: 1px;
      background: var(--abby-border);
    }

    .env-tag {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding: 0 1rem;
      font-size: 0.85rem;

      .env-value {
        color: var(--abby-accent);
        font-weight: 500;
        background: var(--abby-accent-light);
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
      }
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: rgba(0, 0, 0, 0.15);
      border-bottom: 1px solid var(--abby-border);

      h1 {
        font-size: 1.25rem;
        color: var(--abby-accent);
        letter-spacing: -0.5px;
      }

      .close-btn {
        all: unset;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }

    .content {
      padding: 0 1rem 1rem;
      overflow-y: auto;
      flex: 1;

      &::-webkit-scrollbar {
        width: 8px;
      }
      &::-webkit-scrollbar-track {
        background-color: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        &:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }
      }

      .section {
        padding: 0;

        .section-header {
          all: unset;
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          padding: 0.75rem 0;
          border-radius: var(--abby-radius-sm);
          transition: background 0.15s ease;

          &:hover {
            background: rgba(255, 255, 255, 0.03);
          }

          &:focus-visible {
            outline: 2px solid var(--abby-accent);
            outline-offset: 2px;
          }
        }

        .section-content {
          padding: 0 0 0.75rem 0;
        }
      }

      .controls-grid {
        display: grid;
        gap: 0.75rem;
      }

      .config-object {
        display: flex;
        flex-direction: column;
        margin: 0.5rem 0;

        .config-label {
          margin-bottom: 0.25rem;
          font-weight: medium;
        }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
        text-align: center;
        color: var(--abby-text);
        opacity: 0.7;

        p {
          margin: 0.25rem 0;
        }

        .hint {
          font-size: 0.85rem;
          opacity: 0.7;
        }
      }

      .section-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        text-align: center;
        color: var(--abby-text);
        opacity: 0.7;
        background: var(--abby-section-bg);
        border-radius: var(--abby-radius-sm);
        p {
          margin: 0.25rem 0;
          max-width: 250px;
        }

        .hint {
          font-size: 0.85rem;
          opacity: 0.7;
        }
      }
    }

    h2 {
      all: unset;
      color: var(--abby-accent);
      font-size: 1rem;
      font-weight: 600;
      display: block;
    }
  }
</style>
