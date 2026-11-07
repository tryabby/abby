<script lang="ts">
  import { useAbby, getABResetFunction } from '$lib/abby';

  const { variant, onAct } = useAbby('ButtonColor', {
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    green: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    red: 'bg-rose-600 hover:bg-rose-700 text-white',
  });

  let clicked = false;
  let clickCount = 0;

  function handleClick() {
    onAct();
    clicked = true;
    clickCount += 1;
  }

  function handleReset() {
    const reset = getABResetFunction('ButtonColor');
    reset();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }
</script>

<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  <div class="mb-2 flex items-center space-x-2">
    <span class="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-800">
      A/B Test
    </span>
  </div>
  <h2 class="text-xl font-bold text-gray-900">
    Button Color Experiment
  </h2>
  <p class="mt-1 text-sm text-gray-500">
    Experiment: <code class="font-mono bg-gray-100 px-1 py-0.5 rounded">ButtonColor</code> | Current Variant:
    <span class="font-bold text-gray-900 uppercase">{$variant}</span>
  </p>

  <div class="mt-6 flex flex-wrap items-center gap-4">
    <button
      type="button"
      on:click={handleClick}
      class="rounded-lg px-6 py-3 font-semibold shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 {$variant}"
    >
      Click to Convert ({$variant.toUpperCase()})
    </button>

    <button
      type="button"
      on:click={handleReset}
      class="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
    >
      Reset Bucket
    </button>
  </div>

  {#if clicked}
    <div class="mt-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
      Conversion recorded via <code class="font-mono font-bold">onAct()</code>! (Clicks: {clickCount})
    </div>
  {/if}
</div>
