import { supabase } from '../supabase';

const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes

/** Allowed file extensions for uploaded documents (must match bucket MIME allowlist). */
const ALLOWED_EXTS = new Set(['pdf', 'png', 'jpg', 'jpeg']);

/** Sanitize a filename extension to a safe alphanumeric string. */
function sanitizeExt(raw: string | undefined): string {
  const lower = (raw ?? '').toLowerCase();
  if (!/^[a-z0-9]{1,5}$/.test(lower)) return 'bin';
  return ALLOWED_EXTS.has(lower) ? lower : 'bin';
}

/**
 * Upload a document file for a permit to Supabase Storage
 */
export async function uploadPermitDocument(permitId: string, file: File): Promise<string> {
  // Generate unique file name — UUID, not Date.now(), to prevent enumeration
  const fileExt = sanitizeExt(file.name.split('.').pop());
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `permits/${permitId}/${fileName}`;

  // console.log('[uploadPermitDocument] Generated path:', filePath);

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('permit-documents')
    .upload(filePath, file);

  if (uploadError) {
    console.error('[uploadPermitDocument] Storage upload error:', uploadError);
    throw new Error(`Error al subir el archivo: ${uploadError.message}`);
  }

  // console.log('[uploadPermitDocument] Storage upload successful');

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('[uploadPermitDocument] Error getting user:', userError);
  }

  // console.log('[uploadPermitDocument] Current user:', user?.id);

  // Sanitize file_name for storage: strip control chars + path separators, cap length
  const safeFileName = file.name
    // eslint-disable-next-line no-control-regex
    .replace(/[\r\n\x00-\x1f\x7f/\\]/g, '')
    .slice(0, 255) || 'document';

  // Create document record in database
  const documentData = {
    permit_id: permitId,
    file_path: filePath,
    file_name: safeFileName,
    file_size: file.size,
    file_type: file.type,
    uploaded_by: user?.id || null,
  };

  // console.log('[uploadPermitDocument] Inserting document record:', documentData);

  // casting due to stale generated types — see audit follow-up
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = supabase.from('documents') as any;
  const { error: dbError } = await query
    .insert(documentData)
    .select();

  if (dbError) {
    console.error('[uploadPermitDocument] Database insert error:', dbError);
    // Try to clean up the uploaded file if database insert fails
    await supabase.storage
      .from('permit-documents')
      .remove([filePath]);
    throw new Error(`Error al registrar el documento: ${dbError.message}`);
  }

  // console.log('[uploadPermitDocument] Database insert successful');

  return filePath;
}

/**
 * Get a short-lived signed URL for a document file.
 * Bucket is private; public URLs no longer work after the 2026-05-10 security fix.
 */
export async function getDocumentUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('permit-documents')
    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
  if (error) {
    console.error('[getDocumentUrl] createSignedUrl failed:', error.message);
    return null;
  }
  return data?.signedUrl ?? null;
}

/**
 * Delete a document file from storage and database
 */
export async function deleteDocument(documentId: string, filePath: string): Promise<void> {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('permit-documents')
    .remove([filePath]);

  if (storageError) {
    throw new Error(`Error al eliminar el archivo: ${storageError.message}`);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (dbError) {
    throw new Error(`Error al eliminar el registro: ${dbError.message}`);
  }
}

/**
 * Get all documents for a permit
 */
export async function getPermitDocuments(permitId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('permit_id', permitId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    throw new Error(`Error al obtener documentos: ${error.message}`);
  }

  return data || [];
}
