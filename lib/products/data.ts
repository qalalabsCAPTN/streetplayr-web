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
    image_url: `/assets/products/ctt-waffle/image-1.jpg`,
    slug: "ctt-waffle",
    category: { name: "TEES" },
    metadata: {
      points: "300",
      gallery_images: GALLERY_IMAGES("ctt-waffle"),
      colors: [
        { id: "white", name: "White", hex: "#f5f5f0", images: GALLERY_IMAGES("ctt-waffle") },
        { id: "maroon", name: "Maroon", hex: "#6b1c2a", images: GALLERY_IMAGES("ctt-maroon") },
      ],
    },
    variants: buildVariants("ctt-waffle"),
  },
  {
    id: "warrior-tee",
    name: "WARRIOR Tee",
    price: 1999,
    description:
      "Made from heavyweight premium cotton terry, this oversized T-shirt is designed for all-day comfort and a structured drape. Signature aligned puff print detailing around the neckline and back adds a distinctive, elevated finish",
    image_url: `/assets/products/black-warrior/image-1.jpg`,
    slug: "black-warrior",
    category: { name: "TEES" },
    metadata: {
      points: "300",
      gallery_images: GALLERY_IMAGES("black-warrior"),
      colors: [
        { id: "black", name: "Black", hex: "#1a1a1a", images: GALLERY_IMAGES("black-warrior") },
        { id: "brown", name: "Brown", hex: "#5c3a2e", images: GALLERY_IMAGES("brown-warrior") },
      ],
    },
    variants: buildVariants("black-warrior"),
  },
  {
    id: "inspired",
    name: "INSPIRED Tee",
    price: 2499,
    description:
      "Made from premium single jersey cotton for a soft, lightweight feel, this oversized T-shirt combines a unique purple acid-washed finish with a striking white screen print for elevated everyday wear.",
    image_url: `/assets/products/inspired/image-1.jpg`,
    slug: "inspired",
    category: { name: "TEES" },
    metadata: {
      points: "350",
      gallery_images: GALLERY_IMAGES("inspired"),
      colors: [
        { id: "purple", name: "Purple", hex: "#4a2d6b", images: GALLERY_IMAGES("inspired") },
      ],
      model3d: "/models/inspired.glb",
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
      gallery_images: GALLERY_IMAGES("star-tank-dark"),
      colors: [
        { id: "dark", name: "Dark", hex: "#1a1a1a", images: GALLERY_IMAGES("star-tank-dark") },
      ],
    },
    variants: buildVariants("star-tank-dark"),
  },
  {
    id: "olive-pant",
    name: "playR Sweats",
    price: 3499,
    description:
      "Relaxed, baggy sweatpants crafted from premium heavyweight cotton fleece for everyday comfort. Finished with a signature woven playR patch and subtle design detailing on the left leg, they strike the perfect balance between clean minimalism and understated streetwear. Soft, durable, and made to be worn on repeat.",
    image_url: `/assets/products/olive-pant/image-1.jpg`,
    slug: "olive-pant",
    category: { name: "PANTS" },
    metadata: {
      points: "500",
      gallery_images: GALLERY_IMAGES("olive-pant"),
      colors: [
        { id: "black", name: "Black", hex: "#1a1a1a", images: GALLERY_IMAGES("olive-pant") },
      ],
    },
    variants: buildVariants("olive-pant"),
  },
  {
    id: "carpenter-grey",
    name: "Carpenter Pants",
    price: 3699,
    description:
      "Crafted from premium heavyweight fabric, the playR Carpenter Pants are designed for everyday comfort with a clean, timeless silhouette. Featuring a relaxed fit, subtle carpenter-inspired detailing, and a discreet side pocket for quick access to your phone or everyday essentials, they balance functionality with effortless style. Minimal, durable, and versatile, they're built to pair seamlessly with any outfit.",
    image_url: `/assets/products/carpenter-grey/image-1.jpg`,
    slug: "carpenter-grey",
    category: { name: "PANTS" },
    metadata: {
      points: "500",
      gallery_images: GALLERY_IMAGES("carpenter-grey"),
      colors: [
        { id: "grey", name: "Grey", hex: "#8a8a8a", images: GALLERY_IMAGES("carpenter-grey") },
      ],
    },
    variants: buildVariants("carpenter-grey"),
  },
  {
    id: "stick-no-bills",
    name: "Stick No Bills",
    price: 1999,
    description:
      "A statement tee for those who refuse to be ignored. Bold graphics meet heavyweight cotton — built for the streets that don't sleep.",
    image_url: `/assets/products/stick-no-bills/image-1.jpg`,
    slug: "stick-no-bills",
    category: { name: "TEES" },
    metadata: {
      points: "200",
      gallery_images: GALLERY_IMAGES("stick-no-bills"),
      colors: [
        { id: "default", name: "Standard", hex: "#ffffff", images: GALLERY_IMAGES("stick-no-bills") },
      ],
    },
    variants: buildVariants("stick-no-bills"),
  },
  {
    id: "warrior-bob",
    name: "WARRIOR Bob",
    price: 1999,
    description:
      "The boldest cut in the Warrior family. Heavyweight cotton terry with an oversized silhouette and signature puff print detailing — raw, structured, unapologetic.",
    image_url: `/assets/products/warrior-bob/image-1.jpg`,
    slug: "warrior-bob",
    category: { name: "TEES" },
    metadata: {
      points: "300",
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
