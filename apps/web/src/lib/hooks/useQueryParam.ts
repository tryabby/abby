import { useRouter } from 'next/router';

export function useQueryParam<T extends string = string>(param: string) {
  const router = useRouter();
  const query = router.query;
  const queryParam = query[param];
  return (Array.isArray(queryParam) ? queryParam[0] : queryParam) as T | undefined;
}

export function useUnsafeQueryParam<T extends string = string>(param: string) {
  return useQueryParam<T>(param) as T;
}
