/**
 * StreetPlayR Lookbook — authoritative synced asset mapping.
 * Source of truth: streetplayr-lookbook-synced package (lookbook-sync.json).
 * Order follows `image_index`; image_file is the authoritative image reference.
 */

export interface SyncedLookbookEntry {
  imageIndex: number;
  imageFile: string;
  name: string;
  url: string | null;
  productCode: string | null;
  status: string;
}

export const LOOKBOOK_SYNC: SyncedLookbookEntry[] = [
  {
    imageIndex: 1,
    imageFile: "images/01-playr-street-create-waffle-tee-white.png",
    name: "playR Street Create Waffle Tee (White)",
    url: "https://www.streetplayr.com/product/PS-TEE-CRT-WHT",
    productCode: "PS-TEE-CRT-WHT",
    status: "Confirmed",
  },
  {
    imageIndex: 2,
    imageFile: "images/02-street-warrior-tee-brown.png",
    name: "Street Warrior Tee (Brown)",
    url: "https://www.streetplayr.com/product/PS-TEE-WAR-BRW",
    productCode: "PS-TEE-WAR-BRW",
    status: "Confirmed",
  },
  {
    imageIndex: 3,
    imageFile: "images/03-playr-street-sweats-pant-black.png",
    name: "playR Street Sweats Pant (Black)",
    url: "https://www.streetplayr.com/product/PS-PNT-CORE-BLK",
    productCode: "PS-PNT-CORE-BLK",
    status: "Confirmed",
  },
  {
    imageIndex: 4,
    imageFile: "images/04-playr-street-inspired-tee-purple.png",
    name: "playR Street INSPIRED Tee (Purple)",
    url: "https://www.streetplayr.com/product/PS-TEE-INS-PRP",
    productCode: "PS-TEE-INS-PRP",
    status: "Confirmed",
  },
  {
    imageIndex: 5,
    imageFile: "images/05-playr-street-carpenter-pant-fleece-350gsm-grey.png",
    name: "playR Street Carpenter Pant Fleece 350GSM (Grey)",
    url: "https://www.streetplayr.com/product/PS-PNT-CARP-GRY",
    productCode: "PS-PNT-CARP-GRY",
    status: "Confirmed",
  },
  {
    imageIndex: 6,
    imageFile: "images/06-playr-street-sweats-pant-cream.png",
    name: "playR Street Sweats Pant (Cream)",
    url: "https://www.streetplayr.com/product/PS-PNT-CORE-CRM",
    productCode: "PS-PNT-CORE-CRM",
    status: "Confirmed",
  },
  {
    imageIndex: 7,
    imageFile: "images/07-playr-street-inspired-tee-purple.png",
    name: "playR Street INSPIRED Tee (Purple)",
    url: "https://www.streetplayr.com/product/PS-TEE-INS-PRP",
    productCode: "PS-TEE-INS-PRP",
    status: "Confirmed",
  },
  {
    imageIndex: 8,
    imageFile: "images/08-playr-street-carpenter-pant-fleece-350gsm-green.png",
    name: "playR Street Carpenter Pant Fleece 350GSM (Green)",
    url: "https://www.streetplayr.com/product/PS-PNT-CARP-GRN",
    productCode: "PS-PNT-CARP-GRN",
    status: "Confirmed",
  },
  {
    imageIndex: 9,
    imageFile: "images/09-playr-street-sweats-pant-black.png",
    name: "playR Street Sweats Pant (Black)",
    url: "https://www.streetplayr.com/product/PS-PNT-CORE-BLK",
    productCode: "PS-PNT-CORE-BLK",
    status: "Confirmed",
  },
  {
    imageIndex: 10,
    imageFile: "images/10-playr-street-create-waffle-tee-white.png",
    name: "playR Street Create Waffle Tee (White)",
    url: "https://www.streetplayr.com/product/PS-TEE-CRT-WHT",
    productCode: "PS-TEE-CRT-WHT",
    status: "Confirmed",
  },
  {
    imageIndex: 11,
    imageFile: "images/11-playr-street-create-waffle-tee-white.png",
    name: "playR Street Create Waffle Tee (White)",
    url: "https://www.streetplayr.com/product/PS-TEE-CRT-WHT",
    productCode: "PS-TEE-CRT-WHT",
    status: "Confirmed",
  },
  {
    imageIndex: 12,
    imageFile: "images/12-playr-street-staar-tank-black.png",
    name: "playR Street STAAR Tank (Black)",
    url: "https://www.streetplayr.com/product/PS-TNK-STR-BLK",
    productCode: "PS-TNK-STR-BLK",
    status: "Confirmed",
  },
  {
    imageIndex: 14,
    imageFile: "images/14-playr-street-create-waffle-tee-red.png",
    name: "playR Street Create Waffle Tee (Red)",
    url: "https://www.streetplayr.com/product/PS-TEE-CRT-RED",
    productCode: "PS-TEE-CRT-RED",
    status: "Corrected",
  },
  {
    imageIndex: 15,
    imageFile: "images/15-playr-street-inspired-tee-purple.png",
    name: "playR Street INSPIRED Tee (Purple)",
    url: "https://www.streetplayr.com/product/PS-TEE-INS-PRP",
    productCode: "PS-TEE-INS-PRP",
    status: "Corrected",
  },
  {
    imageIndex: 16,
    imageFile: "images/16-black-warrior-tee.png",
    name: "Black Warrior Tee",
    url: null,
    productCode: null,
    status: "Confirmed",
  },
  {
    imageIndex: 17,
    imageFile: "images/17-playr-street-create-waffle-tee-red.png",
    name: "playR Street Create Waffle Tee (Red)",
    url: "https://www.streetplayr.com/product/PS-TEE-CRT-RED",
    productCode: "PS-TEE-CRT-RED",
    status: "Corrected",
  },
  {
    imageIndex: 18,
    imageFile: "images/18-playr-street-carpenter-pant-fleece-350gsm-green.png",
    name: "playR Street Carpenter Pant Fleece 350GSM (Green)",
    url: "https://www.streetplayr.com/product/PS-PNT-CARP-GRN",
    productCode: "PS-PNT-CARP-GRN",
    status: "Corrected",
  },
  {
    imageIndex: 19,
    imageFile: "images/19-playr-street-inspired-tee-purple.png",
    name: "playR Street INSPIRED Tee (Purple)",
    url: "https://www.streetplayr.com/product/PS-TEE-INS-PRP",
    productCode: "PS-TEE-INS-PRP",
    status: "Corrected",
  },
];
