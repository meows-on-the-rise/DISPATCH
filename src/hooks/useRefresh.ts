import { useState, useCallback } from 'react';

export function useRefresh(refetchFn: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchFn();
    } finally {
      setRefreshing(false);
    }
  }, [refetchFn]);

  return { refreshing, onRefresh };
}
