<script lang="ts">
	import type { LayoutData } from './$types';
	import { AbbyProvider, __abby__ } from '../lib/abby';

	export let data: LayoutData;
</script>

<body>
	<AbbyProvider {data} abby={__abby__} />
</body>
