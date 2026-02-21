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
    console.error('Storage Error: BLOB_READ_WRITE_TOKEN is missing from environment variables.');
    throw new Error('Storage provider is not configured. Please ensure BLOB_READ_WRITE_TOKEN is set.');
  }

  try {
    // We pass the token explicitly to the put function to ensure it uses the correct credential.
    const blob = await put(path, file, {
      access: 'public',
      addRandomSuffix: true,
      token: token,
    });

    return blob.url;
  } catch (error: any) {
    console.error('Vercel Blob Upload Failure Details:', {
      message: error.message,
      path: path,
      tokenExists: !!token,
    });

    if (error.message.includes('Unexpected respond') || error.message.includes('401') || error.message.includes('Forbidden')) {
      throw new Error('Authentication failed with the storage provider. Please verify your BLOB_READ_WRITE_TOKEN.');
    }

    throw new Error(error.message || 'An unexpected error occurred during file upload.');
  }
}
