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
    colors: { id: string; name: string; hex: string }[];
    /** Path to GLB file in /public/models/ — enables "View in 3D" button on PDP */
    model3d?: string;
  };
  variants: {
    id: string;
    size: string;
    color: string;
    stock_quantity: number;
    price_override: number | null;
  }[];
}

const GALLERY_IMAGES = (slug: string) => [
  `/assets/products/${slug}/image-1.jpg`,
  `/assets/products/${slug}/image-2.jpg`,
  `/assets/products/${slug}/image-3.jpg`,
  `/assets/products/${slug}/image-4.jpg`,
  `/assets/products/${slug}/image-5.jpg`,
];

const ALL_SIZES = ["XS", "S", "M", "L", "XL"];

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
    id: "stick-no-bills",
    name: "Stick No Bills",
    price: 1200,
    description:
      "A statement tee for those who refuse to be ignored. Bold graphics meet heavyweight cotton — built for the streets that don't sleep.",
    image_url: `/assets/products/stick-no-bills/image-1.jpg`,
    slug: "stick-no-bills",
    category: { name: "TEES" },
    metadata: {
      points: "200",
      gallery_images: GALLERY_IMAGES("stick-no-bills"),
      colors: [{ id: "default", name: "Standard", hex: "#ffffff" }],
    },
    variants: buildVariants("stick-no-bills"),
  },
  {
    id: "inspired",
    name: "Inspired",
    price: 1499,
    description:
      "Inspired by the rhythm of the city. A premium tee with a clean cut, archival-grade stitching, and a fit that moves with you.",
    image_url: `/assets/products/inspired/image-1.jpg`,
    slug: "inspired",
    category: { name: "TEES" },
    metadata: {
      points: "250",
      gallery_images: GALLERY_IMAGES("inspired"),
      colors: [{ id: "default", name: "Standard", hex: "#ffffff" }],
      model3d: "/models/inspired.glb",
    },
    variants: buildVariants("inspired"),
  },
  {
    id: "ctt-waffle",
    name: "CTT Waffle",
    price: 1799,
    description:
      "Waffle-knit texture engineered for depth and dimension. Heavyweight build, breathable structure — the daily uniform for the discerning.",
    image_url: `/assets/products/ctt-waffle/image-1.jpg`,
    slug: "ctt-waffle",
    category: { name: "HOODIES" },
    metadata: {
      points: "300",
      gallery_images: GALLERY_IMAGES("ctt-waffle"),
      colors: [{ id: "default", name: "Standard", hex: "#ffffff" }],
    },
    variants: buildVariants("ctt-waffle"),
  },
  {
    id: "brown-warrior",
    name: "Brown Warrior",
    price: 532,
    description:
      "Earthy tones meet urban durability. The Brown Warrior is a rugged essential built for layering and daily rotation. No pretense. Just presence.",
    image_url: `/assets/products/brown-warrior/image-1.jpg`,
    slug: "brown-warrior",
    category: { name: "OUTERWEAR" },
    metadata: {
      points: "100",
      gallery_images: GALLERY_IMAGES("brown-warrior"),
      colors: [{ id: "default", name: "Standard", hex: "#ffffff" }],
    },
    variants: buildVariants("brown-warrior"),
  },
  {
    id: "black-warrior",
    name: "Black Warrior",
    price: 7892,
    description:
      "The apex of the Warrior line. Precision-cut black fabric with a weight that commands attention. Limited-release archival piece.",
    image_url: `/assets/products/black-warrior/image-1.jpg`,
    slug: "black-warrior",
    category: { name: "OUTERWEAR" },
    metadata: {
      points: "500",
      gallery_images: GALLERY_IMAGES("black-warrior"),
      colors: [{ id: "default", name: "Standard", hex: "#ffffff" }],
    },
    variants: buildVariants("black-warrior"),
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
