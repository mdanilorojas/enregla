import { supabase } from '../supabase';
import type { Permit } from '@/types/database';

/**
 * Fetch all active permits for a company
 */
export async function getCompanyPermits(companyId: string): Promise<Permit[]> {
  const { data, error } = await supabase
    .from('permits')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('expiry_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch all active permits for a specific location
 */
export async function getLocationPermits(locationId: string): Promise<Permit[]> {
  const { data, error } = await supabase
    .from('permits')
    .select('*')
    .eq('location_id', locationId)
    .eq('is_active', true)
    .order('type', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single permit by ID
 */
export async function getPermit(permitId: string): Promise<Permit | null> {
  const { data, error } = await supabase
    .from('permits')
    .select('*')
    .eq('id', permitId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

/**
 * Update permit status
 */
export async function updatePermitStatus(
  permitId: string,
  status: Permit['status']
): Promise<Permit> {
  const query = supabase.from('permits') as any;
  const { data, error } = await query
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', permitId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
