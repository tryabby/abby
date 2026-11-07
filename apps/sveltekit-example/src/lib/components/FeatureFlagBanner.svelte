<script lang="ts">
  import { useFeatureFlag } from '$lib/abby';

  const showBanner = useFeatureFlag('showBanner');
  const clientFlag = useFeatureFlag('clientFlag');
</script>

{#if $showBanner}
  <div class="bg-indigo-600 px-4 py-3 text-white shadow-md">
    <div class="mx-auto flex max-w-7xl items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="inline-flex rounded-full bg-indigo-800 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-200">
          Feature Flag
        </span>
        <p class="text-sm font-medium">
          Special announcement banner is active! (Flag: <code class="font-mono bg-indigo-700 px-1 py-0.5 rounded">showBanner</code>)
        </p>
      </div>
      {#if $clientFlag}
        <span class="text-xs text-indigo-200">
          (clientFlag is also enabled)
        </span>
      {/if}
    </div>
  </div>
{/if}
