
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
    console.error('Upload Error: No file provided in FormData.');
    throw new Error('No file provided for upload.');
  }

  if (!path) {
    console.error('Upload Error: No path provided in FormData.');
    throw new Error('Target path is required for upload.');
  }

  try {
    // Check if the token is available in the environment
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('Configuration Error: BLOB_READ_WRITE_TOKEN is not defined in the environment.');
      throw new Error('Storage service is not configured. Please check environment variables.');
    }

    // Switched to 'public' access as per the institutional storage requirements.
    // The token is automatically read from the BLOB_READ_WRITE_TOKEN environment variable.
    const blob = await put(path, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return blob.url;
  } catch (error: any) {
    // Log the specific error for debugging in the server console
    console.error('Vercel Blob Upload Failure:', {
      message: error.message,
      name: error.name,
      path: path,
      fileSize: file.size,
    });

    // Provide a more descriptive error message to the client
    if (error.message.includes('Unexpected respond')) {
      throw new Error('Storage provider returned an error. This usually indicates an invalid token or a temporary service issue.');
    }

    throw new Error(error.message || 'An unexpected error occurred during the file upload.');
  }
}
