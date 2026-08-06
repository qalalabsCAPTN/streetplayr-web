# Payload Discovery Report

This report documents the exact request and response schemas verified against the documentation.

## 1. GetItemTypeRequest (SOAP)
### Request XML:
```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://uniware.unicommerce.com/services/">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>streetplayr</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">...</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:GetItemTypeRequest>
      <ser:SkuCode>IK5737-M</ser:SkuCode>
    </ser:GetItemTypeRequest>
  </soapenv:Body>
</soapenv:Envelope>
```

### Response XML:
```xml
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Header/><SOAP-ENV:Body><GetItemTypeResponse xmlns="http://uniware.unicommerce.com/services/"><Successful>true</Successful><SkuCode>IK5737-M</SkuCode><CategoryCode>Jersey</CategoryCode><Name>Fortore 3 Jersey</Name><Description/><ScanIdentifier>4066762685585</ScanIdentifier><Length>300</Length><Width>300</Width><Height>10</Height><Weight>200.000</Weight><Color>Black</Color><Size>M</Size><Brand>Adidas</Brand><Ean>4066762685585</Ean><Upc/><Isbn/><MaxRetailPrice>1999.00</MaxRetailPrice><GstTaxTypeCode>5-18</GstTaxTypeCode><HSNCode>61099010</HSNCode><ProductPageUrl/><Type>SIMPLE</Type><ItemDetailFieldsText/><Enabled>true</Enabled><Tags/><CustomFields/><ComponentItemTypes/></GetItemTypeResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>
```

## 2. GetInventorySnapshotRequest (SOAP)
### Request XML:
```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://uniware.unicommerce.com/services/">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>streetplayr</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">...</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    <ser:GetInventorySnapshotRequest>
      <ser:ItemTypes>
        <ser:ItemType>
          <ser:ItemSKU>IK5737-M</ser:ItemSKU>
        </ser:ItemType>
      </ser:ItemTypes>
      <ser:UpdatedSinceInMinutes>480</ser:UpdatedSinceInMinutes>
    </ser:GetInventorySnapshotRequest>
  </soapenv:Body>
</soapenv:Envelope>
```

### Response XML (Error state when inventory not configured):
```xml

[SOAP INVENTORY RESPONSE]
```
