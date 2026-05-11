import { useState, useEffect } from 'react';
import { getPermit, getPermitHistory } from '@/lib/api/permits';
import type { Permit } from '@/types/database';

export function usePermit(permitId: string | undefined) {
  const [permit, setPermit] = useState<Permit | null>(null);
  const [history, setHistory] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!permitId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermit(null);
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      getPermit(permitId),
      getPermitHistory(permitId)
    ])
      .then(([permitData, historyData]) => {
        setPermit(permitData);
        setHistory(historyData);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching permit:', err);
        setError(err.message || 'Failed to fetch permit');
        setPermit(null);
        setHistory([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [permitId]);

  return {
    permit,
    history,
    loading,
    error,
    refetch: () => {
      if (permitId) {
        setLoading(true);
        Promise.all([
          getPermit(permitId),
          getPermitHistory(permitId)
        ])
          .then(([permitData, historyData]) => {
            setPermit(permitData);
            setHistory(historyData);
          })
          .catch((err) => setError(err.message))
          .finally(() => setLoading(false));
      }
    }
  };
}
