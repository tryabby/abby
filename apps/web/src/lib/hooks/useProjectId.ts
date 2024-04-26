import { useRouter } from 'next/router'
import { useUnsafeQueryParam } from './useQueryParam'

export function useProjectId() {
  return useUnsafeQueryParam('projectId')
}
