import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BusinessType } from '@/lib/domain/business-types';

export interface Company {
  id: string;
  name: string;
  business_type: BusinessType;
  city: string | null;
  ruc: string | null;
}

export function useCompany(companyId: string | null | undefined) {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async (): Promise<Company | null> => {
      if (!companyId) return null;
      // casting due to stale generated types — see audit follow-up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('companies')
        .select('id, name, business_type, city, ruc')
        .eq('id', companyId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Company | null;
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000, // 10 min
  });
}
