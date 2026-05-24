import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * On-demand Cache Revalidation Endpoint
 * PURGE next.js static cache dynamically for storefront pages when blocks are published.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const path = body.path;

    if (!path) {
      return NextResponse.json(
        { error: 'Missing path parameter in request body' },
        { status: 400 }
      );
    }

    // Perform atomic cache bust
    revalidatePath(path);
    console.log(`[Cache Revalidation] atomic bust triggered for: ${path}`);

    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Cache Revalidation] Error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
