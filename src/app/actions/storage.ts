
'use server';

import { put } from '@vercel/blob';

/**
 * Server action to upload a file to Vercel Blob.
 * @param formData The form data containing the file and the path.
 * @returns The URL of the uploaded blob.
 */
export async function uploadToBlob(formData: FormData) {
  const file = formData.get('file') as File;
  const path = formData.get('path') as string;

  if (!file) {
    throw new Error('No file provided');
  }

  // We use access: 'public' so students can download the documents via the generated URL.
  const blob = await put(path, file, {
    access: 'public',
    addRandomSuffix: true,
  });

  return blob.url;
}
