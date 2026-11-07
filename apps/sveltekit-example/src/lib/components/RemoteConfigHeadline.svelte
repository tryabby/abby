<script lang="ts">
  import { useRemoteConfig } from '$lib/abby';

  const headline = useRemoteConfig('headline');
  const copyText = useRemoteConfig('copyText');
</script>

<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
  <div class="mb-2 flex items-center space-x-2">
    <span class="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-800">
      Remote Config
    </span>
  </div>
  <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
    {$headline || 'A/B Testing with A/BBY & SvelteKit'}
  </h1>
  <p class="mt-3 text-lg text-gray-500">
    {$copyText || 'In this demo we use cookies and SvelteKit to assign variant buckets, feature flags, and remote config at the edge.'}
  </p>
</div>
