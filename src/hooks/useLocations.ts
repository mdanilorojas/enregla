import { useState, useEffect } from 'react';
import { getCompanyLocations } from '@/lib/api/locations';
import type { Location } from '@/types/database';

export function useLocations(companyId: string | null | undefined) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getCompanyLocations(companyId)
      .then((data) => {
        setLocations(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching locations:', err);
        setError(err.message || 'Failed to fetch locations');
        setLocations([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [companyId]);

  return { locations, loading, error, refetch: () => {
    if (companyId) {
      setLoading(true);
      getCompanyLocations(companyId)
        .then(setLocations)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }};
}
