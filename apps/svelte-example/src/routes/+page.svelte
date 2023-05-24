<script lang="ts">
	import { useAbby, useFeatureFlag } from '../lib/abby';
	const { variant, onAct } = useAbby('New Test3');
	const clientFeatureFlag = useFeatureFlag('lol');
	const serverFeatureFlag = useFeatureFlag('test3');
</script>

<h1>
	AB testing with buckets In this demo we use cookies to assign a bucket with the variant to show.
</h1>
<p>Visit one of the pages below and a bucket will be assigned to you.</p>
<ul>
	<li>
		<a href="/home"> /home </a>
	</li>
	<li>
		<a href="/marketing"> /marketing </a>
	</li>
</ul>
{#if $clientFeatureFlag}
	<p>If you see this text the client flag is enabled</p>
{/if}
{#if $serverFeatureFlag}
	If you see this text the server side flag is enabled
{/if}
