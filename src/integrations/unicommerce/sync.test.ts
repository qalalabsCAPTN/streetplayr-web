import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnicommerceSyncService } from './sync';
import { UnicommerceInventoryService } from './inventory';
import { UnicommerceProductService } from './products';
import { soapRequest } from './soapClient';

// Mock config
vi.mock('./config', () => ({
  getUnicommerceConfig: () => ({
    apiUrl: 'https://playr.unicommerce.com',
    username: 'testuser',
    password: 'testpassword',
    facilityCode: 'playR_Delhi',
    clientId: 'my-client',
    transportMode: 'SOAP',
    isDemoMode: false,
  }),
}));

// Mock logger
vi.mock('./logging', () => ({
  UnicommerceLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn((action, msg, err) => console.error(`LOGGER ERROR [${action}]: ${msg}`, err)),
  },
}));

// Mock soapClient
vi.mock('./soapClient', () => ({
  soapRequest: vi.fn(),
}));

// Mock Supabase admin client
const mockFrom = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: mockFrom,
  }),
}));

function queryChain(maybeSingleData: unknown, listData: unknown[] = []) {
  const q: Record<string, unknown> = {};
  const self = () => q;
  q.select = self;
  q.eq = self;
  q.neq = self;
  q.not = self;
  q.in = self;
  q.limit = self;
  q.order = self;
  q.update = self;
  q.insert = () => q;
  q.maybeSingle = () => Promise.resolve({ data: maybeSingleData, error: null });
  q.single = () => Promise.resolve({ data: maybeSingleData, error: null });
  q.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data: listData, error: null }).then(resolve);
  return q;
}

function inventoryFrom(mockVariants: { id: string; sku: string }[], inventoryTable?: Record<string, unknown>) {
  return (table: string) => {
    if (table === 'brands') {
      return queryChain({ id: 'brand-ok' });
    }
    if (table === 'products') {
      return queryChain(null, [{ id: 'p1', metadata: { brand: 'playR STREET' } }]);
    }
    if (table === 'product_variants') {
      return queryChain(null, mockVariants);
    }
    if (table === 'inventory') {
      return inventoryTable ?? queryChain(null);
    }
    return queryChain(null);
  };
}

function productSyncFrom() {
  return (table: string) => {
    if (table === 'brands') {
      return queryChain({ id: 'brand-ok' });
    }
    if (table === 'products') {
      const q = queryChain(
        { id: 'parent-1', organization_id: 'org-1', featured_image_url: '/x.jpg', metadata: { brand: 'playR STREET' } },
        []
      );
      q.insert = () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'parent-1' }, error: null }),
        }),
      });
      return q;
    }
    if (table === 'product_variants') {
      const q = queryChain(null);
      q.insert = () => Promise.resolve({ error: null });
      return q;
    }
    return queryChain(null);
  };
}

describe('UnicommerceSyncService - syncInventory', () => {
  let syncService: UnicommerceSyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    syncService = new UnicommerceSyncService();
  });

  it('should successfully sync stock when inventory snapshot returns data', async () => {
    const mockVariants = [
      { id: 'var-1', sku: 'SKU-A' },
      { id: 'var-2', sku: 'SKU-B' },
    ];

    mockFrom.mockImplementation(
      inventoryFrom(mockVariants, {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        insert: () => Promise.resolve({ error: null }),
      })
    );

    // 2. Mock inventory snapshot API
    vi.spyOn(UnicommerceInventoryService.prototype, 'getInventorySnapshot').mockResolvedValue([
      { sku: 'SKU-A', stock: 15, blocked: 0 },
    ]);

    const result = await syncService.syncInventory();
    expect(result.success).toBe(true);
    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
  });

  it('preserves last known stock when a SKU is missing from a successful snapshot', async () => {
    const mockVariants = [
      { id: 'var-1', sku: 'SKU-A' },
      { id: 'var-2', sku: 'SKU-B' },
    ];

    const writes: any[] = [];
    mockFrom.mockImplementation(
      inventoryFrom(mockVariants, {
        select: () => ({
          eq: (_col: string, variantId: string) => ({
            maybeSingle: () =>
              Promise.resolve({
                data: variantId === 'var-2' ? { id: 'inv-b', quantity: 40 } : null,
                error: null,
              }),
          }),
        }),
        insert: (data: any) => {
          writes.push({ op: 'insert', data });
          return Promise.resolve({ error: null });
        },
        update: (data: any) => {
          writes.push({ op: 'update', data });
          return { eq: () => Promise.resolve({ error: null }) };
        },
      })
    );

    vi.spyOn(UnicommerceInventoryService.prototype, 'getInventorySnapshot').mockResolvedValue([
      { sku: 'SKU-A', stock: 5, blocked: 0 },
    ]);

    const result = await syncService.syncInventory();
    expect(result.success).toBe(true);
    expect(writes).toHaveLength(1);
    expect(writes[0].data.quantity).toBe(5);
    expect(writes.some((w) => w.data.quantity === 0)).toBe(false);
  });

  it('writes explicit zero-stock from UniCommerce as sold out', async () => {
    const mockVariants = [{ id: 'var-1', sku: 'SKU-A' }];
    const inserts: any[] = [];
    mockFrom.mockImplementation(
      inventoryFrom(mockVariants, {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        insert: (data: any) => {
          inserts.push(data);
          return Promise.resolve({ error: null });
        },
      })
    );
    vi.spyOn(UnicommerceInventoryService.prototype, 'getInventorySnapshot').mockResolvedValue([
      { sku: 'SKU-A', stock: 0, blocked: 0 },
    ]);
    const result = await syncService.syncInventory();
    expect(result.success).toBe(true);
    expect(inserts[0].quantity).toBe(0);
  });

  it('does not touch inventory when snapshot is empty', async () => {
    const mockVariants = [{ id: 'var-1', sku: 'SKU-A' }];
    mockFrom.mockImplementation((table: string) => {
      if (table === 'inventory') {
        throw new Error('Should not touch inventory table on empty snapshot');
      }
      return inventoryFrom(mockVariants)(table);
    });
    vi.spyOn(UnicommerceInventoryService.prototype, 'getInventorySnapshot').mockResolvedValue([]);
    const result = await syncService.syncInventory();
    expect(result.success).toBe(true);
    expect(result.processed).toBe(0);
  });

  it('should abort and preserve database stock if SOAP request throws an error', async () => {
    const mockVariants = [
      { id: 'var-1', sku: 'SKU-A' },
    ];
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'inventory') {
        throw new Error('Should not touch inventory table on SOAP error');
      }
      return inventoryFrom(mockVariants)(table);
    });

    // Mock SOAP request error
    vi.spyOn(UnicommerceInventoryService.prototype, 'getInventorySnapshot').mockRejectedValue(
      new Error('SOAP Connection Refused')
    );

    const result = await syncService.syncInventory();
    expect(result.success).toBe(false);
    expect(result.processed).toBe(0);
  });

  it('leaves failed snapshot chunks unchanged and still updates successful chunks', async () => {
    const mockVariants = Array.from({ length: 51 }, (_, i) => ({
      id: `var-${i}`,
      sku: `SKU-${i}`,
    }));
    const inserts: any[] = [];
    mockFrom.mockImplementation(
      inventoryFrom(mockVariants, {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
        insert: (data: any) => {
          inserts.push(data);
          return Promise.resolve({ error: null });
        },
      })
    );
    vi.spyOn(UnicommerceInventoryService.prototype, 'getInventorySnapshot')
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue([{ sku: 'SKU-50', stock: 9, blocked: 0 }]);

    const result = await syncService.syncInventory();
    expect(result.errors).toBeGreaterThan(0);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].variant_id).toBe('var-50');
    expect(inserts[0].quantity).toBe(9);
  });

  it('does not inventory-sync products whose metadata.brand is not playR STREET', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'brands') return queryChain({ id: 'brand-ok' });
      if (table === 'products') {
        return queryChain(null, [
          { id: 'p-street', metadata: { brand: 'playR STREET' } },
          { id: 'p-adidas', metadata: { brand: 'Adidas' } },
        ]);
      }
      if (table === 'product_variants') {
        return {
          select: () => ({
            in: (_col: string, ids: string[]) => {
              expect(ids).toEqual(['p-street']);
              return {
                not: () => Promise.resolve({ data: [{ id: 'var-1', sku: 'SKU-A' }], error: null }),
              };
            },
          }),
        };
      }
      if (table === 'inventory') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: () => Promise.resolve({ error: null }),
        };
      }
      return queryChain(null);
    });
    vi.spyOn(UnicommerceInventoryService.prototype, 'getInventorySnapshot').mockResolvedValue([
      { sku: 'SKU-A', stock: 3, blocked: 0 },
    ]);
    const result = await syncService.syncInventory();
    expect(result.processed).toBe(1);
  });
});

describe('UnicommerceSyncService - syncProducts', () => {
  let syncService: UnicommerceSyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    syncService = new UnicommerceSyncService();
  });

  it('imports only playR STREET and never fetches Brand B or Brand C SKUs', async () => {
    vi.mocked(soapRequest).mockResolvedValue({
      successful: true,
      itemTypes: [
        { skuCode: 'street-tee-s', brand: 'playR STREET' },
        { skuCode: 'adidas-sku', brand: 'Adidas' },
        { skuCode: 'playr-jersey', brand: 'playR' },
      ],
    });

    const getBySku = vi
      .spyOn(UnicommerceProductService.prototype, 'getProductBySku')
      .mockImplementation(async (sku) => {
        if (sku === 'street-tee-s') {
          return {
            sku: 'street-tee-s',
            name: 'StreetPlayR Tee - S',
            price: 1999,
            enabled: true,
            brand: 'playR STREET',
          };
        }
        throw new Error(`GetItemType must not run for other-brand SKU ${sku}`);
      });

    mockFrom.mockImplementation(productSyncFrom());

    const result = await syncService.syncProducts();
    expect(result.success).toBe(true);
    expect(result.processed).toBe(1);
    expect(result.unicommerceReceived).toBe(3);
    expect(result.streetplayrReceived).toBe(1);
    expect(result.skippedOtherBrands).toBe(2);
    expect(getBySku.mock.calls.map((c) => c[0])).toEqual(['street-tee-s']);
  });

  it('paginates SearchItemTypes then brand-filters the combined catalog', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      skuCode: `adidas-${i}`,
      brand: 'Adidas',
    }));
    const page2 = [
      { skuCode: 'street-tee-s', brand: 'playR STREET' },
      { skuCode: 'playr-jersey', brand: 'playR' },
    ];
    vi.mocked(soapRequest)
      .mockResolvedValueOnce({ successful: true, itemTypes: page1 })
      .mockResolvedValueOnce({ successful: true, itemTypes: page2 });

    vi.spyOn(UnicommerceProductService.prototype, 'getProductBySku').mockResolvedValue({
      sku: 'street-tee-s',
      name: 'StreetPlayR Tee - S',
      price: 1999,
      enabled: true,
      brand: 'playR STREET',
    });

    mockFrom.mockImplementation(productSyncFrom());

    const result = await syncService.syncProducts();
    expect(result.unicommerceReceived).toBe(102);
    expect(result.streetplayrReceived).toBe(1);
    expect(result.skippedOtherBrands).toBe(101);
    expect(result.processed).toBe(1);
    expect(soapRequest).toHaveBeenCalledTimes(2);
  });

  it('maps UniCommerce SKU PS-TEE-CRT-WHT-2XL to a 2XL variant and does not skip it', async () => {
    const variantInserts: unknown[] = [];
    vi.mocked(soapRequest).mockResolvedValue({
      successful: true,
      itemTypes: [{ skuCode: 'PS-TEE-CRT-WHT-2XL', brand: 'playR STREET' }],
    });
    vi.spyOn(UnicommerceProductService.prototype, 'getProductBySku').mockResolvedValue({
      sku: 'PS-TEE-CRT-WHT-2XL',
      name: 'StreetPlayR Tee - 2XL',
      price: 1999,
      enabled: true,
      brand: 'playR STREET',
      color: 'White',
      size: '2XL',
      ean: '8905570041953',
    });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'product_variants') {
        const q = queryChain(null);
        q.insert = (row: unknown) => {
          variantInserts.push(row);
          return Promise.resolve({ error: null });
        };
        return q;
      }
      return productSyncFrom()(table);
    });

    const result = await syncService.syncProducts();
    expect(result.processed).toBe(1);
    expect(result.errors).toBe(0);
    expect(variantInserts[0]).toMatchObject({
      sku: 'PS-TEE-CRT-WHT-2XL',
      title: '2XL',
      attributes: { color: 'White', size: '2XL', ean: '8905570041953' },
    });
  });

  it('should abort sync and modify nothing if brand record does not exist', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'brands') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          limit: () => ({
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      };
    });

    const result = await syncService.syncProducts();
    expect(result.success).toBe(false);
    expect(result.processed).toBe(0);
    expect(result.errors).toBe(0);
  });
});
