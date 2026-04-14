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
