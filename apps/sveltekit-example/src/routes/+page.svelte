<script lang="ts">
  import FeatureFlagBanner from '$lib/components/FeatureFlagBanner.svelte';
  import RemoteConfigHeadline from '$lib/components/RemoteConfigHeadline.svelte';
  import ABTestButton from '$lib/components/ABTestButton.svelte';
  import { useFeatureFlag } from '$lib/abby';

  const clientFlag = useFeatureFlag('clientFlag');
  const serverFlag = useFeatureFlag('serverFlag');
</script>

<svelte:head>
  <title>A/B Testing with A/BBY (SvelteKit Example)</title>
</svelte:head>

<FeatureFlagBanner />

<main class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="mx-auto max-w-4xl space-y-8">
    <RemoteConfigHeadline />

    <ABTestButton />

    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 class="text-xl font-bold text-gray-900">Feature Flags Overview</h2>
      <p class="mt-1 text-sm text-gray-500">
        Feature flags can be toggled in your A/BBY dashboard in real time.
      </p>

      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <span class="text-xs font-semibold uppercase text-gray-500">Client Flag</span>
          <p class="mt-1 text-lg font-medium text-gray-900">
            Status: <span class="font-bold {$clientFlag ? 'text-green-600' : 'text-gray-400'}">{$clientFlag ? 'ENABLED' : 'DISABLED'}</span>
          </p>
          {#if $clientFlag}
            <p class="mt-1 text-xs text-green-600">If you see this, clientFlag is enabled.</p>
          {/if}
        </div>

        <div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
          <span class="text-xs font-semibold uppercase text-gray-500">Server Flag</span>
          <p class="mt-1 text-lg font-medium text-gray-900">
            Status: <span class="font-bold {$serverFlag ? 'text-green-600' : 'text-gray-400'}">{$serverFlag ? 'ENABLED' : 'DISABLED'}</span>
          </p>
          {#if $serverFlag}
            <p class="mt-1 text-xs text-green-600">If you see this, serverFlag is enabled.</p>
          {/if}
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 class="text-xl font-bold text-gray-900">Explore Route Variations</h2>
      <p class="mt-1 text-sm text-gray-500">
        In this demo, cookies assign a bucket with the variant to show on different routes.
      </p>
      <ul class="mt-4 space-y-2">
        <li>
          <a href="/home" class="inline-flex items-center font-medium text-indigo-600 hover:text-indigo-800">
            → Visit /home (Multi-variant test)
          </a>
        </li>
        <li>
          <a href="/marketing" class="inline-flex items-center font-medium text-indigo-600 hover:text-indigo-800">
            → Visit /marketing (Marketing test)
          </a>
        </li>
      </ul>
    </div>
  </div>
</main>
