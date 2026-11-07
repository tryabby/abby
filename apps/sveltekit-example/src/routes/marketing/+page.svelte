<script lang="ts">
  import { useAbby, getABResetFunction } from '$lib/abby';

  const { variant, onAct } = useAbby('ButtonColor', {
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    green: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    red: 'bg-rose-600 hover:bg-rose-700 text-white',
  });

  function handleReset() {
    const reset = getABResetFunction('ButtonColor');
    reset();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
</script>

<svelte:head>
  <title>Marketing - SvelteKit Example</title>
</svelte:head>

<main class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
    <div class="mb-4 flex items-center space-x-2">
      <span class="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
        Marketing Page
      </span>
    </div>

    <h1 class="text-3xl font-extrabold text-gray-900">Marketing Campaign</h1>
    <p class="mt-4 text-lg text-gray-600">
      Test variant styling applied dynamically:
      <span class="font-bold uppercase text-gray-900">{$variant}</span>
    </p>

    <div class="mt-6 flex items-center gap-4">
      <button
        type="button"
        on:click={onAct}
        class="rounded-lg px-6 py-3 font-semibold shadow-sm transition-colors duration-150 {$variant}"
      >
        Sign Up Now
      </button>

      <button
        type="button"
        on:click={handleReset}
        class="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        Reset Variant
      </button>
    </div>

    <div class="mt-8 border-t border-gray-100 pt-4">
      <a href="/" class="text-sm font-medium text-indigo-600 hover:text-indigo-800">
        ← Back to Overview
      </a>
    </div>
  </div>
</main>
