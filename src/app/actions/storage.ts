
'use server';

import { put } from '@vercel/blob';

/**
 * Server action to upload a file to Vercel Blob with public access.
 * Uses the institutional BLOB_READ_WRITE_TOKEN provided for secure synchronization.
 */
export async function uploadToBlob(formData: FormData) {
  const file = formData.get('file') as File;
  const path = formData.get('path') as string;
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!file) {
    throw new Error('No file provided for upload.');
  }

  if (!path) {
    throw new Error('Target path is required for upload.');
  }

  if (!token) {
    console.error('Storage Error: BLOB_READ_WRITE_TOKEN is missing from environment.');
    throw new Error('Storage provider is not configured. Please check environment variables.');
  }

  try {
    const blob = await put(path, file, {
      access: 'public',
      addRandomSuffix: true,
      token: token,
    });

    return blob.url;
  } catch (error: any) {
    console.error('Vercel Blob Upload Failure:', {
      message: error.message,
      path: path,
    });

    if (error.message.includes('Unexpected respond') || error.message.includes('401')) {
      throw new Error('Authentication failed with the storage provider. Check your token scope.');
    }

    throw new Error(error.message || 'An unexpected error occurred during file upload.');
  }
}
