import { useUnsafeQueryParam } from "./useQueryParam";

export function useProjectId() {
  return useUnsafeQueryParam("projectId");
}
