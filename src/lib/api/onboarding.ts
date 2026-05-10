import { supabase } from '../supabase';
import type { Database } from '@/types/database';

// Types for onboarding data
// NOTA (2026-05-07): regulatory_factors eliminado en Ola 12 del audit DB.
// Los permits se crean automaticamente via trigger DB segun companies.business_type.
export interface OnboardingData {
  company: {
    name: string;
    ruc: string;
    city: string;
    business_type: string;
  };
  locations: Array<{
    name: string;
    address: string;
    status: 'operando' | 'en_preparacion' | 'cerrado';
  }>;
}

type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type CompanyRow = Database['public']['Tables']['companies']['Row'];
type LocationInsert = Database['public']['Tables']['locations']['Insert'];

/**
 * Completes the onboarding process:
 * 1. Creates company
 * 2. Creates locations
 * 3. Auto-generates permits per location
 * 4. Updates user's profile with company_id
 */
export async function completeOnboarding(
  userId: string,
  data: OnboardingData
): Promise<string> {
  // 1. Create company
  // NOTA: regulatory_factors fue eliminado del schema en Ola 12.
  // business_type define los permits via permit_requirements.
  const companyData: CompanyInsert = {
    name: data.company.name,
    ruc: data.company.ruc,
    business_type: data.company.business_type,
    city: data.company.city,
    location_count: data.locations.length,
  };

  // casting due to stale generated types — see audit follow-up
  const companyResult = await (supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('companies') as any)
    .insert(companyData)
    .select()
    .single();

  if (companyResult.error) throw companyResult.error;
  if (!companyResult.data) throw new Error('Failed to create company');

  const company: CompanyRow = companyResult.data;

  // 2. Create locations
  const locationPromises = data.locations.map(async (loc) => {
    const locationData: LocationInsert = {
      company_id: company.id,
      name: loc.name,
      address: loc.address,
      status: loc.status,
      risk_level: 'medio', // Initial risk level
    };

    // casting due to stale generated types — see audit follow-up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const locationResult: any = await (supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from('locations') as any)
      .insert(locationData)
      .select()
      .single();

    if (locationResult.error) throw locationResult.error;
    if (!locationResult.data) throw new Error('Failed to create location');

    return locationResult.data;
  });

  await Promise.all(locationPromises);

  // Los triggers DB hacen el resto automaticamente:
  // - auto_create_location_permits: genera permits por location segun companies.business_type
  // - companies_auto_assign_to_profile: asigna company_id al profile del user autenticado
  //
  // El parametro userId queda sin usar pero se mantiene en la firma para
  // no romper callers del wizard legacy.
  void userId;

  return company.id;
}

/**
 * Updates user profile
 */
export async function updateProfile(
  userId: string,
  updates: { company_id?: string; full_name?: string; role?: 'admin' | 'operator' | 'viewer' }
): Promise<void> {
  // casting due to stale generated types — see audit follow-up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (result.error) throw result.error;
}

/**
 * Step 1: Save user's full name to profile
 */
export async function saveProfile(
  userId: string,
  fullName: string
): Promise<void> {
  const { error } = await (supabase
    // casting due to stale generated types — see audit follow-up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('profiles') as any)
    .update({
      full_name: fullName,
      role: 'admin', // Default role for first user
    })
    .eq('id', userId);

  if (error) throw error;
}

/**
 * Step 2: Create company and link to user profile
 */
export async function saveCompany(
  _userId: string,
  companyData: {
    name: string;
    ruc: string;
    city: string;
    business_type: string;
  }
): Promise<string> {
  // _userId queda como parametro para no romper callers; el trigger
  // auto_assign_company_to_profile asigna el company_id al profile
  // automaticamente usando auth.uid() en DB.
  // Validate RUC
  if (!/^\d{13}$/.test(companyData.ruc)) {
    throw new Error('RUC debe tener exactamente 13 dígitos numéricos');
  }

  // 1. Create company
  // NOTA: El trigger companies_auto_assign_to_profile asigna company_id
  // al profile automaticamente. No hacer UPDATE manual.
  const companyInsert: CompanyInsert = {
    name: companyData.name,
    ruc: companyData.ruc,
    city: companyData.city,
    business_type: companyData.business_type,
    location_count: 0,
  };

  const { data: company, error: companyError } = await (supabase
    // casting due to stale generated types — see audit follow-up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('companies') as any)
    .insert(companyInsert)
    .select()
    .single();

  if (companyError) throw companyError;
  if (!company) throw new Error('Failed to create company');

  return company.id;
}

/**
 * Step 3: Save single location. Los permits se crean automaticamente via
 * trigger DB auto_create_location_permits basado en companies.business_type
 * + permit_requirements. No se crean permits desde el cliente.
 */
export async function saveLocationWithPermits(
  companyId: string,
  locationData: {
    name: string;
    address: string;
    status: 'operando' | 'en_preparacion' | 'cerrado';
  }
): Promise<string> {
  const locationInsert: LocationInsert = {
    company_id: companyId,
    name: locationData.name,
    address: locationData.address,
    status: locationData.status,
    risk_level: 'medio',
  };

  const { data: location, error: locationError } = await (supabase
    // casting due to stale generated types — see audit follow-up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('locations') as any)
    .insert(locationInsert)
    .select()
    .single();

  if (locationError) throw locationError;
  if (!location) throw new Error('Failed to create location');

  return location.id;
}

/**
 * Check if company has any locations
 */
export async function checkHasLocations(
  companyId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('locations')
    .select('id')
    .eq('company_id', companyId)
    .limit(1);

  if (error) throw error;
  return (data?.length ?? 0) > 0;
}
