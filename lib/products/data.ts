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

/** Prefer WebP when a high-quality encode exists (see scripts/convert-to-webp.cjs). */
const WEBP_PRODUCT_FRAMES = new Set([
  "black-warrior/1",
  "black-warrior/3",
  "black-warrior/5",
  "brown-warrior/1",
  "brown-warrior/3",
  "brown-warrior/5",
  "ctt-waffle/1",
  "ctt-waffle/5",
  "inspired/1",
  "inspired/3",
  "inspired/5",
  "warrior-bob/1",
]);

const GALLERY_IMAGES = (slug: string) =>
  [1, 2, 3, 4, 5].map((n) => {
    const ext = WEBP_PRODUCT_FRAMES.has(`${slug}/${n}`) ? "webp" : "jpg";
    return `/assets/products/${slug}/image-${n}.${ext}`;
  });

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "2XL"];

function buildVariants(slug: string, baseStock = 25) {
  return ALL_SIZES.map((size) => ({
    id: `${slug}-${size.toLowerCase()}`,
    size,
    color: "default",
    stock_quantity: baseStock,
    price_override: null,
  }));
}

export const LOCAL_PRODUCTS: LocalProduct[] = [
  {
    id: "ctt-waffle",
    name: "playR Create Waffle Tee",
    price: 1999,
    description:
      "Crafted from textured waffle-knit fabric with a relaxed fit and full-length sleeves",
    image_url: `/assets/products/ctt-waffle/image-1.webp`,
    slug: "ctt-waffle",
    category: { name: "TEES" },
    metadata: {
      points: "300",
      category: "TEES",
      gallery_images: GALLERY_IMAGES("ctt-waffle"),
      colors: [
        { id: "white", name: "White", hex: "#f5f5f0", images: GALLERY_IMAGES("ctt-waffle") },
        { id: "maroon", name: "Maroon", hex: "#6b1c2a", images: GALLERY_IMAGES("ctt-maroon") },
      ],
      latest_drop: true,
    },
    variants: buildVariants("ctt-waffle"),
  },
  {
    id: "warrior-tee",
    name: "WARRIOR Tee",
    price: 1999,
    description:
      "Made from heavyweight premium cotton terry, this oversized T-shirt is designed for all-day comfort and a structured drape. Signature aligned puff print detailing around the neckline and back adds a distinctive, elevated finish",
    image_url: `/assets/products/black-warrior/image-1.webp`,
    slug: "black-warrior",
    category: { name: "TEES" },
    metadata: {
      points: "300",
      category: "TEES",
      gallery_images: GALLERY_IMAGES("black-warrior"),
      colors: [
        { id: "black", name: "Black", hex: "#1a1a1a", images: GALLERY_IMAGES("black-warrior") },
        { id: "brown", name: "Brown", hex: "#5c3a2e", images: GALLERY_IMAGES("brown-warrior") },
      ],
      latest_drop: true,
    },
    variants: buildVariants("black-warrior"),
  },
  {
    id: "inspired",
    name: "INSPIRED Tee",
    price: 2499,
    description:
      "Made from premium single jersey cotton for a soft, lightweight feel, this oversized T-shirt combines a unique purple acid-washed finish with a striking white screen print for elevated everyday wear.",
    image_url: `/assets/products/inspired/image-1.webp`,
    slug: "inspired",
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
    variants: buildVariants("inspired"),
  },
  {
    id: "star-tank-dark",
    name: "STAAR playR Tank",
    price: 2499,
    description:
      "Crafted from heavyweight premium cotton, this sleeveless acid-washed tank features distressed panel seams across the entire garment for a deconstructed aesthetic. A premium raised puff print on the back completes the piece with bold dimension and lasting durability.",
    image_url: `/assets/products/star-tank-dark/image-1.jpg`,
    slug: "star-tank-dark",
    category: { name: "TANKS" },
    metadata: {
      points: "350",
      category: "TANKS",
      gallery_images: GALLERY_IMAGES("star-tank-dark"),
      colors: [
        { id: "dark", name: "Dark", hex: "#1a1a1a", images: GALLERY_IMAGES("star-tank-dark") },
      ],
    },
    variants: buildVariants("star-tank-dark"),
  },
  // playR Sweats (PS-PNT-CORE-BLK / -CRM, Rs.3499) — hidden until real product
  // photos land. Black + Cream shots pending; the old olive images belonged to
  // the Carpenter Olive colourway, not these.
  {
    id: "carpenter-grey",
    name: "Carpenter Pants",
    price: 3699,
    description:
      "Crafted from premium heavyweight fabric, the playR Carpenter Pants are designed for everyday comfort with a clean, timeless silhouette. Featuring a relaxed fit, subtle carpenter-inspired detailing, and a discreet side pocket for quick access to your phone or everyday essentials, they balance functionality with effortless style. Minimal, durable, and versatile, they're built to pair seamlessly with any outfit.",
    image_url: `/assets/products/carpenter-grey/image-1.jpg`,
    slug: "carpenter-grey",
    category: { name: "SWEATPANTS" },
    metadata: {
      points: "500",
      category: "SWEATPANTS",
      gallery_images: GALLERY_IMAGES("carpenter-grey"),
      colors: [
        { id: "grey", name: "Grey", hex: "#8a8a8a", images: GALLERY_IMAGES("carpenter-grey") },
        { id: "olive", name: "Olive", hex: "#5c5a3a", images: GALLERY_IMAGES("carpenter-olive") },
      ],
    },
    variants: buildVariants("carpenter-grey"),
  },
  {
    id: "stick-no-bills",
    name: "playR Street SNB Waffle Tee",
    price: 2299,
    description:
      "Crafted from heavyweight acid-washed ribbed cotton, this oversized long sleeve features a structured, boxy fit with dropped shoulders and a worn-in vintage finish. The phrase \"Stick No Bills\" comes from the iconic notices painted on city walls to discourage posters and advertisements, becoming a recognizable part of the urban landscape. The graphics draw inspiration from this piece of street culture, reinterpreting a familiar symbol of the city.",
    image_url: `/assets/products/stick-no-bills/image-1.jpg`,
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
  {
    id: "warrior-bob",
    name: "WARRIOR Bob",
    price: 1999,
    description:
      "The boldest cut in the Warrior family. Heavyweight cotton terry with an oversized silhouette and signature puff print detailing — raw, structured, unapologetic.",
    image_url: `/assets/products/warrior-bob/image-1.webp`,
    slug: "warrior-bob",
    category: { name: "TEES" },
    metadata: {
      points: "300",
      category: "TEES",
      gallery_images: GALLERY_IMAGES("warrior-bob"),
      colors: [
        { id: "default", name: "Standard", hex: "#ffffff", images: GALLERY_IMAGES("warrior-bob") },
      ],
    },
    variants: buildVariants("warrior-bob"),
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
  return LOCAL_PRODUCTS.map((p, idx) => ({
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
