// Produces a deterministic shallow fingerprint for reactive user property equality checks.
export function serializeUserProperties(user: Record<string, unknown>): string {
  const sortedEntries = Object.keys(user)
    .sort()
    .map((key) => [key, user[key]]);
  return JSON.stringify(sortedEntries);
}
