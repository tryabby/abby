<script lang="ts">
	import { abby } from "$lib/abby";
	const { variant, onAct } = abby.useAbby("New Test3");
	const feature1 = abby.useFeatureFlag("lol");
</script>

<body>
	{#if $variant === "A"}
		<button on:click={onAct}> A</button>
	{:else}
		<button on:click={onAct}> B</button>
	{/if}
	<br />
	{#if $feature1}
		my super secret feature
	{/if}
	<a href="/about"> about</a>
</body>
