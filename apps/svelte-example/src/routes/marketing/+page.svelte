<script lang="ts">
	import { useAbby } from '../../lib/abby';
	const { variant, onAct } = useAbby('New Test3');
</script>

<h2 class="">Home page variant</h2>
You're currently on variant {$variant}

<a href="/"> index</a>
