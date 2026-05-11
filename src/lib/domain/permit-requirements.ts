import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BusinessType } from './business-types';
import type { RequiredRole } from './permit-roles';

export interface PermitRequirement {
  id: string;
  business_type: BusinessType;
  permit_type: string;
  is_mandatory: boolean;
  issuer_id: string | null;
  required_role: RequiredRole;
  cost_min: number | null;
  cost_max: number | null;
  cost_currency: string | null;
  cost_notes: string | null;
  cost_updated_at: string | null;
  fine_min: number | null;
  fine_max: number | null;
  fine_source: string | null;
  applies_when: string | null;
}

export function usePermitRequirements(businessType?: BusinessType | null) {
  return useQuery({
    queryKey: ['permit_requirements', businessType ?? 'all'],
    queryFn: async (): Promise<PermitRequirement[]> => {
      // casting due to stale generated types — see audit follow-up
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = (supabase as any).from('permit_requirements').select('*');
      if (businessType) query = query.eq('business_type', businessType);
      const { data, error } = await query.order('permit_type');
      if (error) throw new Error(error.message);
      return (data as unknown as PermitRequirement[]) ?? [];
    },
    staleTime: 30 * 60 * 1000, // 30 min
  });
}

/** Lookup por tipo de permit + giro. Útil en PermitDetailView para traer costo y rol. */
export function useRequirementFor(permitType: string, businessType: BusinessType | null | undefined): PermitRequirement | null {
  const { data } = usePermitRequirements(businessType ?? undefined);
  return data?.find(r => r.permit_type === permitType) ?? null;
}
