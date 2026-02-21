
import { type NextRequest, NextResponse } from 'next/server';
import { head } from '@vercel/blob';

/**
 * API Route to proxy Vercel Blob files.
 * Even for public blobs, this allows us to set custom headers like Content-Disposition
 * to ensure files download with their original names.
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

    // Fetch the content. Since it's public, we don't strictly need the token 
    // for simple GET, but we use it to maintain the same secure pattern.
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
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
