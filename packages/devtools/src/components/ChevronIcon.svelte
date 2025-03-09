<script lang="ts">
  export let open = false;
</script>

<div class="chevron" class:open>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
</div>

<style>
  .chevron {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--abby-accent);
    transition: transform 0.2s ease;

    &.open {
      transform: rotate(180deg);
    }
  }
</style>
