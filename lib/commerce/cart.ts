import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { CartItem } from '@/store/cartStore';

/**
 * Cart Domain Logic — checkpoint-based syncing.
 *
 * SoT (source of truth) for cart *line identity*: `product_variants.id` (UUID).
 * Client Zustand cart is authoritative for guests; DB sync is best-effort and
 * adapts to live schema:
 *   - CRM: `carts` (customer_id/session_id) + `cart_items.cart_id` + `variant_id`
 *   - Legacy app migrations: `cart_items.user_id` + product_id TEXT
 * Never invent `handle|size` line ids. If schema is unknown/unsafe, skip sync
 * without throwing so the storefront cart still works locally.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ORG_ID = '00000000-0000-0000-0000-000000000001';
const BRAND_ID = 'e56b72a5-3746-4c01-a054-885ed3e55c0f';

export type CartSchemaKind = 'crm' | 'legacy' | 'unknown';

export type CartSyncResult = {
  success: boolean;
  skipped?: boolean;
  schema?: CartSchemaKind;
  reason?: string;
  error?: unknown;
};

function dedupeItems(items: CartItem[]): CartItem[] {
  return items.reduce((acc, current) => {
    const x = acc.find((item) => item.id === current.id);
    if (!x) return acc.concat([current]);
    x.quantity += current.quantity;
    return acc;
  }, [] as CartItem[]);
}

/** Only sync lines whose id is a real variant UUID (skip local/demo slug-size ids). */
function uuidLines(items: CartItem[]): CartItem[] {
  return items.filter((i) => UUID_RE.test(i.id));
}

let _cachedSchema: CartSchemaKind | null = null;

/**
 * Detect live cart_items shape via PostgREST column probes (no migrations required).
 */
export async function detectCartSchema(
  force = false
): Promise<CartSchemaKind> {
  if (!force && _cachedSchema) return _cachedSchema;

  try {
    const admin = createAdminClient();

    const crm = await admin.from('cart_items').select('cart_id, variant_id').limit(1);
    if (!crm.error) {
      _cachedSchema = 'crm';
      return 'crm';
    }

    const legacy = await admin.from('cart_items').select('user_id, product_id').limit(1);
    if (!legacy.error) {
      _cachedSchema = 'legacy';
      return 'legacy';
    }
  } catch (e) {
    console.warn('[CartService] schema probe failed:', e);
  }

  _cachedSchema = 'unknown';
  return 'unknown';
}

async function resolveCustomerId(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email?: string | null
): Promise<string | null> {
  if (!email) return null;

  const { data: existing } = await admin
    .from('customers')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();

  const name = (profile?.full_name as string | undefined)?.split(' ') ?? ['', ''];
  const { data: created } = await admin
    .from('customers')
    .insert({
      organization_id: ORG_ID,
      brand_id: BRAND_ID,
      email,
      first_name: name[0] ?? '',
      last_name: name.slice(1).join(' ') ?? '',
    })
    .select('id')
    .single();

  return created?.id ?? null;
}

async function syncCrmCart(
  userId: string,
  items: CartItem[],
  email?: string | null
): Promise<CartSyncResult> {
  const admin = createAdminClient();
  const customerId = await resolveCustomerId(admin, userId, email);
  if (!customerId) {
    return {
      success: true,
      skipped: true,
      schema: 'crm',
      reason: 'no_customer — guest/local cart only',
    };
  }

  const uniqueItems = uuidLines(dedupeItems(items));

  let { data: cart } = await admin
    .from('carts')
    .select('id')
    .eq('customer_id', customerId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cart) {
    const { data: created, error: createErr } = await admin
      .from('carts')
      .insert({
        organization_id: ORG_ID,
        brand_id: BRAND_ID,
        customer_id: customerId,
        status: 'active',
        item_count: 0,
        subtotal: 0,
        currency: 'INR',
        metadata: { source: 'streetplayr', auth_user_id: userId },
      })
      .select('id')
      .single();

    if (createErr || !created) {
      console.warn('[CartService] CRM cart create skipped:', createErr?.message);
      return {
        success: true,
        skipped: true,
        schema: 'crm',
        reason: createErr?.message ?? 'cart_create_failed',
      };
    }
    cart = created;
  }

  await admin.from('cart_items').delete().eq('cart_id', cart.id);

  if (uniqueItems.length > 0) {
    const rows = uniqueItems.map((item) => ({
      cart_id: cart!.id,
      variant_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      currency: 'INR',
    }));

    const { error } = await admin.from('cart_items').insert(rows);
    if (error) {
      console.warn('[CartService] CRM cart_items insert skipped:', error.message);
      return {
        success: true,
        skipped: true,
        schema: 'crm',
        reason: error.message,
      };
    }
  }

  const subtotal = uniqueItems.reduce((s, i) => s + i.price * i.quantity, 0);
  await admin
    .from('carts')
    .update({
      item_count: uniqueItems.reduce((n, i) => n + i.quantity, 0),
      subtotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cart.id);

  return { success: true, schema: 'crm' };
}

async function syncLegacyCart(
  userId: string,
  items: CartItem[]
): Promise<CartSyncResult> {
  const supabase = await createClient();
  const uniqueItems = dedupeItems(items);

  await supabase.from('cart_items').delete().eq('user_id', userId);

  if (uniqueItems.length > 0) {
    const toInsert = uniqueItems.map((item) => ({
      user_id: userId,
      product_id: item.productId,
      variant_id: item.id,
      quantity: item.quantity,
      metadata: {
        color: item.color,
        size: item.size,
        name: item.name,
        price: item.price,
        image: item.image,
        variantId: item.id,
      },
    }));

    const { error } = await supabase.from('cart_items').insert(toInsert);
    if (error) {
      console.warn('[CartService] legacy cart insert skipped:', error.message);
      return {
        success: true,
        skipped: true,
        schema: 'legacy',
        reason: error.message,
      };
    }
  }

  return { success: true, schema: 'legacy' };
}

async function getCrmCart(
  userId: string,
  email?: string | null
): Promise<CartItem[]> {
  const admin = createAdminClient();
  const customerId = await resolveCustomerId(admin, userId, email);
  if (!customerId) return [];

  const { data: cart } = await admin
    .from('carts')
    .select('id')
    .eq('customer_id', customerId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cart) return [];

  const { data: rows, error } = await admin
    .from('cart_items')
    .select(
      `
      quantity,
      unit_price,
      variant_id,
      product_variants (
        id,
        title,
        price,
        attributes,
        product_id,
        products ( title, featured_image_url )
      )
    `
    )
    .eq('cart_id', cart.id);

  if (error || !rows) {
    if (error) console.warn('[CartService] CRM getCart soft-fail:', error.message);
    return [];
  }

  return rows
    .filter((row: any) => row.variant_id && UUID_RE.test(row.variant_id))
    .map((row: any) => {
      const pv = Array.isArray(row.product_variants)
        ? row.product_variants[0]
        : row.product_variants;
      const product = Array.isArray(pv?.products) ? pv.products[0] : pv?.products;
      const attrs = pv?.attributes ?? {};
      return {
        id: row.variant_id as string,
        productId: (pv?.product_id as string) || row.variant_id,
        name: (product?.title as string) || (pv?.title as string) || 'Product',
        price: Number(row.unit_price ?? pv?.price ?? 0),
        quantity: Number(row.quantity) || 1,
        color: (attrs.color as string) || 'default',
        size: (attrs.size as string) || (pv?.title as string) || '',
        image: (product?.featured_image_url as string) || '',
      } satisfies CartItem;
    });
}

async function getLegacyCart(userId: string): Promise<CartItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId);

  if (error || !data) return [];

  return data.map((item: any) => ({
    id:
      item.metadata?.variantId ||
      item.variant_id ||
      `${item.product_id}-${item.metadata?.color ?? 'default'}-${item.metadata?.size ?? ''}`,
    productId: item.product_id,
    name: item.metadata?.name ?? 'Product',
    price: Number(item.metadata?.price ?? 0),
    quantity: item.quantity,
    color: item.metadata?.color ?? 'default',
    size: item.metadata?.size ?? '',
    image: item.metadata?.image ?? '',
  }));
}

export const CartService = {
  detectCartSchema,

  /**
   * Syncs the local cart to the database (checkpoint).
   * Guests / unknown schema → soft skip (success, no throw).
   */
  async syncCart(
    userId: string,
    items: CartItem[],
    email?: string | null
  ): Promise<CartSyncResult> {
    try {
      const schema = await detectCartSchema();

      if (schema === 'crm') {
        return await syncCrmCart(userId, items, email);
      }
      if (schema === 'legacy') {
        return await syncLegacyCart(userId, items);
      }

      console.warn(
        '[CartService] Unknown cart_items schema — skipping DB sync (Zustand remains SoT for line state).'
      );
      return {
        success: true,
        skipped: true,
        schema: 'unknown',
        reason: 'schema_unknown',
      };
    } catch (error) {
      console.error('Cart sync error (soft):', error);
      return { success: true, skipped: true, error, reason: 'exception' };
    }
  },

  /**
   * Pulls the cart from DB (e.g. after login). Empty on schema miss / guest.
   */
  async getCart(userId: string, email?: string | null): Promise<CartItem[]> {
    try {
      const schema = await detectCartSchema();
      if (schema === 'crm') return await getCrmCart(userId, email);
      if (schema === 'legacy') return await getLegacyCart(userId);
      return [];
    } catch (e) {
      console.error('CartService.getCart error:', e);
      return [];
    }
  },
};
