import { useQuery } from '@tanstack/react-query';
import { getRetailers } from '@/services/store';
import { throwIfError } from '@/services/api';

export const retailersKey = ['retailers'] as const;

/**
 * The retailers a store can be linked to (retired ones are left out). They only
 * change with a server migration, so they are fetched once per session.
 */
export const useRetailers = () => {
  const query = useQuery({
    queryKey: retailersKey,
    queryFn: () => getRetailers().then(throwIfError),
    staleTime: Infinity,
  });

  return {
    retailers: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
};
