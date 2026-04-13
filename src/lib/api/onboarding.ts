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
  const companyData: CompanyInsert = {
    name: data.company.name,
    business_type: data.company.business_type,
    city: data.company.city,
    location_count: data.locations.length,
    regulatory_factors: data.regulatory_factors as any,
  };

  const companyResult: any = await supabase
    .from('companies')
    .insert(companyData as any)
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

    const locationResult: any = await supabase
      .from('locations')
      .insert(locationData as any)
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
