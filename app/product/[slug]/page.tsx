import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import MobilePurchaseBar from "@/components/product/MobilePurchaseBar";
import ProductStory from "@/components/sections/product/ProductStory";
import MacroDetails from "@/components/sections/product/MacroDetails";
import ProductDetails from "@/components/sections/product/ProductDetails";
import EditorialLooks from "@/components/sections/product/EditorialLooks";

// Mock Data
const productData = {
  title: "SRH Jersey 01",
  tagline: "Performance Meets Street",
  price: "$120.00",
  description: "An uncompromising approach to athletic aesthetics. Engineered with heavyweight custom milled fabric, offering a structural drape that defies standard sportswear. Designed in London, meticulously crafted for the streets.",
  images: [
    "/assets/srh-jersey.jpg",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=1400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1400&auto=format&fit=crop"
  ],
  dropMetadata: {
    dropNumber: "DROP 01",
    releaseType: "LIMITED RELEASE",
    fabricDetails: "100% HEAVYWEIGHT COTTON",
    gsmInfo: "320 GSM / STRUCTURAL FIT"
  },
  fitIntelligence: {
    modelInfo: "Model is 6'2\" wearing size L",
    fitType: "Oversized Boxy",
    trueToSize: true
  },
  colors: [
    { id: "black", name: "Onyx Black", hex: "#0a0a0a" },
    { id: "white", name: "Bone White", hex: "#f0f0f0" },
    { id: "volt", name: "Volt", hex: "#d4ff1e" }
  ],
  sizes: ["S", "M", "L", "XL"]
};

const storyData = {
  headline: "Defy The Standard",
  sublines: [
    "We stripped away everything unnecessary.",
    "What remains is a pure expression of form and function.",
    "Heavyweight structural fabric that dictates its own silhouette.",
    "This is not a garment. It is an architecture for movement."
  ]
};

const macroImages = [
  {
    src: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1200&auto=format&fit=crop",
    label: "320GSM TEXTURE"
  },
  {
    src: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop",
    label: "REINFORCED STITCHING"
  },
  {
    src: "https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=1200&auto=format&fit=crop",
    label: "CUSTOM COLLAR RIBBING"
  },
  {
    src: "https://images.unsplash.com/photo-1550639524-a6f58345a278?q=80&w=1200&auto=format&fit=crop",
    label: "HEAVYWEIGHT DRAPE"
  }
];

const detailSpecs = [
  {
    title: "Fabric & Construction",
    content: "320 GSM custom-milled heavyweight cotton.\nDouble-needle stitched shoulders, waist, and cuffs for premium durability.\nGarment-dyed for a rich, uncompromising color depth that will not fade."
  },
  {
    title: "Fit Intelligence",
    content: "Engineered for an oversized, boxy drape. Dropped shoulder seams enhance the relaxed architectural silhouette.\nTake your normal size for the intended oversized look. Size down for a standard fit."
  },
  {
    title: "Care Protocol",
    content: "Machine wash cold with like colors.\nLay flat to dry to preserve structural integrity.\nDo not bleach. Do not iron over print."
  },
  {
    title: "Shipping & Returns",
    content: "Complimentary global shipping on all limited drop releases.\nReturns accepted within 14 days of delivery provided the garment remains in unworn, original condition with all tags attached."
  }
];

const editorialLooks = [
  {
    id: "look-01",
    number: "01",
    title: "The Core System",
    image: "/assets/hero-tees.png",
    href: "/product/core-tee"
  },
  {
    id: "look-02",
    number: "02",
    title: "Athletic Precision",
    image: "/assets/run-shorts.jpeg",
    href: "/product/run-shorts"
  }
];

export function generateStaticParams() {
  return [
    { slug: 'example-slug' },
    { slug: 'srh-jersey-01' }
  ];
}

export default function ProductDetailPage() {
  return (
    <>
      <div className="relative pt-24 md:pt-32">
        {/* Cinematic Product Hero */}
        <div className="mx-auto max-w-[1800px] px-0 md:px-8 lg:px-12">
          <div className="flex flex-col-reverse lg:flex-row lg:items-end lg:gap-0">
            {/* Left: Sticky Product Info (45%) */}
            <div className="relative z-20 w-full px-6 pb-24 pt-12 lg:sticky lg:bottom-12 lg:w-[45%] lg:px-0 lg:pb-12 lg:-mr-12 xl:-mr-24">
              <ProductInfo
                title={productData.title}
                tagline={productData.tagline}
                price={productData.price}
                description={productData.description}
                dropMetadata={productData.dropMetadata}
                fitIntelligence={productData.fitIntelligence}
                colors={productData.colors}
                sizes={productData.sizes}
              />
            </div>

            {/* Right: Oversized Image Gallery (55%) */}
            <div className="relative z-10 w-full lg:w-[55%]">
              <ProductGallery images={productData.images} />
            </div>
          </div>
        </div>
      </div>

      <ProductStory headline={storyData.headline} sublines={storyData.sublines} />
      
      <MacroDetails images={macroImages} />
      
      <ProductDetails details={detailSpecs} />
      
      <EditorialLooks looks={editorialLooks} />

      <MobilePurchaseBar price={productData.price} />
    </>
  );
}
