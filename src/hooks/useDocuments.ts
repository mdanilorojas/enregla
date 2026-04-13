import { useState, useEffect } from 'react';
import { getPermitDocuments } from '@/lib/api/documents';
import type { Document } from '@/types/database';

export function useDocuments(permitId: string | undefined) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    if (!permitId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getPermitDocuments(permitId);
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar documentos');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [permitId]);

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
  };
}
