<script>
  import { abby } from "$lib/abby";
  const { variant, onAct } = abby.useAbby("New Test3");
  const feature = abby.useFeatureFlag("lol");
  const test3 = abby.useFeatureFlag("test3");
  const s = abby.abbyStore;
</script>

<body>
  <a href="/"> back </a>
  {$variant}
  <br />
  {#if $feature}
    show feature 1
  {/if}
  <br />
  {#if $test3}
    show feature 2
  {/if}
</body>
