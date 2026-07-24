import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnicommerceSyncService } from './sync';
import { UnicommerceInventoryService } from './inventory';

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

// Mock Supabase admin client
const mockFrom = vi.fn();
vi.mock('C:/Users/pc/Desktop/streetplayr - open code/lib/supabase/admin', () => ({
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
});
