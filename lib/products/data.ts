export interface LocalProduct {
  id: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  slug: string;
  category: { name: string };
  metadata: {
    points: string;
    gallery_images: string[];
    colors: { id: string; name: string; hex: string; images?: string[] }[];
    /** Path to GLB file in /public/models/ — enables "View in 3D" button on PDP */
    model3d?: string;
    /** Search tags for storefront search */
    tags?: string[];
    category?: string;
    latest_drop?: boolean;
  };
  variants: {
    id: string;
    size: string;
    color: string;
    stock_quantity: number;
    price_override: number | null;
  }[];
}

const GALLERY_IMAGES = (slug: string) =>
  [1, 2, 3, 4, 5].map((n) => `/assets/products/${slug}/image-${n}.webp`);

const ALL_SIZES = ["XS", "S", "M", "L", "XL"];
const TANK_SIZES = ["S", "M", "L", "XL"];

function buildVariants(slug: string, sizes = ALL_SIZES, baseStock = 25) {
  return sizes.map((size) => ({
    id: `${slug}-${size.toLowerCase()}`,
    size,
    color: "default",
    stock_quantity: baseStock,
    price_override: null,
  }));
}

export const LOCAL_PRODUCTS: LocalProduct[] = [
  {
    id: "PS-TEE-CRT-WHT",
    name: "playR Street Create Waffle Tee (White)",
    price: 1999,
    description: "Crafted from 220 GSM lightweight waffle-knit fabric with a relaxed fit and full-length sleeves in classic white.",
    image_url: `/assets/products/ctt-waffle/image-1.webp`,
    slug: "PS-TEE-CRT-WHT",
    category: { name: "TEES" },
    metadata: {
      points: "300",
      category: "TEES",
      tags: ["waffle", "220 GSM", "tee", "topwear"],
      gallery_images: GALLERY_IMAGES("ctt-waffle"),
      colors: [
        { id: "white", name: "White", hex: "#f5f5f0", images: GALLERY_IMAGES("ctt-waffle") },
      ],
      latest_drop: true,
    },
    variants: buildVariants("PS-TEE-CRT-WHT"),
  },
  {
    id: "PS-TEE-CRT-RED",
    name: "playR Street Create Waffle Tee (Red)",
    price: 1999,
    description: "Crafted from 220 GSM lightweight waffle-knit fabric with a relaxed fit and full-length sleeves in premium maroon red.",
    image_url: `/assets/products/ctt-maroon/image-1.webp`,
    slug: "PS-TEE-CRT-RED",
    category: { name: "TEES" },
    metadata: {
      points: "300",
      category: "TEES",
      tags: ["waffle", "220 GSM", "tee", "topwear"],
      gallery_images: GALLERY_IMAGES("ctt-maroon"),
      colors: [
        { id: "red", name: "Red", hex: "#6b1c2a", images: GALLERY_IMAGES("ctt-maroon") },
      ],
      latest_drop: true,
    },
    variants: buildVariants("PS-TEE-CRT-RED"),
  },
  {
    id: "PS-TEE-INS-PRP",
    name: "playR Street INSPIRED Tee (Purple)",
    price: 2499,
    description: "Made from premium single jersey cotton for a soft, lightweight feel, this oversized T-shirt combines a unique purple acid-washed finish with a striking white screen print for elevated everyday wear.",
    image_url: `/assets/products/inspired/image-1.webp`,
    slug: "PS-TEE-INS-PRP",
    category: { name: "TEES" },
    metadata: {
      points: "350",
      category: "TEES",
      gallery_images: GALLERY_IMAGES("inspired"),
      colors: [
        { id: "purple", name: "Purple", hex: "#4a2d6b", images: GALLERY_IMAGES("inspired") },
      ],
      model3d: "/models/inspired.glb",
      latest_drop: true,
    },
    variants: buildVariants("PS-TEE-INS-PRP"),
  },
  {
    id: "PS-TNK-STR-BLK",
    name: "playR Street STAAR Tank (Black)",
    price: 2499,
    description: "Crafted from heavyweight premium cotton, this sleeveless acid-washed tank features distressed panel seams across the entire garment for a deconstructed aesthetic. A premium raised puff print on the back completes the piece with bold dimension and lasting durability.",
    image_url: `/assets/products/star-tank-dark/image-1.webp`,
    slug: "PS-TNK-STR-BLK",
    category: { name: "TANKS" },
    metadata: {
      points: "350",
      category: "TANKS",
      gallery_images: GALLERY_IMAGES("star-tank-dark"),
      colors: [
        { id: "black", name: "Black", hex: "#1a1a1a", images: GALLERY_IMAGES("star-tank-dark") },
      ],
      latest_drop: true,
    },
    variants: buildVariants("PS-TNK-STR-BLK", TANK_SIZES),
  },
  {
    id: "PS-TNK-STR-WHT",
    name: "playR Street STAAR Tank (White)",
    price: 2499,
    description: "Crafted from heavyweight premium cotton, this sleeveless clean white tank features distressed panel seams across the entire garment for a deconstructed aesthetic. A premium raised puff print on the back completes the piece with bold dimension and lasting durability.",
    image_url: `/assets/products/star-tank-white/image-1.webp`,
    slug: "PS-TNK-STR-WHT",
    category: { name: "TANKS" },
    metadata: {
      points: "350",
      category: "TANKS",
      gallery_images: GALLERY_IMAGES("star-tank-white"),
      colors: [
        { id: "white", name: "White", hex: "#ffffff", images: GALLERY_IMAGES("star-tank-white") },
      ],
      latest_drop: true,
    },
    variants: buildVariants("PS-TNK-STR-WHT", TANK_SIZES),
  },
  {
    id: "PS-PNT-CORE-BLK",
    name: "playR Street Sweats Pant (Black)",
    price: 3499,
    description: "Designed for ultimate street comfort. Made of ultra-heavyweight cotton fleece, these sweatpants feature deep utility side pockets, structured panel seams, and an adjustable waistband.",
    image_url: `/assets/products/sweat-pant-black/image-1.webp`,
    slug: "PS-PNT-CORE-BLK",
    category: { name: "SWEATPANTS" },
    metadata: {
      points: "500",
      category: "SWEATPANTS",
      gallery_images: GALLERY_IMAGES("sweat-pant-black"),
      colors: [
        { id: "black", name: "Black", hex: "#111111", images: GALLERY_IMAGES("sweat-pant-black") },
      ],
    },
    variants: buildVariants("PS-PNT-CORE-BLK"),
  },
  {
    id: "PS-PNT-CORE-CRM",
    name: "playR Street Sweats Pant (Cream)",
    price: 3499,
    description: "Designed for ultimate street comfort. Made of ultra-heavyweight cotton fleece, these sweatpants feature deep utility side pockets, structured panel seams, and an adjustable waistband in an off-white cream colorway.",
    image_url: `/assets/products/sweat-pants-white/image-1.webp`,
    slug: "PS-PNT-CORE-CRM",
    category: { name: "SWEATPANTS" },
    metadata: {
      points: "500",
      category: "SWEATPANTS",
      gallery_images: GALLERY_IMAGES("sweat-pants-white"),
      colors: [
        { id: "cream", name: "Cream", hex: "#fdfbf7", images: GALLERY_IMAGES("sweat-pants-white") },
      ],
    },
    variants: buildVariants("PS-PNT-CORE-CRM"),
  },
  {
    id: "PS-PNT-CARP-GRY",
    name: "playR Street Carpenter Pant Fleece (Grey)",
    price: 3699,
    description: "Crafted from premium heavyweight fabric (350 GSM fleece), the playR Carpenter Pants are designed for everyday comfort with a clean, timeless silhouette. Featuring a relaxed fit, subtle carpenter-inspired detailing, and a discreet side pocket for quick access to your phone or everyday essentials, they balance functionality with effortless style. Minimal, durable, and versatile, they're built to pair seamlessly with any outfit.",
    image_url: `/assets/products/carpenter-grey/image-1.webp`,
    slug: "PS-PNT-CARP-GRY",
    category: { name: "SWEATPANTS" },
    metadata: {
      points: "500",
      category: "SWEATPANTS",
      gallery_images: GALLERY_IMAGES("carpenter-grey"),
      colors: [
        { id: "grey", name: "Grey", hex: "#8a8a8a", images: GALLERY_IMAGES("carpenter-grey") },
      ],
    },
    variants: buildVariants("PS-PNT-CARP-GRY"),
  },
  {
    id: "PS-PNT-CARP-GRN",
    name: "playR Street Carpenter Pant Fleece (Green)",
    price: 3699,
    description: "Crafted from premium heavyweight fabric (350 GSM fleece), the playR Carpenter Pants are designed for everyday comfort with a clean, timeless silhouette. Featuring a relaxed fit, subtle carpenter-inspired detailing, and a discreet side pocket for quick access to your phone or everyday essentials, they balance functionality with effortless style. Minimal, durable, and versatile, they're built to pair seamlessly with any outfit in a dark green olive colorway.",
    image_url: `/assets/products/carpenter-olive/image-1.webp`,
    slug: "PS-PNT-CARP-GRN",
    category: { name: "SWEATPANTS" },
    metadata: {
      points: "500",
      category: "SWEATPANTS",
      gallery_images: GALLERY_IMAGES("carpenter-olive"),
      colors: [
        { id: "green", name: "Green/Olive", hex: "#5c5a3a", images: GALLERY_IMAGES("carpenter-olive") },
      ],
    },
    variants: buildVariants("PS-PNT-CARP-GRN"),
  },
  {
    id: "PS-TEE-WAR-BRW",
    name: "playR Street WARRIOR Tee (Brown)",
    price: 1999,
    description: "Made from heavyweight premium cotton terry, this oversized T-shirt is designed for all-day comfort and a structured drape. Signature aligned puff print detailing around the neckline and back adds a distinctive, elevated finish.",
    image_url: `/assets/products/brown-warrior/image-1.webp`,
    slug: "PS-TEE-WAR-BRW",
    category: { name: "TEES" },
    metadata: {
      points: "300",
      category: "TEES",
      tags: ["tee", "topwear", "warrior"],
      gallery_images: GALLERY_IMAGES("brown-warrior"),
      colors: [
        { id: "brown", name: "Brown", hex: "#5c3a2e", images: GALLERY_IMAGES("brown-warrior") },
      ],
      latest_drop: true,
    },
    variants: buildVariants("PS-TEE-WAR-BRW"),
  },
  {
    id: "PS-TEE-WAR-BLK",
    name: "WARRIOR Tee Black",
    price: 1999,
    description: "Made from heavyweight premium cotton terry, this oversized T-shirt is designed for all-day comfort and a structured drape. Signature aligned puff print detailing around the neckline and back adds a distinctive, elevated finish.",
    image_url: `/assets/products/black-warrior/image-1.jpg`,
    slug: "PS-TEE-WAR-BLK",
    category: { name: "TEES" },
    metadata: {
      points: "300",
      category: "TEES",
      tags: ["tee", "topwear", "warrior"],
      gallery_images: [1, 2, 3, 4, 5].map((n) => `/assets/products/black-warrior/image-${n}.jpg`),
      colors: [
        { id: "black", name: "Black", hex: "#000000", images: [1, 2, 3, 4, 5].map((n) => `/assets/products/black-warrior/image-${n}.jpg`) },
      ],
      latest_drop: true,
    },
    variants: buildVariants("PS-TEE-WAR-BLK"),
  },
  {
    id: "stick-no-bills",
    name: "playR Street SNB Waffle Tee",
    price: 2299,
    description: "Crafted from heavyweight acid-washed ribbed cotton, this oversized long sleeve features a structured, boxy fit with dropped shoulders and a worn-in vintage finish. The graphics draw inspiration from urban city walls and street culture.",
    image_url: `/assets/products/stick-no-bills/image-1.webp`,
    slug: "stick-no-bills",
    category: { name: "LONG-SLEEVE" },
    metadata: {
      points: "300",
      category: "LONG-SLEEVE",
      gallery_images: GALLERY_IMAGES("stick-no-bills"),
      colors: [
        { id: "grey", name: "Grey", hex: "#8a8a8a", images: GALLERY_IMAGES("stick-no-bills") },
      ],
      latest_drop: true,
    },
    variants: buildVariants("stick-no-bills"),
  },
];

export function getLocalProductBySlug(slug: string): LocalProduct | undefined {
  return LOCAL_PRODUCTS.find((p) => p.slug === slug || p.slug.toLowerCase() === slug.toLowerCase());
}

export function getLocalActiveProducts() {
  return LOCAL_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description,
    image: p.image_url,
    slug: p.slug,
    category: p.category.name,
  }));
}

export function getLocalLatestDrops() {
  const drops = LOCAL_PRODUCTS.filter((p) => p.metadata.latest_drop);
  return drops.map((p, idx) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image_url,
    image2: p.metadata.gallery_images[1] || p.image_url,
    slug: p.slug,
    category: p.category.name,
    className: idx === 0 ? "md:col-span-5 md:mt-24" : idx === 1 ? "md:col-span-3" : "md:col-span-4 md:mt-48",
  }));
}
