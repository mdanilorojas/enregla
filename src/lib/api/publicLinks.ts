import { supabase } from '../supabase';
import type { PublicLink } from '@/types/database';

const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes

export interface CreatePublicLinkData {
  companyId: string;
  locationId?: string | null;
  label: string;
}

/**
 * Create a new public verification link
 */
export async function createPublicLink(data: CreatePublicLinkData): Promise<PublicLink> {
  const token = crypto.randomUUID();

  const { data: { user } } = await supabase.auth.getUser();

  // casting due to stale generated types — see audit follow-up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export async function getLocationPublicLink(locationId: string): Promise<PublicLink | null> {
  const { data, error } = await supabase
    .from('public_links')
    .select('*')
    .eq('location_id', locationId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al obtener link público: ${error.message}`);
  }

  return data;
}

export async function deactivatePublicLink(linkId: string): Promise<void> {
  const { error } = await (supabase
    // casting due to stale generated types — see audit follow-up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 * Get public link data by token for the public verification page.
 *
 * Uses a single nested select + async view-count increment (fire-and-forget)
 * to minimize round-trips. Document URLs are short-lived signed URLs, not
 * forever-valid public URLs — this is the revocation-safe path post-audit.
 */
export async function getPublicLinkData(token: string): Promise<PublicLinkData | null> {
  const { data: link, error: linkError } = await (supabase
    // casting due to stale generated types — see audit follow-up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('public_links') as any)
    .select(`
      id,
      location_id,
      is_active,
      expires_at,
      location:locations!inner(id, name, address)
    `)
    .eq('token', token)
    .eq('is_active', true)
    .maybeSingle();

  if (linkError || !link || !link.location_id || !link.location) {
    return null;
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    return null;
  }

  // Fire-and-forget analytics — do not block render on the counter update
  // casting due to stale generated types — see audit follow-up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase.rpc as any)('increment_public_link_view', { link_token: token }).then(
    ({ error }: { error: { message: string } | null }) => {
      if (error && import.meta.env.DEV) {
        console.error('increment_public_link_view failed:', error.message);
      }
    }
  );

  const { data: permits, error: permitsError } = await (supabase
    // casting due to stale generated types — see audit follow-up
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from('permits') as any)
    .select('id, type, issuer, status, issue_date, expiry_date, documents(id, file_path)')
    .eq('location_id', link.location_id)
    .eq('is_active', true);

  if (permitsError) {
    throw permitsError;
  }

  // Resolve signed URLs in parallel for permits that have a document
  // casting due to stale generated types — see audit follow-up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const permitDocs: Array<{ p: any; doc: { id: string; file_path: string | null } | null }> =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (permits || []).map((p: any) => ({ p, doc: p.documents?.[0] ?? null }));

  const signedUrls = await Promise.all(
    permitDocs.map(async ({ doc }) => {
      if (!doc?.file_path) return null;
      const { data, error } = await supabase.storage
        .from('permit-documents')
        .createSignedUrl(doc.file_path, SIGNED_URL_TTL_SECONDS);
      if (error) {
        if (import.meta.env.DEV) console.error('createSignedUrl failed:', error.message);
        return null;
      }
      return data?.signedUrl ?? null;
    })
  );

  const transformedPermits = permitDocs.map(({ p, doc }, i: number) => ({
    id: p.id,
    type: p.type,
    issuer: p.issuer,
    status: p.status,
    issue_date: p.issue_date,
    expiry_date: p.expiry_date,
    has_document: !!doc,
    document_url: signedUrls[i],
  }));

  return {
    location: {
      id: link.location.id,
      name: link.location.name,
      address: link.location.address,
    },
    permits: transformedPermits,
  };
}
