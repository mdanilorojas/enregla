import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Issuer {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  scope: 'nacional' | 'municipal';
  city: string | null;
  portal_url: string | null;
  procedures_portal_url: string | null;
  contact_url: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  logo_url: string | null;
}

export function useIssuers() {
  return useQuery({
    queryKey: ['permit_issuers'],
    queryFn: async (): Promise<Issuer[]> => {
      // casting due to stale generated types — see audit follow-up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('permit_issuers')
        .select('*')
        .order('short_name');
      if (error) throw new Error(error.message);
      return (data as unknown as Issuer[]) ?? [];
    },
    staleTime: 60 * 60 * 1000, // 1h
  });
}

export function useIssuer(issuerId: string | null | undefined): Issuer | null {
  const { data: issuers } = useIssuers();
  if (!issuerId) return null;
  return issuers?.find(i => i.id === issuerId) ?? null;
}
