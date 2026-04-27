import { useState, useEffect, useCallback } from 'react';
import { getCompanyDocuments } from '@/lib/api/documents';

export interface CompanyDocument {
  id: string;
  permit_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  permits: {
    id: string;
    type: string;
    status: 'vigente' | 'por_vencer' | 'vencido' | 'no_registrado';
    company_id: string;
    location_id: string;
    expiry_date: string | null;
  };
}

export function useCompanyDocuments(companyId: string | null | undefined) {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!companyId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getCompanyDocuments(companyId);
      setDocuments(data as CompanyDocument[]);
    } catch (err) {
      console.error('Error fetching company documents:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar documentos');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
  };
}
