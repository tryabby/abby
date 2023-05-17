<script lang="ts">
	import type { LayoutData } from './$types';
	import { AbbyProvider, __abby__ } from '../lib/abby';
	import '../app.css';

	export let data: LayoutData;
</script>

<body>
	<AbbyProvider {data} abby={__abby__} />
	<slot />
</body>
