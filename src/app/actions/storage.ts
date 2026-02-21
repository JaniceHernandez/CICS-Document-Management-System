
'use server';

import { put } from '@vercel/blob';

/**
 * Server action to upload a file to Vercel Blob with public access.
 * @param formData The form data containing the file and the intended path/name.
 * @returns The public URL of the uploaded blob.
 */
export async function uploadToBlob(formData: FormData) {
  const file = formData.get('file') as File;
  const path = formData.get('path') as string;

  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // Switched to 'public' access as per the new storage configuration.
  // The token is automatically read from the BLOB_READ_WRITE_TOKEN environment variable.
  const blob = await put(path, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  return blob.url;
}
