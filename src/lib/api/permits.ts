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
 * Fetch all versions of a permit (history)
 * Returns array sorted by version DESC (newest first)
 */
export async function getPermitHistory(permitId: string): Promise<Permit[]> {
  // First get the current permit to find its type and location
  const currentPermit = await getPermit(permitId);
  if (!currentPermit) return [];
  if (!currentPermit.location_id) return [currentPermit];

  // Get all permits with same type and location (all versions)
  const { data, error } = await supabase
    .from('permits')
    .select('*')
    .eq('type', currentPermit.type)
    .eq('location_id', currentPermit.location_id)
    .order('version', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update permit status
 */
export async function updatePermitStatus(
  permitId: string,
  status: Permit['status']
): Promise<Permit> {
  // casting due to stale generated types — see audit follow-up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 * Update permit with partial data
 */
export async function updatePermit(
  permitId: string,
  updates: Partial<Permit>
): Promise<Permit> {
  // casting due to stale generated types — see audit follow-up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = supabase.from('permits') as any;
  const { data, error } = await query
    .update({
      ...updates,
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
  // Llamada atómica a la RPC renew_permit que inserta la nueva versión +
  // archiva la anterior en una sola transacción y además registra el evento.
  // Antes teníamos 3 operaciones sueltas que podían dejar el estado inconsistente
  // si fallaba la segunda o tercera (ver audit 2026-05-13 · P-5).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newPermitId, error: rpcError } = await (supabase as any).rpc('renew_permit', {
    p_old_permit_id: permitId,
    p_permit_number: data.permit_number,
    p_issue_date: data.issue_date,
    p_expiry_date: data.expiry_date,
    p_issuer: data.issuer || null,
    p_notes: data.notes,
  });

  if (rpcError) {
    throw new Error(`No se pudo renovar el permiso: ${rpcError.message}`);
  }

  const createdPermit = await getPermit(newPermitId as string);
  if (!createdPermit) {
    throw new Error('Renovación creada pero no se pudo leer el nuevo permiso');
  }

  // Upload del documento es post-hoc: si falla, el permit renovado queda
  // sin documento pero la renovación en sí es consistente.
  if (data.document) {
    try {
      await uploadPermitDocument(createdPermit.id, data.document);
    } catch (uploadError) {
      console.error('Error uploading document:', uploadError);
    }
  }

  return createdPermit;
}
