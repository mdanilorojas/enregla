import { supabase } from '../supabase';
import type { Database } from '@/types/database';

// Types for onboarding data
export interface OnboardingData {
  company: {
    name: string;
    ruc: string;
    city: string;
    business_type: string;
  };
  regulatory_factors: {
    alimentos: boolean;
    alcohol: boolean;
    salud: boolean;
    quimicos: boolean;
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
type LocationRow = Database['public']['Tables']['locations']['Row'];
type PermitInsert = Database['public']['Tables']['permits']['Insert'];

// Permit types mapping based on regulatory factors
const PERMIT_TYPES = {
  always: [
    { type: 'Patente Municipal', issuer: 'Municipio' },
    { type: 'RUC', issuer: 'SRI' },
  ],
  alimentos: [
    { type: 'Permiso Sanitario (ARCSA)', issuer: 'ARCSA' },
  ],
  alcohol: [
    { type: 'Permiso de Alcohol (SCPM)', issuer: 'SCPM' },
  ],
  salud: [
    { type: 'Permiso de Salud (MSP)', issuer: 'MSP' },
  ],
  quimicos: [
    { type: 'Permiso Químicos (CONSEP)', issuer: 'CONSEP' },
  ],
};

/**
 * Generates initial permits for a location based on regulatory factors
 */
async function generateInitialPermits(
  companyId: string,
  locationId: string,
  regulatoryFactors: OnboardingData['regulatory_factors']
): Promise<void> {
  const permitsToCreate: PermitInsert[] = [];

  // Always create base permits
  PERMIT_TYPES.always.forEach(({ type, issuer }) => {
    permitsToCreate.push({
      company_id: companyId,
      location_id: locationId,
      type,
      issuer,
      status: 'no_registrado',
      is_active: true,
      version: 1,
    });
  });

  // Add permits based on regulatory factors
  if (regulatoryFactors.alimentos) {
    PERMIT_TYPES.alimentos.forEach(({ type, issuer }) => {
      permitsToCreate.push({
        company_id: companyId,
        location_id: locationId,
        type,
        issuer,
        status: 'no_registrado',
        is_active: true,
        version: 1,
      });
    });
  }

  if (regulatoryFactors.alcohol) {
    PERMIT_TYPES.alcohol.forEach(({ type, issuer }) => {
      permitsToCreate.push({
        company_id: companyId,
        location_id: locationId,
        type,
        issuer,
        status: 'no_registrado',
        is_active: true,
        version: 1,
      });
    });
  }

  if (regulatoryFactors.salud) {
    PERMIT_TYPES.salud.forEach(({ type, issuer }) => {
      permitsToCreate.push({
        company_id: companyId,
        location_id: locationId,
        type,
        issuer,
        status: 'no_registrado',
        is_active: true,
        version: 1,
      });
    });
  }

  if (regulatoryFactors.quimicos) {
    PERMIT_TYPES.quimicos.forEach(({ type, issuer }) => {
      permitsToCreate.push({
        company_id: companyId,
        location_id: locationId,
        type,
        issuer,
        status: 'no_registrado',
        is_active: true,
        version: 1,
      });
    });
  }

  // Insert all permits
  const { error } = await supabase
    .from('permits')
    .insert(permitsToCreate as any);

  if (error) throw error;
}

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

  const companyResult = await (supabase
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

    const locationResult: any = await (supabase
      .from('locations') as any)
      .insert(locationData)
      .select()
      .single();

    if (locationResult.error) throw locationResult.error;
    if (!locationResult.data) throw new Error('Failed to create location');

    return locationResult.data;
  });

  const locations: LocationRow[] = await Promise.all(locationPromises);

  // 3. Auto-generate permits for each location
  const permitPromises = locations.map((location: LocationRow) =>
    generateInitialPermits(company.id, location.id, data.regulatory_factors)
  );

  await Promise.all(permitPromises);

  // 4. Update user's profile with company_id
  const profileResult: any = await (supabase as any)
    .from('profiles')
    .update({ company_id: company.id })
    .eq('id', userId);

  if (profileResult.error) throw profileResult.error;

  return company.id;
}

/**
 * Updates user profile
 */
export async function updateProfile(
  userId: string,
  updates: { company_id?: string; full_name?: string; role?: 'admin' | 'operator' | 'viewer' }
): Promise<void> {
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
    .from('companies') as any)
    .insert(companyInsert)
    .select()
    .single();

  if (companyError) throw companyError;
  if (!company) throw new Error('Failed to create company');

  return company.id;
}

/**
 * Step 3: Save single location and auto-generate permits based on regulatory factors
 */
export async function saveLocationWithPermits(
  companyId: string,
  locationData: {
    name: string;
    address: string;
    status: 'operando' | 'en_preparacion' | 'cerrado';
    regulatory: {
      alimentos: boolean;
      alcohol: boolean;
      salud: boolean;
      quimicos: boolean;
    };
  }
): Promise<string> {
  // 1. Create location
  const locationInsert: LocationInsert = {
    company_id: companyId,
    name: locationData.name,
    address: locationData.address,
    status: locationData.status,
    risk_level: 'medio',
  };

  const { data: location, error: locationError } = await (supabase
    .from('locations') as any)
    .insert(locationInsert)
    .select()
    .single();

  if (locationError) throw locationError;
  if (!location) throw new Error('Failed to create location');

  // 2. Generate permits using existing helper
  try {
    await generateInitialPermits(companyId, location.id, locationData.regulatory);
  } catch (error) {
    // Rollback: delete the location if permit creation failed
    await supabase.from('locations').delete().eq('id', location.id);
    throw error;
  }

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
