import { supabase } from './supabase';

/**
 * Upload a file to Supabase Storage
 * @param bucket - The storage bucket name (e.g., 'documents', 'avatars')
 * @param file - The file to upload
 * @param path - Optional path within the bucket (e.g., 'user-123/document.pdf')
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(
  bucket: string,
  file: File,
  path?: string
): Promise<string> {
  const fileName = path || `${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  bucket: string,
  files: File[],
  pathPrefix?: string
): Promise<string[]> {
  const uploadPromises = files.map((file) => {
    const path = pathPrefix ? `${pathPrefix}/${file.name}` : undefined;
    return uploadFile(bucket, file, path);
  });

  return Promise.all(uploadPromises);
}

/**
 * Download a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 * @returns Blob of the file
 */
export async function downloadFile(
  bucket: string,
  path: string
): Promise<Blob> {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error) throw error;
  return data;
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/**
 * Delete multiple files
 */
export async function deleteFiles(
  bucket: string,
  paths: string[]
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
}

/**
 * List files in a bucket
 * @param bucket - The storage bucket name
 * @param path - Optional folder path
 */
export async function listFiles(bucket: string, path?: string) {
  const { data, error } = await supabase.storage.from(bucket).list(path, {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
  });

  if (error) throw error;
  return data;
}

/**
 * Get public URL for a file
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 */
export function getPublicUrl(bucket: string, path: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

/**
 * Create a signed URL for private files (expires after a set time)
 * @param bucket - The storage bucket name
 * @param path - The file path in the bucket
 * @param expiresIn - Expiration time in seconds (default: 60)
 */
export async function createSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 60
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}
