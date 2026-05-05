import { supabase } from '../supabase';

/**
 * Upload a document file for a permit to Supabase Storage
 */
export async function uploadPermitDocument(permitId: string, file: File): Promise<string> {
  // console.log('[uploadPermitDocument] Starting upload:', { permitId, fileName: file.name, fileSize: file.size });

  // Generate unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${permitId}-${Date.now()}.${fileExt}`;
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

  // Create document record in database
  const documentData = {
    permit_id: permitId,
    file_path: filePath,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type,
    uploaded_by: user?.id || null,
  };

  // console.log('[uploadPermitDocument] Inserting document record:', documentData);

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
 * Get the public URL for a document file
 */
export async function getDocumentUrl(filePath: string): Promise<string> {
  const { data } = supabase.storage
    .from('permit-documents')
    .getPublicUrl(filePath);

  return data.publicUrl;
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
