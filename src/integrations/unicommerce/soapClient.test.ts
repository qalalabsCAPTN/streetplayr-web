import { describe, it, expect, vi, beforeEach } from 'vitest';
import { soapRequest, getTagValue, getTagBlocks } from './soapClient';

// Mock getUnicommerceConfig to avoid throwing errors during testing
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

describe('SOAP Client Helpers', () => {
  describe('getTagValue', () => {
    it('should extract plain tag value', () => {
      const xml = '<ser:SkuCode>IK5737-M</ser:SkuCode>';
      expect(getTagValue(xml, 'SkuCode')).toBe('IK5737-M');
    });

    it('should extract tag value with attributes', () => {
      const xml = '<ser:SkuCode id="123">IK5737-M</ser:SkuCode>';
      expect(getTagValue(xml, 'SkuCode')).toBe('IK5737-M');
    });

    it('should handle missing tag', () => {
      const xml = '<ser:OtherTag>value</ser:OtherTag>';
      expect(getTagValue(xml, 'SkuCode')).toBe('');
    });

    it('should unwrap CDATA blocks', () => {
      const xml = '<ser:Description><![CDATA[Some Jersey Description]]></ser:Description>';
      expect(getTagValue(xml, 'Description')).toBe('Some Jersey Description');
    });
  });

  describe('getTagBlocks', () => {
    it('should extract multiple matching blocks', () => {
      const xml = `
        <ser:InventorySnapshot>
          <ser:ItemSKU>SKU-1</ser:ItemSKU>
        </ser:InventorySnapshot>
        <ser:InventorySnapshot>
          <ser:ItemSKU>SKU-2</ser:ItemSKU>
        </ser:InventorySnapshot>
      `;
      const blocks = getTagBlocks(xml, 'InventorySnapshot');
      expect(blocks.length).toBe(2);
      expect(getTagValue(blocks[0], 'ItemSKU')).toBe('SKU-1');
      expect(getTagValue(blocks[1], 'ItemSKU')).toBe('SKU-2');
    });
  });
});

describe('SOAP Client Request Translation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should parse GetItemTypeRequest successfully', async () => {
    const mockResponseXml = `
      <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
        <SOAP-ENV:Header/>
        <SOAP-ENV:Body>
          <GetItemTypeResponse xmlns="http://uniware.unicommerce.com/services/">
            <Successful>true</Successful>
            <SkuCode>IK5737-M</SkuCode>
            <CategoryCode>Jersey</CategoryCode>
            <Name>Fortore 3 Jersey</Name>
            <Description>Test Desc</Description>
            <MaxRetailPrice>1999.00</MaxRetailPrice>
            <Enabled>true</Enabled>
          </GetItemTypeResponse>
        </SOAP-ENV:Body>
      </SOAP-ENV:Envelope>
    `;

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => mockResponseXml,
    }));

    const result = await soapRequest<any>('GetItemTypeRequest', '<ser:SkuCode>IK5737-M</ser:SkuCode>');
    
    expect(result.successful).toBe(true);
    expect(result.itemTypeDTO).toBeDefined();
    expect(result.itemTypeDTO.skuCode).toBe('IK5737-M');
    expect(result.itemTypeDTO.name).toBe('Fortore 3 Jersey');
    expect(result.itemTypeDTO.basePrice).toBe(1999);
    expect(result.itemTypeDTO.enabled).toBe(true);
  });

  it('should parse GetInventorySnapshotRequest successfully', async () => {
    const mockResponseXml = `
      <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
        <SOAP-ENV:Body>
          <GetInventorySnapshotResponse xmlns="http://uniware.unicommerce.com/services/">
            <Successful>true</Successful>
            <InventorySnapshots>
              <InventorySnapshot>
                <ItemSKU>IK5737-M</ItemSKU>
                <PendingInventoryAssessment>5</PendingInventoryAssessment>
                <Inventory>45</Inventory>
              </InventorySnapshot>
            </InventorySnapshots>
          </GetInventorySnapshotResponse>
        </SOAP-ENV:Body>
      </SOAP-ENV:Envelope>
    `;

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => mockResponseXml,
    }));

    const result = await soapRequest<any>('GetInventorySnapshotRequest', '<ser:ItemSKU>IK5737-M</ser:ItemSKU>');
    
    expect(result.successful).toBe(true);
    expect(result.inventorySnapshots).toBeDefined();
    expect(result.inventorySnapshots.length).toBe(1);
    expect(result.inventorySnapshots[0].itemTypeSKU).toBe('IK5737-M');
    expect(result.inventorySnapshots[0].inventory).toBe(45);
    expect(result.inventorySnapshots[0].blocked).toBe(5);
  });

  it('should parse InventoryAdjustmentRequest successfully', async () => {
    const mockResponseXml = `
      <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
        <SOAP-ENV:Body>
          <InventoryAdjustmentResponse xmlns="http://uniware.unicommerce.com/services/">
            <Successful>true</Successful>
          </InventoryAdjustmentResponse>
        </SOAP-ENV:Body>
      </SOAP-ENV:Envelope>
    `;

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => mockResponseXml,
    }));

    const result = await soapRequest<any>('InventoryAdjustmentRequest', '<ser:ItemSKU>IK5737-M</ser:ItemSKU>');
    
    expect(result.successful).toBe(true);
    expect(result.adjustmentResults[0].successful).toBe(true);
  });

  it('should parse SearchItemTypesRequest successfully', async () => {
    const mockResponseXml = `
      <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
        <SOAP-ENV:Body>
          <SearchItemTypesResponse xmlns="http://uniware.unicommerce.com/services/">
            <Successful>true</Successful>
            <TotalRecords>1</TotalRecords>
            <ItemTypes>
              <ItemType>
                <SKUCode>IK5737-M</SKUCode>
                <Name>Fortore 3 Jersey</Name>
                <Description>Desc</Description>
                <Enabled>true</Enabled>
              </ItemType>
            </ItemTypes>
          </SearchItemTypesResponse>
        </SOAP-ENV:Body>
      </SOAP-ENV:Envelope>
    `;

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => mockResponseXml,
    }));

    const result = await soapRequest<any>('SearchItemTypesRequest', '<ser:DisplayStart>0</ser:DisplayStart>');
    
    expect(result.successful).toBe(true);
    expect(result.totalRecords).toBe(1);
    expect(result.itemTypes).toBeDefined();
    expect(result.itemTypes.length).toBe(1);
    expect(result.itemTypes[0].skuCode).toBe('IK5737-M');
    expect(result.itemTypes[0].name).toBe('Fortore 3 Jersey');
  });

  it('should extract error blocks correctly on failure responses', async () => {
    const mockResponseXml = `
      <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
        <SOAP-ENV:Body>
          <GetInventorySnapshotResponse xmlns="http://uniware.unicommerce.com/services/">
            <Successful>false</Successful>
            <Errors>
              <Error code="60004" description="Could not find items" message="INVENTORY_NOT_AVAILABLE"/>
            </Errors>
          </GetInventorySnapshotResponse>
        </SOAP-ENV:Body>
      </SOAP-ENV:Envelope>
    `;

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => mockResponseXml,
    }));

    const result = await soapRequest<any>('GetInventorySnapshotRequest', '<ser:ItemSKU>IK5737-M</ser:ItemSKU>');
    
    expect(result.successful).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].code).toBe('60004');
    expect(result.errors[0].message).toBe('INVENTORY_NOT_AVAILABLE');
  });

  it('should throw SOAP fault error when server returns SOAP fault envelope', async () => {
    const mockResponseXml = `
      <SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
        <SOAP-ENV:Body>
          <SOAP-ENV:Fault>
            <faultcode>SOAP-ENV:Client</faultcode>
            <faultstring xml:lang="en">Illegal Access, facility is required</faultstring>
          </SOAP-ENV:Fault>
        </SOAP-ENV:Body>
      </SOAP-ENV:Envelope>
    `;

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 500,
      ok: false,
      text: async () => mockResponseXml,
    }));

    await expect(soapRequest<any>('GetInventorySnapshotRequest', '<ser:ItemSKU>IK5737-M</ser:ItemSKU>')).rejects.toThrow(
      '[Uniware SOAP Fault] Code: SOAP-ENV:Client, Message: Illegal Access, facility is required'
    );
  });
});
