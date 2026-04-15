import { useState, useEffect } from 'react';
import { getCompanyPermits, getLocationPermits } from '@/lib/api/permits';
import { supabase } from '@/lib/supabase';
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

  /**
   * Update a permit record
   */
  const updatePermit = async (
    permitId: string,
    updates: {
      issue_date?: string;
      expiry_date?: string | null;
      status?: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
      permit_number?: string | null;
      notes?: string | null;
    }
  ) => {
    const query = supabase.from('permits') as any;
    const { error } = await query
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', permitId);

    if (error) {
      console.error('Error updating permit:', error);
      throw new Error(`Error al actualizar el permiso: ${error.message}`);
    }

    // Refresh permits list
    refetch();
  };

  return {
    permits,
    loading,
    error,
    refetch,
    updatePermit,
  };
}
