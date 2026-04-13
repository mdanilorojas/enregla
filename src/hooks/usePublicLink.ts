import { useState, useEffect } from 'react';
import { getLocationPublicLink } from '@/lib/api/publicLinks';
import type { PublicLink } from '@/types/database';

export function usePublicLink(locationId: string | undefined) {
  const [link, setLink] = useState<PublicLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLink = async () => {
    if (!locationId) {
      setLink(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getLocationPublicLink(locationId);
      setLink(data);
    } catch (err) {
      console.error('Error fetching public link:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar link público');
      setLink(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLink();
  }, [locationId]);

  return {
    link,
    loading,
    error,
    refetch: fetchLink,
  };
}
