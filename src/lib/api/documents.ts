import { supabase } from '../supabase';

/**
 * Upload a document file for a permit to Supabase Storage
 */
export async function uploadPermitDocument(permitId: string, file: File): Promise<string> {
  console.log('[uploadPermitDocument] Starting upload:', { permitId, fileName: file.name, fileSize: file.size });

  // Generate unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${permitId}-${Date.now()}.${fileExt}`;
  const filePath = `permits/${permitId}/${fileName}`;

  console.log('[uploadPermitDocument] Generated path:', filePath);

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('permit-documents')
    .upload(filePath, file);

  if (uploadError) {
    console.error('[uploadPermitDocument] Storage upload error:', uploadError);
    throw new Error(`Error al subir el archivo: ${uploadError.message}`);
  }

  console.log('[uploadPermitDocument] Storage upload successful:', uploadData);

  // Get current user (may be null in demo mode)
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    // Expected in demo mode - just continue with null user
  }

  // Create document record in database
  const documentData = {
    permit_id: permitId,
    file_path: filePath,
    file_name: file.name,
    file_size: file.size,
    file_type: file.type,
    uploaded_by: user?.id || null,
  };

  console.log('[uploadPermitDocument] Inserting document record:', documentData);

  const query = supabase.from('documents') as any;
  const { data: insertData, error: dbError } = await query
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

  console.log('[uploadPermitDocument] Database insert successful:', insertData);

  // Update permit status to 'vigente' if it's currently 'no_registrado'
  const { data: permitData } = await supabase
    .from('permits')
    .select('status')
    .eq('id', permitId)
    .single();

  if (permitData?.status === 'no_registrado') {
    console.log('[uploadPermitDocument] Updating permit status to vigente');
    const { error: updateError } = await supabase
      .from('permits')
      .update({ status: 'vigente' })
      .eq('id', permitId);

    if (updateError) {
      console.error('[uploadPermitDocument] Failed to update permit status:', updateError);
      // Don't throw - document was uploaded successfully, this is just a status update
    }
  }

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
  // Get permit_id before deleting
  const { data: docData } = await supabase
    .from('documents')
    .select('permit_id')
    .eq('id', documentId)
    .single();

  const permitId = docData?.permit_id;

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

  // If this was the last document for the permit, update status to 'no_registrado'
  if (permitId) {
    const { data: remainingDocs } = await supabase
      .from('documents')
      .select('id')
      .eq('permit_id', permitId);

    if (!remainingDocs || remainingDocs.length === 0) {
      console.log('[deleteDocument] No documents remaining, updating permit status to no_registrado');
      const { error: updateError } = await supabase
        .from('permits')
        .update({ status: 'no_registrado' })
        .eq('id', permitId);

      if (updateError) {
        console.error('[deleteDocument] Failed to update permit status:', updateError);
        // Don't throw - document was deleted successfully
      }
    }
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

/**
 * Get all documents for a company (joined via permits)
 */
export async function getCompanyDocuments(companyId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      permits!inner (
        id,
        type,
        status,
        company_id,
        location_id,
        expiry_date
      )
    `)
    .eq('permits.company_id', companyId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    throw new Error(`Error al obtener documentos de la empresa: ${error.message}`);
  }

  return data || [];
}
