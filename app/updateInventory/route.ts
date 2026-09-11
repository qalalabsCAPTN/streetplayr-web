import { NextResponse } from 'next/server';
import { uniwareChannelApiKeyOk } from '@/src/integrations/unicommerce/channel-auth';
import { applySkuQuantities, parseUniwareInventoryPush } from '@/lib/inventory/apply-sku-quantity';
import { UnicommerceLogger } from '@/src/integrations/unicommerce/logging';

export async function POST(request: Request) {
  const apiKey =
    request.headers.get('apiKey') ||
    request.headers.get('apikey') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
    '';

  if (!uniwareChannelApiKeyOk(apiKey)) {
    await UnicommerceLogger.warn(
      'channel.update_inventory_unauthorized',
      'Uniware /updateInventory rejected: missing or invalid apiKey'
    );
    return NextResponse.json({ status: 'FAILED', failedProductList: [] }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: 'FAILED', failedProductList: [{ productId: '', variantId: '', message: 'Malformed JSON' }] },
      { status: 400 }
    );
  }

  const updates = parseUniwareInventoryPush(body);
  const result = await applySkuQuantities(updates);

  await UnicommerceLogger.info(
    'channel.update_inventory',
    `Uniware channel inventory push: ${result.written} written, ${result.failed.length} failed`,
    'inventory',
    result
  );

  if (result.written > 0) {
    const { revalidateStorefrontInventory } = await import('@/lib/inventory/revalidate-storefront');
    revalidateStorefrontInventory(result.changedSlugs);
  }

  const failedProductList = result.failed.map((row) => ({
    productId: row.sku,
    variantId: row.sku,
    message: row.message,
  }));

  const status =
    result.failed.length === 0 ? 'SUCCESS' : result.written > 0 ? 'PARTIAL_SUCCESS' : 'FAILED';

  return NextResponse.json({ status, failedProductList });
}
