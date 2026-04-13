import { supabase } from '../supabase';
import type { Permit } from '@/types/database';
import { uploadPermitDocument } from './documents';

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

/**
 * Renew a permit - creates a new version and archives the old one
 */
export interface RenewPermitData {
  permit_number: string;
  issue_date: string;
  expiry_date: string;
  issuer: string;
  notes: string | null;
  document?: File | null;
}

export async function renewPermit(
  permitId: string,
  data: RenewPermitData
): Promise<Permit> {
  // 1. Get the old permit
  const oldPermit = await getPermit(permitId);
  if (!oldPermit) {
    throw new Error('Permiso no encontrado');
  }

  // 2. Create new version (INSERT)
  const newPermitData = {
    company_id: oldPermit.company_id,
    location_id: oldPermit.location_id,
    type: oldPermit.type,
    status: 'vigente' as const,
    permit_number: data.permit_number,
    issue_date: data.issue_date,
    expiry_date: data.expiry_date,
    issuer: data.issuer || oldPermit.issuer,
    notes: data.notes,
    is_active: true,
    version: oldPermit.version + 1,
    superseded_by: null,
    archived_at: null,
  };

  const insertQuery = supabase.from('permits') as any;
  const { data: createdPermit, error: createError } = await insertQuery
    .insert(newPermitData)
    .select()
    .single();

  if (createError) {
    throw new Error(`Error al crear el nuevo permiso: ${createError.message}`);
  }

  // 3. Archive old permit (UPDATE)
  const updateQuery = supabase.from('permits') as any;
  const { error: updateError } = await updateQuery
    .update({
      is_active: false,
      superseded_by: createdPermit.id,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', permitId);

  if (updateError) {
    // Rollback: delete the newly created permit
    const deleteQuery = supabase.from('permits') as any;
    await deleteQuery.delete().eq('id', createdPermit.id);
    throw new Error(`Error al archivar el permiso anterior: ${updateError.message}`);
  }

  // 4. Upload document if provided
  if (data.document) {
    try {
      await uploadPermitDocument(createdPermit.id, data.document);
    } catch (uploadError) {
      // Document upload failed, but permit renewal succeeded
      // Log the error but don't fail the entire operation
      console.error('Error uploading document:', uploadError);
      // You could optionally show a warning to the user that the document failed to upload
    }
  }

  return createdPermit;
}
