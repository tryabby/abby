import createCacheRealm from "@databases/cache";

const { createCache } = createCacheRealm({ maximumSize: 10_000 });

export default createCache;
