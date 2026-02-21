
import { type NextRequest, NextResponse } from 'next/server';
import { head } from '@vercel/blob';

/**
 * API Route to proxy Vercel Blob files.
 * Supports a 'download' query parameter to force browser download.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const isDownload = searchParams.get('download') === 'true';

  if (!url) {
    return NextResponse.json({ error: 'Missing blob URL' }, { status: 400 });
  }

  try {
    const metadata = await head(url);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }

    const filename = metadata.pathname.split('/').pop() || 'document.pdf';
    const disposition = isDownload ? 'attachment' : 'inline';

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': metadata.contentType || 'application/pdf',
        'Content-Length': metadata.size.toString(),
        'Content-Disposition': `${disposition}; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error: any) {
    console.error('Blob proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
