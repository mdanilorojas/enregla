import { useState, useEffect, useMemo } from 'react';
import { getCompanyLocations, getLocation } from '@/lib/api/locations';
import { usePermits } from '@/hooks/usePermits';
import { calculateLocationRiskLevel } from '@/lib/dashboard-metrics';
import type { Location } from '@/types/database';

export function useLocations(companyId: string | null | undefined) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get permits for risk calculation
  const { permits } = usePermits({ companyId });

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
  }, [companyId]); // Only re-fetch when companyId changes

  // Memoize risk calculation to avoid re-computing on every render
  const locationsWithRisk = useMemo(() => {
    return locations.map(location => ({
      ...location,
      risk_level: calculateLocationRiskLevel(location, permits),
    }));
  }, [locations, permits]); // Re-calculate only when locations or permits change

  return {
    locations: locationsWithRisk,
    loading,
    error,
    refetch: () => {
      if (companyId) {
        setLoading(true);
        getCompanyLocations(companyId)
          .then(setLocations)
          .catch((err) => setError(err.message))
          .finally(() => setLoading(false));
      }
    }
  };
}

export function useLocation(locationId: string | null | undefined) {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationId) {
      setLocation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getLocation(locationId)
      .then((data) => {
        setLocation(data);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching location:', err);
        setError(err.message || 'Failed to fetch location');
        setLocation(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [locationId]);

  return { location, loading, error, refetch: () => {
    if (locationId) {
      setLoading(true);
      getLocation(locationId)
        .then(setLocation)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }};
}
