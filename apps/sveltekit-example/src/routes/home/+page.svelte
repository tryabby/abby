<script lang="ts">
  import { useAbby, getABResetFunction } from '$lib/abby';

  const { variant, onAct } = useAbby('Home');

  function handleReset() {
    const reset = getABResetFunction('Home');
    reset();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
</script>

<svelte:head>
  <title>Home Variant - SvelteKit Example</title>
</svelte:head>

<main class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
    <div class="mb-4 flex items-center space-x-2">
      <span class="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-800">
        A/B Test Route
      </span>
    </div>

    <h1 class="text-3xl font-extrabold text-gray-900">Home Page Variant</h1>
    <p class="mt-4 text-lg text-gray-600">
      You are currently assigned to bucket:
      <span class="inline-block rounded bg-indigo-50 px-3 py-1 text-xl font-bold uppercase text-indigo-700">
        Variant {$variant}
      </span>
    </p>

    <div class="mt-6 flex items-center gap-4">
      <button
        type="button"
        on:click={onAct}
        class="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
      >
        Track Action (onAct)
      </button>

      <button
        type="button"
        on:click={handleReset}
        class="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Reset Bucket
      </button>
    </div>

    <div class="mt-8 border-t border-gray-100 pt-4">
      <a href="/" class="text-sm font-medium text-indigo-600 hover:text-indigo-800">
        ← Back to Overview
      </a>
    </div>
  </div>
</main>
