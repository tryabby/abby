<script lang="ts">
	import { useAbby, getABResetFunction } from '../../lib/abby';
	const marketingTestname = 'New Test3';
	const { variant, onAct } = useAbby(marketingTestname);
	const resetAB = 'as';
</script>

<h2>Home page variant</h2>
You're currently on variant {$variant}
<button on:click={() => getABResetFunction(marketingTestname)}>reset</button>
<a href="/"> index</a>
