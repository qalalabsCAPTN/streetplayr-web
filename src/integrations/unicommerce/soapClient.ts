/**
 * Unicommerce Base SOAP Client with WS-Security, XML Translation, and SRE Observability.
 */

import { getUnicommerceConfig, buildUnicommerceSoapUrl } from './config';
import { UnicommerceLogger } from './logging';
import { backoffMs, isRetryableSoapError, soapTimeoutMs } from './retry';

interface SOAPOptions {
  correlationId?: string;
  requestId?: string;
  headers?: Record<string, string>;
  facilityCode?: string;
}

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extracts a single tag's text content from XML.
 */
export function getTagValue(xml: string, tagName: string): string {
  const regex = new RegExp(`<([^>:]+:)?${tagName}(\\s[^>]*|\\s*)>([\\s\\S]*?)<\\/\\1?${tagName}>`);
  const match = xml.match(regex);
  if (!match) return '';
  return match[3].trim().replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

/**
 * Extracts multiple occurrences of blocks or tags from XML.
 */
export function getTagBlocks(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<([^>:]+:)?${tagName}(\\s[^>]*|\\s*)>([\\s\\S]*?)<\\/\\1?${tagName}>`, 'g');
  const blocks: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    blocks.push(match[3].trim());
  }
  return blocks;
}

/**
 * Core SOAP Request Dispatcher.
 */
export async function soapRequest<T>(
  operation: string,
  xmlBody: string,
  options: SOAPOptions = {}
): Promise<T> {
  const config = getUnicommerceConfig();
  const url = buildUnicommerceSoapUrl(config.apiUrl, options.facilityCode || config.facilityCode);

  const correlationId = options.correlationId || `corr_${Math.random().toString(36).substr(2, 9)}`;
  const requestId = options.requestId || `req_${Math.random().toString(36).substr(2, 9)}`;
  const facilityCode = options.facilityCode || config.facilityCode;

  const logMeta = {
    correlationId,
    requestId,
    soapOperation: operation,
    facilityCode,
  };

  // Construct standard SOAP envelope with WS-Security header
  const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://uniware.unicommerce.com/services/">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>${config.username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${config.password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    ${xmlBody}
  </soapenv:Body>
</soapenv:Envelope>`;

  let attempt = 0;
  const startTime = Date.now();

  while (attempt <= MAX_RETRIES) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': operation,
        'Facility': facilityCode,
        'x-correlation-id': correlationId,
        'x-request-id': requestId,
        ...options.headers,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: soapEnvelope,
        signal: AbortSignal.timeout(soapTimeoutMs()),
      });

      const latency = Date.now() - startTime;
      const responseText = await response.text();

      // Handle transient errors (HTTP 429 Rate Limit, 5xx server issues)
      if (response.status === 429 || (response.status >= 500 && !responseText.includes('SOAP-ENV:Fault'))) {
        if (attempt === MAX_RETRIES) {
          throw new Error(`Max retries reached. SOAP HTTP Status: ${response.status}`);
        }
        const delay = backoffMs(attempt, INITIAL_BACKOFF_MS);
        await UnicommerceLogger.warn(
          'soap_client.retry',
          `Transient SOAP HTTP error. Retrying attempt ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay)}ms. Status: ${response.status}`,
          'system',
          { ...logMeta, latency, attempt, retryDelay: delay }
        );
        await sleep(delay);
        attempt++;
        continue;
      }

      // Check for SOAP Faults in response XML
      if (responseText.includes('<faultstring') || responseText.includes('<soapenv:Fault')) {
        const faultCode = getTagValue(responseText, 'faultcode');
        const faultString = getTagValue(responseText, 'faultstring');
        throw new Error(`[Uniware SOAP Fault] Code: ${faultCode}, Message: ${faultString}`);
      }

      // Handle other non-ok HTTP statuses
      if (!response.ok) {
        throw new Error(`SOAP HTTP Error ${response.status}: ${response.statusText}`);
      }

      // Translate the response
      const translatedJson = translateSoapResponse(operation, responseText, facilityCode) as T;
      const finalLatency = Date.now() - startTime;

      await UnicommerceLogger.info(
        'soap_client.request_success',
        `Unicommerce SOAP request succeeded for operation ${operation}`,
        'system',
        { ...logMeta, latency: finalLatency, httpStatus: response.status, attempt }
      );

      return translatedJson;
    } catch (error: any) {
      const latency = Date.now() - startTime;
      const isNetworkError = isRetryableSoapError(error);

      if (isNetworkError && attempt < MAX_RETRIES) {
        const delay = backoffMs(attempt, INITIAL_BACKOFF_MS);
        await UnicommerceLogger.warn(
          'soap_client.retry_network',
          `SOAP Network issue on attempt ${attempt + 1}/${MAX_RETRIES}. Retrying in ${Math.round(delay)}ms. Error: ${error.message}`,
          'system',
          { ...logMeta, latency, attempt, retryDelay: delay }
        );
        await sleep(delay);
        attempt++;
        continue;
      }

      await UnicommerceLogger.error(
        'soap_client.request_error',
        `Unicommerce SOAP request failed for operation ${operation}`,
        error,
        'system',
        { ...logMeta, latency, attempt }
      );
      throw error;
    }
  }

  throw new Error('SOAP Request execution failed unexpectedly');
}

/**
 * Translates Unicommerce SOAP XML Responses into REST-like JSON structures.
 */
function translateSoapResponse(operation: string, xml: string, facilityCode: string): any {
  const successful = getTagValue(xml, 'Successful') === 'true';

  // Parse Errors if present
  let errors: Array<{ code: string; message: string }> | undefined;
  if (!successful) {
    const errorBlocks: Array<{ code: string; message: string }> = [];
    
    // Match self-closing <Error code="..." /> or similar tags first
    const selfClosingRegex = /<([^>:]+:)?Error\s+([^>]*)\/>/g;
    let match;
    while ((match = selfClosingRegex.exec(xml)) !== null) {
      const attrs = match[2];
      const code = attrs.match(/code="([^"]+)"/)?.[1] || 'UNKNOWN_ERROR';
      const message = attrs.match(/message="([^"]+)"/)?.[1] || attrs.match(/description="([^"]+)"/)?.[1] || 'Unknown SOAP error';
      errorBlocks.push({ code, message });
    }

    // Fallback to check if there are nested <Error> tags with closing tags
    if (errorBlocks.length === 0) {
      const nestedBlocks = getTagBlocks(xml, 'Error');
      if (nestedBlocks.length > 0) {
        nestedBlocks.forEach((block) => {
          const code = getTagValue(block, 'Code') || block.match(/code="([^"]+)"/)?.[1] || 'UNKNOWN_ERROR';
          const message = getTagValue(block, 'Message') || block.match(/message="([^"]+)"/)?.[1] || 'Unknown SOAP error';
          errorBlocks.push({ code, message });
        });
      }
    }

    if (errorBlocks.length > 0) {
      errors = errorBlocks;
    } else {
      // Look for raw fault or check tag
      const description = getTagValue(xml, 'description') || getTagValue(xml, 'message') || 'Unknown SOAP failure';
      errors = [{ code: 'SOAP_FAILURE', message: description }];
    }
  }

  switch (operation) {
    case 'GetItemTypeRequest': {
      if (!successful) return { successful: false, errors };
      return {
        successful: true,
        itemTypeDTO: {
          skuCode: getTagValue(xml, 'SkuCode'),
          categoryCode: getTagValue(xml, 'CategoryCode'),
          name: getTagValue(xml, 'Name'),
          description: getTagValue(xml, 'Description'),
          color: getTagValue(xml, 'Color'),
          size: getTagValue(xml, 'Size'),
          brand: getTagValue(xml, 'Brand'),
          basePrice: parseFloat(getTagValue(xml, 'MaxRetailPrice')) || 0, // Map MaxRetailPrice to basePrice for REST compatibility
          maxRetailPrice: parseFloat(getTagValue(xml, 'MaxRetailPrice')) || 0,
          enabled: getTagValue(xml, 'Enabled') === 'true',
          hsnCode: getTagValue(xml, 'HSNCode') || undefined,
          ean: getTagValue(xml, 'Ean') || getTagValue(xml, 'EAN') || undefined,
        },
      };
    }

    case 'GetInventorySnapshotRequest': {
      if (!successful) return { successful: false, errors };
      const snapshotBlocks = getTagBlocks(xml, 'InventorySnapshot');
      const inventorySnapshots = snapshotBlocks
        .map((block) => {
          const raw = getTagValue(block, 'Inventory');
          const inventory = parseInt(raw, 10);
          if (raw === '' || !Number.isFinite(inventory)) return null;
          return {
            itemTypeSKU: getTagValue(block, 'ItemSKU'),
            inventory,
            blocked: parseInt(getTagValue(block, 'PendingInventoryAssessment'), 10) || 0,
            openOrders: 0,
            facilityCode,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null);
      return {
        successful: true,
        inventorySnapshots,
      };
    }

    case 'InventoryAdjustmentRequest': {
      return {
        successful,
        errors,
        adjustmentResults: [
          {
            itemSKU: getTagValue(xml, 'ItemSKU') || '',
            successful,
            errorCode: errors?.[0]?.code,
            errorMessage: errors?.[0]?.message,
          },
        ],
      };
    }

    case 'CreateSaleOrderRequest': {
      return {
        successful,
        errors,
        saleOrderCode: getTagValue(xml, 'Code') || undefined,
      };
    }

    case 'GetSaleOrderRequest': {
      if (!successful) return { successful: false, errors };
      
      const orderBlock = getTagValue(xml, 'SaleOrder');
      
      // Parse shipping/billing addresses
      const shippingBlock = getTagValue(orderBlock, 'ShippingAddress');
      const billingBlock = getTagValue(orderBlock, 'BillingAddress');
      
      const parseAddress = (addrBlock: string) => {
        if (!addrBlock) return undefined;
        return {
          name: getTagValue(addrBlock, 'Name'),
          addressLine1: getTagValue(addrBlock, 'AddressLine1'),
          addressLine2: getTagValue(addrBlock, 'AddressLine2') || undefined,
          city: getTagValue(addrBlock, 'City'),
          state: getTagValue(addrBlock, 'State'),
          countryCode: getTagValue(addrBlock, 'Country') === 'India' || getTagValue(addrBlock, 'Country') === 'IN' ? 'IN' : getTagValue(addrBlock, 'Country'),
          pincode: getTagValue(addrBlock, 'Pincode'),
          phone: getTagValue(addrBlock, 'Phone'),
          email: getTagValue(addrBlock, 'Email'),
        };
      };

      // Parse order items
      const itemBlocks = getTagBlocks(orderBlock, 'SaleOrderItem');
      const saleOrderItems = itemBlocks.map((itemXml) => ({
        code: getTagValue(itemXml, 'Code'),
        sku: getTagValue(itemXml, 'ItemSKU'),
        sellingPrice: parseFloat(getTagValue(itemXml, 'SellingPrice')) || 0,
        quantity: 1, // SOAP lists each individual item unit as a separate node
        statusCode: getTagValue(itemXml, 'StatusCode') || getTagValue(itemXml, 'Status') || 'PROCESSING',
      }));

      return {
        successful: true,
        saleOrder: {
          code: getTagValue(orderBlock, 'Code'),
          displayOrderCode: getTagValue(orderBlock, 'DisplayOrderCode'),
          status: getTagValue(orderBlock, 'Status'),
          shippingAddress: parseAddress(shippingBlock),
          billingAddress: parseAddress(billingBlock) || parseAddress(shippingBlock),
          saleOrderItems,
        },
      };
    }

    case 'CreateReversePickupRequest': {
      return {
        successful,
        errors,
        reversePickupCode: getTagValue(xml, 'ReversePickupCode') || undefined,
      };
    }

    case 'GetReturnItemRequest': {
      if (!successful) return { successful: false, errors };

      const itemBlocks = getTagBlocks(xml, 'ReturnSaleOrderItem');
      const items = itemBlocks.map((itemBlock) => ({
        sku: getTagValue(itemBlock, 'ItemSKU') || getTagValue(itemBlock, 'Sku'),
        quantity: parseInt(getTagValue(itemBlock, 'Quantity'), 10) || 1,
        reason: getTagValue(itemBlock, 'Reason') || undefined,
      }));

      return {
        successful: true,
        returnDetails: [
          {
            reversePickupCode: getTagValue(xml, 'ReversePickupCode'),
            saleOrderCode: getTagValue(xml, 'SaleOrderCode') || getTagValue(xml, 'OrderCode'),
            status: getTagValue(xml, 'Status') || 'RETURN_RECEIVED',
            courierName: getTagValue(xml, 'CourierName') || getTagValue(xml, 'ShippingCourier'),
            trackingNumber: getTagValue(xml, 'TrackingNumber') || getTagValue(xml, 'WaybillNumber'),
            items,
            createdDate: getTagValue(xml, 'CreatedDate') || new Date().toISOString(),
          },
        ],
      };
    }

    case 'getShippingPackageDetailRequest': {
      if (!successful) return { successful: false, errors };
      const detailBlock = getTagValue(xml, 'ShippingPackageDetail');
      return {
        successful: true,
        shippingPackage: {
          code: getTagValue(detailBlock, 'ShippingPackageCode') || getTagValue(detailBlock, 'Code'),
          saleOrderCode: getTagValue(detailBlock, 'SaleOrderCode'),
          status: getTagValue(detailBlock, 'Status'),
          courierName: getTagValue(detailBlock, 'CourierName') || getTagValue(detailBlock, 'ShippingProvider'),
          trackingNumber: getTagValue(detailBlock, 'TrackingNumber'),
          waybillNumber: getTagValue(detailBlock, 'WaybillNumber') || getTagValue(detailBlock, 'TrackingNumber'),
          weight: parseFloat(getTagValue(detailBlock, 'Weight')) || undefined,
          dispatchedDate: getTagValue(detailBlock, 'DispatchedDate') || getTagValue(detailBlock, 'DispatchTime') || undefined,
          deliveryDate: getTagValue(detailBlock, 'DeliveryDate') || undefined,
        },
      };
    }

    case 'SearchShippingPackageRequest': {
      if (!successful) return { successful: false, errors };
      const packageBlocks = getTagBlocks(xml, 'ShippingPackage');
      const shippingPackages = packageBlocks.map((block) => ({
        code: getTagValue(block, 'ShippingPackageCode') || getTagValue(block, 'Code'),
        saleOrderCode: getTagValue(block, 'SaleOrderCode'),
        status: getTagValue(block, 'Status'),
        courierName: getTagValue(block, 'CourierName') || getTagValue(block, 'ShippingProvider'),
        trackingNumber: getTagValue(block, 'TrackingNumber'),
        waybillNumber: getTagValue(block, 'WaybillNumber') || getTagValue(block, 'TrackingNumber'),
      }));
      return {
        successful: true,
        shippingPackages,
      };
    }

    case 'SearchItemTypesRequest': {
      if (!successful) return { successful: false, errors };
      const itemBlocks = getTagBlocks(xml, 'ItemType');
      const itemTypes = itemBlocks.map((block) => ({
        skuCode: getTagValue(block, 'SKUCode') || getTagValue(block, 'SkuCode'),
        name: getTagValue(block, 'Name'),
        description: getTagValue(block, 'Description'),
        color: getTagValue(block, 'Color') || undefined,
        size: getTagValue(block, 'Size') || undefined,
        brand: getTagValue(block, 'Brand') || undefined,
        basePrice: parseFloat(getTagValue(block, 'MaxRetailPrice')) || parseFloat(getTagValue(block, 'BasePrice')) || 0,
        enabled: getTagValue(block, 'Enabled') === 'true' || getTagValue(block, 'Enabled') === '',
      }));
      return {
        successful: true,
        totalRecords: parseInt(getTagValue(xml, 'TotalRecords'), 10) || itemTypes.length,
        itemTypes,
      };
    }

    default:
      return { successful, errors };
  }
}
