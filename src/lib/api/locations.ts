import { supabase } from '../supabase';
import type { Location } from '@/types/database';

/**
 * Fetch all locations for a company
 */
export async function getCompanyLocations(companyId: string): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Fetch a single location by ID
 */
export async function getLocation(locationId: string): Promise<Location | null> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data;
}

/**
 * Update location risk level
 */
export async function updateLocationRisk(
  locationId: string,
  riskLevel: Location['risk_level']
): Promise<Location> {
  const query = supabase.from('locations') as any;
  const { data, error } = await query
    .update({
      risk_level: riskLevel,
      updated_at: new Date().toISOString(),
    })
    .eq('id', locationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
