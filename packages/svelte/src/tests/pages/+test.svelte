<script lang="ts">
	import { abby } from '../abby';
	export let data: { __abby__data: any; __abby_cookie: any };
	const { useFeatureFlag, AbbyProvider } = abby;
	const flag1 = useFeatureFlag('flag1');
	const flag2 = useFeatureFlag('flag2');
</script>

<body>
	<AbbyProvider abby={abby.__abby__} {data}>
		{#if $flag1}
			<div id="flag1Enabled">my super secret feature 1</div>
		{/if}

		{#if $flag2}
			<div id="flag2Enabled">my super secret feature 2</div>
		{/if}
	</AbbyProvider>
</body>
