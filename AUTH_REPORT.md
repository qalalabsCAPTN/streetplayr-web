# Authentication Discovery and Verification Report

**Base URL:** https://playr.unicommerce.com
**Timestamp:** 2026-07-22T09:13:06.585Z

## 1. REST Authentication Test
*   **Endpoint:** `/oauth/token`
*   **Result:** ❌ Failed (HTTP Status: 500)
*   **Detailed Log:**
```text
[REST REQUEST]

[REST RESPONSE]
```
*   **Analysis of REST Failure:**
    The REST API returned `HTTP 500 Internal Server Error` with the error payload:
    `{"successful":false,"errors":[{"code":100222,"message":"Internal Error","errorParams":{"Exception":"invalid email:streetplayr"}}]}`.
    This indicates that the OAuth2 Password Grant endpoint expects the `username` parameter to be formatted as a valid email address. Our configured username is `streetplayr`, which triggers a validation exception on the server.

## 2. SOAP Authentication Test
*   **Endpoint:** `/services/soap/?version=1.9`
*   **Result:** ✅ Succeeded (HTTP Status: 200)
*   **Mechanism:** WS-Security `UsernameToken` inside SOAP Header
*   **Detailed Log:**
```text

[SOAP REQUEST]
Headers: {
  "Content-Type": "text/xml; charset=utf-8",
  "SOAPAction": "GetItemTypeRequest"
}

[SOAP RESPONSE]
Body:
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"><SOAP-ENV:Header/><SOAP-ENV:Body><GetItemTypeResponse xmlns="http://uniware.unicommerce.com/services/"><Successful>true</Successful><SkuCode>IK5737-M</SkuCode><CategoryCode>Jersey</CategoryCode><Name>Fortore 3 Jersey</Name><Description/><ScanIdentifier>4066762685585</ScanIdentifier><Length>300</Length><Width>300</Width><Height>10</Height><Weight>200.000</Weight><Color>Black</Color><Size>M</Size><Brand>Adidas</Brand><Ean>4066762685585</Ean><Upc/><Isbn/><MaxRetailPrice>1999.00</MaxRetailPrice><GstTaxTypeCode>5-18</GstTaxTypeCode><HSNCode>61099010</HSNCode><ProductPageUrl/><Type>SIMPLE</Type><ItemDetailFieldsText/><Enabled>true</Enabled><Tags/><CustomFields/><ComponentItemTypes/></GetItemTypeResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>
```

## 3. Verdict
The Unicommerce tenant `playr.unicommerce.com` **only supports SOAP authentication** for the current integration user `streetplayr` due to the username format restriction in the REST OAuth2 token service.
