
import { NextResponse } from 'next/server';

/**
 * API Route Placeholder for Static Export.
 * Dynamic runtime proxies are not supported in 'output: export' mode.
 * This route is maintained as a static placeholder to satisfy build requirements.
 */
export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json(
    { error: 'Institutional proxy not available in static export mode. Direct blob access is required.' },
    { status: 404 }
  );
}
