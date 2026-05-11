import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BusinessType } from './business-types';

export interface LegalReferenceRow {
  id: string;
  permit_type: string;
  description: string;
  frequency_basis: string;
  estimated_cost: string | null;
  disclaimer: string | null;
  applies_to: string[];
  business_categories: string[];
  government_portal_url: string | null;
  government_portal_name: string | null;
}

export function useLegalReferences(filterByBusinessType?: BusinessType | null) {
  return useQuery({
    queryKey: ['legal_references', filterByBusinessType ?? 'all'],
    queryFn: async (): Promise<LegalReferenceRow[]> => {
      // casting due to stale generated types — see audit follow-up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = (supabase as any).from('legal_references').select('*');
      if (filterByBusinessType) {
        query = query.contains('business_categories', [filterByBusinessType]);
      }
      const { data, error } = await query.order('permit_type');
      if (error) throw new Error(error.message);
      return (data as unknown as LegalReferenceRow[]) ?? [];
    },
    staleTime: 30 * 60 * 1000,
  });
}
