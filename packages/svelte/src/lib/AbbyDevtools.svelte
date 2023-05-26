<script lang="ts">
	import { DevtoolsFactory, type AbbyDevtoolProps } from '@tryabby/devtools';
	import { onMount, tick } from 'svelte';
	import type { Abby } from '@tryabby/core';
	export let props: Omit<AbbyDevtoolProps, 'abby'>;
	export let abby: Abby<any, any, any>;
	onMount(async () => {
		await tick();
		if (!props?.dangerouslyForceShow && process.env.NODE_ENV !== 'development') {
			return;
		}
		const factory = new DevtoolsFactory();
		factory.create({ ...props, abby });
	});
</script>
