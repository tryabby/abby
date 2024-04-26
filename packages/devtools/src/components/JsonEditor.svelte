<script lang="ts">
  import loader from "@monaco-editor/loader";
  import { onDestroy, onMount } from "svelte";
  import type * as Monaco from "monaco-editor/esm/vs/editor/editor.api";

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{
    change: Record<string, unknown>;
  }>();
  let editor: Monaco.editor.IStandaloneCodeEditor;
  let monaco: typeof Monaco;
  let editorContainer: HTMLElement;

  let isMounted = false;

  export let value: Record<string, unknown> = {};

  onMount(async () => {
    // Remove the next two lines to load the monaco editor from a CDN
    // see https://www.npmjs.com/package/@monaco-editor/loader#config
    const monacoEditor = await import("monaco-editor/esm/vs/editor/editor.api");
    loader.config({
      monaco: monacoEditor.default,
    });

    monaco = await loader.init();
    isMounted = true;

    // Your monaco instance is ready, let's display some code!
    const editor = monaco.editor.create(editorContainer, {
      theme: "vs-dark",
      language: "json",
      minimap: { enabled: false },
      padding: { top: 10 },
    });

    const model = monaco.editor.createModel(JSON.stringify(value, null, 2), "json");
    editor.setModel(model);

    model.onDidChangeContent(() => {
      dispatch("change", JSON.parse(model.getValue()));
    });
  });

  onDestroy(() => {
    monaco?.editor.getModels().forEach((model) => model.dispose());
  });
</script>

<div class="container" bind:this={editorContainer}>
  {#if !isMounted}
    <p class="loading-text">Loading...</p>
  {/if}
</div>

<style>
  .loading-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .container {
    height: 100%;
    width: 100%;
    position: relative;
  }
</style>
