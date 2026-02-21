
'use server';

import { put } from '@vercel/blob';

/**
 * Server action to upload a file to Vercel Blob.
 * This function runs on the server, ensuring the BLOB_READ_WRITE_TOKEN is not exposed to the client.
 * @param formData The form data containing the file and the intended path/name.
 * @returns The public URL of the uploaded blob.
 */
export async function uploadToBlob(formData: FormData) {
  const file = formData.get('file') as File;
  const path = formData.get('path') as string;

  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // We use access: 'public' so students can download the academic documents via the generated URL.
  // The 'put' function automatically uses the BLOB_READ_WRITE_TOKEN from environment variables.
  const blob = await put(path, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  return blob.url;
}
