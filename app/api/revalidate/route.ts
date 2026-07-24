import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isApiError, requireOpsApi } from '@/lib/auth/api-guard';

/**
 * On-demand Cache Revalidation Endpoint
 * Requires ops auth OR REVALIDATE_SECRET header.
 */
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.REVALIDATE_SECRET;
    const provided = req.headers.get('x-revalidate-secret');

    if (secret && provided === secret) {
      // CI / CMS webhook with shared secret
    } else {
      const auth = await requireOpsApi();
      if (isApiError(auth)) return auth;
    }

    const body = await req.json().catch(() => ({}));
    const path = body.path;

    if (!path || typeof path !== 'string' || !path.startsWith('/')) {
      return NextResponse.json(
        { error: 'Missing or invalid path parameter' },
        { status: 400 }
      );
    }

    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Cache Revalidation] Error:', err.message);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
