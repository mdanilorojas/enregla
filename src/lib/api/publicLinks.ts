import { supabase } from '../supabase';
import type { PublicLink } from '@/types/database';

export interface CreatePublicLinkData {
  companyId: string;
  locationId?: string | null;
  label: string;
}

/**
 * Create a new public verification link
 */
export async function createPublicLink(data: CreatePublicLinkData): Promise<PublicLink> {
  // Generate unique token
  const token = crypto.randomUUID();

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('Error getting user:', userError);
  }

  // Insert into database
  const query = supabase.from('public_links') as any;
  const { data: link, error } = await query
    .insert({
      company_id: data.companyId,
      location_id: data.locationId || null,
      token,
      label: data.label,
      is_active: true,
      view_count: 0,
      created_by: user?.id || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear el link público: ${error.message}`);
  }

  return link;
}

/**
 * Get all public links for a company
 */
export async function getCompanyPublicLinks(companyId: string): Promise<PublicLink[]> {
  const { data, error } = await supabase
    .from('public_links')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error al obtener links públicos: ${error.message}`);
  }

  return data || [];
}

/**
 * Get public link for a specific location
 */
export async function getLocationPublicLink(locationId: string): Promise<PublicLink | null> {
  const { data, error } = await supabase
    .from('public_links')
    .select('*')
    .eq('location_id', locationId)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Error al obtener link público: ${error.message}`);
  }

  return data;
}

/**
 * Deactivate a public link
 */
export async function deactivatePublicLink(linkId: string): Promise<void> {
  const { error } = await (supabase
    .from('public_links') as any)
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', linkId);

  if (error) {
    throw new Error(`Error al desactivar el link: ${error.message}`);
  }
}

/**
 * Generate the full public URL for a token
 */
export function getPublicUrl(token: string): string {
  // In production, this would be https://enregla.ec/p/{token}
  // For development, use the current origin
  const baseUrl = import.meta.env.PROD
    ? 'https://enregla.ec'
    : window.location.origin;

  return `${baseUrl}/p/${token}`;
}

export interface PublicLinkData {
  location: {
    id: string;
    name: string;
    address: string;
  };
  permits: Array<{
    id: string;
    type: string;
    issuer: string | null;
    status: 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado';
    issue_date: string | null;
    expiry_date: string | null;
    has_document: boolean;
    document_url: string | null;
  }>;
}

/**
 * Get public link data by token for the public verification page
 * Increments view analytics and returns location with permits
 */
export async function getPublicLinkData(token: string): Promise<PublicLinkData | null> {
  // Fetch public link by token
  const { data: link, error: linkError } = await (supabase
    .from('public_links') as any)
    .select('id, location_id, is_active')
    .eq('token', token)
    .single();

  if (linkError || !link || !link.is_active || !link.location_id) {
    return null;
  }

  // Increment view analytics - get current view_count first
  const { data: currentLink } = await (supabase
    .from('public_links') as any)
    .select('view_count')
    .eq('id', link.id)
    .single();

  const { error: updateError } = await (supabase
    .from('public_links') as any)
    .update({
      view_count: (currentLink?.view_count || 0) + 1,
      last_viewed_at: new Date().toISOString(),
    })
    .eq('id', link.id);

  if (updateError) {
    console.error('Error updating view analytics:', updateError);
  }

  // Fetch location data
  const { data: location, error: locationError } = await (supabase
    .from('locations') as any)
    .select('id, name, address')
    .eq('id', link.location_id)
    .single();

  if (locationError || !location) {
    return null;
  }

  // Fetch permits for the location
  const { data: permits, error: permitsError } = await (supabase
    .from('permits') as any)
    .select(`
      id,
      type,
      issuer,
      status,
      issue_date,
      expiry_date,
      documents(id, file_path)
    `)
    .eq('location_id', link.location_id)
    .eq('is_active', true);

  if (permitsError) {
    throw permitsError;
  }

  // Transform permits with document URLs
  const transformedPermits = (permits || []).map((p: any) => ({
    id: p.id,
    type: p.type,
    issuer: p.issuer,
    status: p.status as 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_registrado',
    issue_date: p.issue_date,
    expiry_date: p.expiry_date,
    has_document: p.documents && p.documents.length > 0,
    document_url: p.documents?.[0]
      ? supabase.storage.from('permit-documents').getPublicUrl(p.documents[0].file_path).data.publicUrl
      : null,
  }));

  return {
    location: {
      id: location.id,
      name: location.name,
      address: location.address,
    },
    permits: transformedPermits,
  };
}
