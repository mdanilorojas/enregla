import { useState } from 'react';
import { uploadFile, uploadFiles } from '../../lib/storage';

interface FileUploadProps {
  bucket: string;
  multiple?: boolean;
  accept?: string;
  onSuccess?: (urls: string[]) => void;
}

export function FileUpload({
  bucket,
  multiple = false,
  accept,
  onSuccess,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      let urls: string[];

      if (multiple) {
        urls = await uploadFiles(bucket, Array.from(files));
      } else {
        const url = await uploadFile(bucket, files[0]);
        urls = [url];
      }

      setUploadedUrls(urls);
      onSuccess?.(urls);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file(s)');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg
              className="w-8 h-8 mb-2 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500">
              {accept || 'Any file type'}
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            multiple={multiple}
            accept={accept}
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && (
        <div className="text-center text-sm text-gray-600">
          Uploading...
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {uploadedUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-600">
            Successfully uploaded:
          </p>
          <ul className="space-y-1">
            {uploadedUrls.map((url, index) => (
              <li key={index} className="text-xs text-gray-600 truncate">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
