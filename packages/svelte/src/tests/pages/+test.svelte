<script lang="ts">
  import { abby } from "../abby";
  export let data: { __abby__data: any; __abby_cookie: any };
  const { useFeatureFlag, AbbyProvider, useRemoteConfig } = abby;
  const flag1 = useFeatureFlag("flag1");
  const remoteConfig1 = useRemoteConfig("remoteConfig1");
</script>

<body>
  <AbbyProvider abby={abby.__abby__} {data}>
    {#if $flag1}
      <div id="flag1Enabled">my super secret feature 1</div>
    {/if}

    {#if $remoteConfig1 !== "FooBar"}
      <div id="remoteConfig1">my remoteConfig1 value</div>
    {/if}
  </AbbyProvider>
</body>
