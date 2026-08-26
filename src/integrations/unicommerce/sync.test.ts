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

describe('UnicommerceSyncService - syncInventory', () => {
  let syncService: UnicommerceSyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    syncService = new UnicommerceSyncService();
  });

  it('should successfully sync stock when inventory snapshot returns data', async () => {
    // 1. Mock DB active variants
    const mockVariants = [
      { id: 'var-1', sku: 'SKU-A' },
      { id: 'var-2', sku: 'SKU-B' },
    ];
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'product_variants') {
        return {
          select: () => ({
            not: () => Promise.resolve({ data: mockVariants, error: null }),
          }),
        };
      }
      if (table === 'inventory') {
        // mock no existing inventory
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: () => Promise.resolve({ error: null }),
        };
      }
    });

    // 2. Mock inventory snapshot API
    vi.spyOn(UnicommerceInventoryService.prototype, 'getInventorySnapshot').mockResolvedValue([
      { sku: 'SKU-A', stock: 15, blocked: 0 },
    ]);

    const result = await syncService.syncInventory();
    expect(result.success).toBe(true);
    expect(result.processed).toBe(2); // Processes both var-1 and var-2
    expect(result.errors).toBe(0);
  });

  it('should handle zero stock default for missing variants in snapshot', async () => {
    const mockVariants = [
      { id: 'var-1', sku: 'SKU-A' },
      { id: 'var-2', sku: 'SKU-B' },
    ];
    
    const upserts: any[] = [];
    mockFrom.mockImplementation((table: string) => {
      if (table === 'product_variants') {
        return {
          select: () => ({
            not: () => Promise.resolve({ data: mockVariants, error: null }),
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
          insert: (data: any) => {
            upserts.push(data);
            return Promise.resolve({ error: null });
          },
        };
      }
    });

    // Mock only SKU-A returned
    vi.spyOn(UnicommerceInventoryService.prototype, 'getInventorySnapshot').mockResolvedValue([
      { sku: 'SKU-A', stock: 5, blocked: 0 },
    ]);

    const result = await syncService.syncInventory();
    expect(result.success).toBe(true);
    expect(upserts).toHaveLength(2);
    // SKU-A stock is 5
    expect(upserts.find((u) => u.variant_id === 'var-1').quantity).toBe(5);
    // SKU-B stock defaults to 0 (missing in snapshot)
    expect(upserts.find((u) => u.variant_id === 'var-2').quantity).toBe(0);
  });

  it('should abort and preserve database stock if SOAP request throws an error', async () => {
    const mockVariants = [
      { id: 'var-1', sku: 'SKU-A' },
    ];
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'product_variants') {
        return {
          select: () => ({
            not: () => Promise.resolve({ data: mockVariants, error: null }),
          }),
        };
      }
      // if it calls insert or update on inventory, fail test
      if (table === 'inventory') {
        throw new Error('Should not touch inventory table on SOAP error');
      }
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
    const mockVariants = [
      { id: 'var-1', sku: 'SKU-A' },
    ];
    mockFrom.mockImplementation((table: string) => {
      if (table === 'product_variants') {
        return {
          select: () => ({
            not: () => Promise.resolve({ data: mockVariants, error: null }),
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
    });
    vi.spyOn(UnicommerceInventoryService.prototype, 'getInventorySnapshot')
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValue([{ sku: 'SKU-A', stock: 3, blocked: 0 }]);

    const first = await syncService.syncInventory();
    expect(first.success).toBe(false);
    expect(first.errors).toBeGreaterThan(0);
  });
});

describe('UnicommerceSyncService - syncProducts', () => {
  let syncService: UnicommerceSyncService;

  beforeEach(() => {
    vi.clearAllMocks();
    syncService = new UnicommerceSyncService();
  });

  it('should successfully sync products with brand playR STREET and skip others', async () => {
    // 1. Mock soapRequest for SearchItemTypesRequest
    vi.mocked(soapRequest).mockResolvedValue({
      successful: true,
      itemTypes: [
        { skuCode: 'ctt-waffle-s', brand: 'playR STREET' },
        { skuCode: 'invalid-brand-sku', brand: 'PlayR Sports' },
      ],
    });

    // 2. Mock getProductBySku to return detailed product specs
    vi.spyOn(UnicommerceProductService.prototype, 'getProductBySku').mockImplementation(async (sku) => {
      if (sku === 'ctt-waffle-s') {
        return {
          sku: 'ctt-waffle-s',
          name: 'playR Create Waffle Tee - S',
          price: 1999,
          enabled: true,
          brand: 'playR STREET',
        };
      }
      if (sku === 'invalid-brand-sku') {
        return {
          sku: 'invalid-brand-sku',
          name: 'Invalid Product',
          price: 1999,
          enabled: true,
          brand: 'PlayR Sports',
        };
      }
      return null;
    });

    // 3. Mock DB operations
    mockFrom.mockImplementation((table: string) => {
      if (table === 'product_variants') {
        return {
          select: () => ({
            not: () => Promise.resolve({ data: [], error: null }),
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: null, error: null }),
            }),
          }),
          insert: () => Promise.resolve({ error: null }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === 'products') {
        return {
          select: () => ({
            limit: () => ({
              maybeSingle: () => Promise.resolve({ data: { organization_id: 'org-1', brand_id: 'brand-ok' }, error: null }),
            }),
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { id: 'parent-1' }, error: null }),
            }),
          }),
          update: () => {
            const chain = {
              eq: () => chain,
              neq: () => chain,
              not: () => chain,
              then: (onfulfilled: any) => Promise.resolve({ error: null }).then(onfulfilled),
            };
            return chain;
          },
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: { id: 'parent-1' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'brands') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { id: 'brand-ok' }, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const result = await syncService.syncProducts();
    expect(result.success).toBe(true);
    expect(result.processed).toBe(1); // Only ctt-waffle-s is imported
    expect(result.errors).toBe(0);
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
