import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BusinessType } from '@/lib/domain/business-types';

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended';

export interface Company {
  id: string;
  name: string;
  business_type: BusinessType;
  city: string | null;
  ruc: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
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
        .select('id, name, business_type, city, ruc, subscription_status, trial_ends_at')
        .eq('id', companyId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Company | null;
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

/**
 * Estado efectivo: trial -> expired si paso trial_ends_at
 */
export function getEffectiveStatus(company: Company | null | undefined): SubscriptionStatus | null {
  if (!company) return null;
  if (company.subscription_status === 'active') return 'active';
  if (company.subscription_status === 'suspended') return 'suspended';
  if (company.subscription_status === 'expired') return 'expired';
  if (company.subscription_status === 'trial') {
    if (!company.trial_ends_at) return 'trial';
    return new Date(company.trial_ends_at) > new Date() ? 'trial' : 'expired';
  }
  return 'expired';
}

export function getDaysLeftInTrial(company: Company | null | undefined): number | null {
  if (!company || company.subscription_status !== 'trial' || !company.trial_ends_at) return null;
  const ms = new Date(company.trial_ends_at).getTime() - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
