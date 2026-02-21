import { type NextRequest, NextResponse } from 'next/server';
import { head } from '@vercel/blob';

/**
 * API Route to proxy private Vercel Blob files.
 * This allows the client to access private blobs using the server's token.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing blob URL' }, { status: 400 });
  }

  try {
    // Get metadata to set correct headers
    const metadata = await head(url);

    // Fetch the actual content from the private URL
    // We must pass the token in the headers for private access
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blob from Vercel: ${response.statusText}`);
    }

    // Proxy the stream to the client
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': metadata.contentType || 'application/pdf',
        'Content-Length': metadata.size.toString(),
        'Content-Disposition': `inline; filename="${encodeURIComponent(metadata.pathname.split('/').pop() || 'document.pdf')}"`,
      },
    });
  } catch (error: any) {
    console.error('Blob proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
