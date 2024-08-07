<script lang="ts">
	import type { Abby } from '@tryabby/core';

	export let abby: Abby<any, any, any>;
	import type { AbbyDataResponse } from '@tryabby/core';
	import { onMount } from 'svelte';

	export let data: {
		__abby__data: AbbyDataResponse | null;
		__abby_cookie: string | null;
	} | null;

	onMount(async () => {
		if (data?.__abby__data) {
			abby.init(data.__abby__data);
		} else {
			await abby.loadProjectData();
		}
	});

	if (typeof window === 'undefined' && data?.__abby__data !== undefined) {
		abby.init(data.__abby__data);
		abby.setLocalOverrides(data.__abby_cookie ?? '');
	}
</script>

<slot />
