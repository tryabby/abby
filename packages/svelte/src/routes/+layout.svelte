<script lang="ts">
    import { abby } from "$lib/abby";
    import type { LayoutServerData } from "./$types";

    const Provider = abby.AbbyProvider;

    export let data: LayoutServerData;
    const Devtools = abby.withDevTools();
</script>

<Provider {data} abby={abby.__abby__}>
    <Devtools abby={abby.__abby__} props={{ defaultShow: true }} />
    <slot />
</Provider>
