import { NextRequest, NextResponse } from 'next/server';
import { UnicommerceService } from '@/src/integrations/unicommerce';
import { UnicommerceWebhookService } from '@/src/integrations/unicommerce/webhooks';

export async function POST(request: Request) {
  try {
    // 1. Read raw body as text for signature verification
    const rawBody = await request.text();

    // 2. Fetch signature and timestamp from headers
    const signature = 
      request.headers.get('x-unicommerce-signature') || 
      request.headers.get('x-webhook-signature') || 
      request.headers.get('x-signature') || 
      '';

    const timestamp =
      request.headers.get('x-timestamp') ||
      request.headers.get('x-webhook-timestamp');

    // 3. Verify signature authenticity with replay protection
    const isValid = UnicommerceWebhookService.verifySignature(rawBody, signature, timestamp);

    if (!isValid) {
      await UnicommerceService.logger.warn(
        'webhooks.signature_invalid',
        'Incoming Unicommerce webhook signature verification failed',
        'webhook'
      );
      return NextResponse.json(
        { error: 'Invalid signature verification' },
        { status: 401 }
      );
    }

    // 4. Parse the payload
    let eventData;
    try {
      eventData = JSON.parse(rawBody);
    } catch (e) {
      await UnicommerceService.logger.error(
        'webhooks.json_parse_error',
        'Failed to parse webhook JSON payload',
        e,
        'webhook'
      );
      return NextResponse.json(
        { error: 'Malformed JSON payload' },
        { status: 400 }
      );
    }

    // 5. Delegate processing to the webhook service
    const webhookService = new UnicommerceWebhookService();
    await webhookService.processWebhook(eventData);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    await UnicommerceService.logger.error(
      'webhooks.route_error',
      'Exception caught in Unicommerce webhook handler route',
      err,
      'webhook'
    );
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
