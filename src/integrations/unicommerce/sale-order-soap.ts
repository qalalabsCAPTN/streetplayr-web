/** SOAP CreateSaleOrder body. No server-only imports. */

export function xmlEscape(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type SaleOrderSoapInput = {
  id: string;
  displayCode: string;
  createdAt: string;
  currency: string;
  channelCode: string;
  facilityCode?: string;
  paymentAmount: number;
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    phone: string;
    email: string;
  };
  billingAddress?: SaleOrderSoapInput['shippingAddress'];
  items: Array<{ sku: string; price: number; quantity: number }>;
};

function addrXml(id: string, a: SaleOrderSoapInput['shippingAddress']): string {
  const country = a.country === 'IN' || a.country === 'India' ? 'India' : a.country;
  return `<ser:Address id="${id}">
              <ser:Name>${xmlEscape(a.name)}</ser:Name>
              <ser:AddressLine1>${xmlEscape(a.addressLine1)}</ser:AddressLine1>
              ${a.addressLine2 ? `<ser:AddressLine2>${xmlEscape(a.addressLine2)}</ser:AddressLine2>` : ''}
              <ser:City>${xmlEscape(a.city)}</ser:City>
              <ser:State>${xmlEscape(a.state)}</ser:State>
              <ser:Country>${xmlEscape(country)}</ser:Country>
              <ser:Pincode>${xmlEscape(a.pincode)}</ser:Pincode>
              <ser:Phone>${xmlEscape(a.phone)}</ser:Phone>
              <ser:Email>${xmlEscape(a.email)}</ser:Email>
            </ser:Address>`;
}

export function buildCreateSaleOrderSoapBody(order: SaleOrderSoapInput): string {
  const billing = order.billingAddress || order.shippingAddress;
  const shipping = order.shippingAddress;
  const phone = (shipping.phone || '').replace(/\D/g, '').slice(-10);
  const email = shipping.email || '';
  const itemsXml = order.items
    .flatMap((item) =>
      Array.from({ length: Math.max(1, item.quantity) }).map((_, i) => {
        const sku = xmlEscape(item.sku);
        const price = Number(item.price) || 0;
        const itemCode = xmlEscape(
          `${order.displayCode || order.id.slice(0, 8)}-${item.sku}-${i}`.slice(0, 45)
        );
        return `<ser:SaleOrderItem>
            <ser:Code>${itemCode}</ser:Code>
            <ser:ItemSKU>${sku}</ser:ItemSKU>
            <ser:ChannelProductId>${sku}</ser:ChannelProductId>
            <ser:ShippingMethodCode>STD</ser:ShippingMethodCode>
            <ser:TotalPrice>${price}</ser:TotalPrice>
            <ser:SellingPrice>${price}</ser:SellingPrice>
            <ser:PrepaidAmount>${price}</ser:PrepaidAmount>
            <ser:Discount>0</ser:Discount>
          </ser:SaleOrderItem>`;
      })
    )
    .join('');

  const saleOrder = `<ser:SaleOrder>
          <ser:Code>${xmlEscape(order.id)}</ser:Code>
          <ser:DisplayOrderCode>${xmlEscape(order.displayCode)}</ser:DisplayOrderCode>
          <ser:DisplayOrderDateTime>${new Date(order.createdAt).toISOString()}</ser:DisplayOrderDateTime>
          <ser:Channel>${xmlEscape(order.channelCode)}</ser:Channel>
          ${order.facilityCode ? `<ser:FacilityCode>${xmlEscape(order.facilityCode)}</ser:FacilityCode>` : ''}
          <ser:NotificationEmail>${xmlEscape(email)}</ser:NotificationEmail>
          <ser:NotificationMobile>${xmlEscape(phone)}</ser:NotificationMobile>
          <ser:CashOnDelivery>false</ser:CashOnDelivery>
          <ser:CurrencyCode>${xmlEscape(order.currency || 'INR')}</ser:CurrencyCode>
          <ser:PaymentInstruments>
            <ser:PaymentInstrument>
              <ser:PaymentMode>PREPAID</ser:PaymentMode>
              <ser:Amount>${Number(order.paymentAmount) || 0}</ser:Amount>
            </ser:PaymentInstrument>
          </ser:PaymentInstruments>
          <ser:Addresses>
            ${addrXml('billing_addr', billing)}
            ${addrXml('shipping_addr', shipping)}
          </ser:Addresses>
          <ser:ShippingAddress ref="shipping_addr"/>
          <ser:BillingAddress ref="billing_addr"/>
          <ser:SaleOrderItems>${itemsXml}</ser:SaleOrderItems>
        </ser:SaleOrder>`;

  return `<ser:CreateSaleOrderRequest>${saleOrder}</ser:CreateSaleOrderRequest>`;
}
