import { useState, useEffect } from 'react';
import { getCompanyPermits, getLocationPermits, updatePermit as updatePermitApi } from '@/lib/api/permits';
import type { Permit } from '@/types/database';

interface UsePermitsOptions {
  companyId?: string | null;
  locationId?: string | null;
}

export function usePermits({ companyId, locationId }: UsePermitsOptions) {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId && !locationId) {
      setPermits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchPromise = locationId
      ? getLocationPermits(locationId)
      : companyId
      ? getCompanyPermits(companyId)
      : Promise.resolve([]);

    fetchPromise
      .then((data) => {
        setPermits(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching permits:', err);
        setError(err.message || 'Failed to fetch permits');
        setPermits([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [companyId, locationId]);

  const refetch = () => {
    if (locationId || companyId) {
      setLoading(true);
      const fetchPromise = locationId
        ? getLocationPermits(locationId)
        : companyId
        ? getCompanyPermits(companyId)
        : Promise.resolve([]);

      fetchPromise
        .then(setPermits)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  };

  const updatePermit = async (permitId: string, updates: Partial<Permit>) => {
    const updatedPermit = await updatePermitApi(permitId, updates);
    setPermits((prev) =>
      prev.map((permit) => (permit.id === permitId ? updatedPermit : permit))
    );
    return updatedPermit;
  };

  return {
    permits,
    loading,
    error,
    refetch,
    updatePermit,
  };
}
