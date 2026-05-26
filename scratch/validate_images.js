const fs = require("fs");
const path = require("path");
const { GoogleGenAI, RawReferenceImage, SubjectReferenceImage, SubjectReferenceType, PersonGeneration } = require("@google/genai");

// Define user photos (publicly accessible high-quality portrait URLs)
const USER_PHOTOS = [
  {
    name: "user_photo_1",
    url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "user_photo_2",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "user_photo_3",
    url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop"
  }
];

// Define product configurations
const PRODUCTS = [
  { id: "inspired", name: "Inspired Hoodie", imagePath: "public/assets/products/inspired/image-1.jpg" },
  { id: "stick-no-bills", name: "Stick No Bills Tee", imagePath: "public/assets/products/stick-no-bills/image-1.jpg" },
  { id: "brown-warrior", name: "Brown Warrior Jacket", imagePath: "public/assets/products/brown-warrior/image-1.jpg" },
  { id: "black-warrior", name: "Black Warrior Jacket", imagePath: "public/assets/products/black-warrior/image-1.jpg" },
  { id: "ctt-waffle", name: "CTT Waffle Longsleeve", imagePath: "public/assets/products/ctt-waffle/image-1.jpg" }
];

const ARTIFACTS_DIR = "C:\\Users\\pc\\.gemini\\antigravity\\brain\\7f565ede-ddf1-4031-b278-e9cd0542556b";
const apiKey = "AIzaSyD9kfWQkVLEzHMseDy-DcerK9fEPGR8T2s";

async function fetchImageAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: status ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    base64: buffer.toString("base64"),
    mimeType: res.headers.get("content-type") || "image/jpeg"
  };
}

async function run() {
  console.log("[validate] Initializing Google GenAI SDK...");
  const ai = new GoogleGenAI({ apiKey });

  // Pre-fetch user photos to save time during generation loop
  console.log("[validate] Pre-fetching user photos from Unsplash...");
  const userImages = [];
  for (const user of USER_PHOTOS) {
    console.log(`[validate] Fetching ${user.name}...`);
    const imgData = await fetchImageAsBase64(user.url);
    userImages.push({ name: user.name, ...imgData });
  }

  // Iterate over products and generate try-ons
  for (const prod of PRODUCTS) {
    console.log(`\n========================================`);
    console.log(`[validate] Starting product: ${prod.name}`);
    console.log(`========================================`);

    // Read local product garment image
    const fullGarmentPath = path.resolve(prod.imagePath);
    if (!fs.existsSync(fullGarmentPath)) {
      console.error(`[validate] Error: Local garment image does not exist: ${fullGarmentPath}`);
      continue;
    }
    const garmentBuffer = fs.readFileSync(fullGarmentPath);
    const garmentBase64 = garmentBuffer.toString("base64");
    const garmentMimeType = "image/jpeg";

    for (let i = 0; i < userImages.length; i++) {
      const userImg = userImages[i];
      const userIndex = i + 1;
      console.log(`\n[validate] Pass #${userIndex} using ${userImg.name}...`);

      try {
        // Construct reference images
        const garmentRef = new SubjectReferenceImage();
        garmentRef.referenceImage = {
          imageBytes: garmentBase64,
          mimeType: garmentMimeType,
        };
        garmentRef.referenceId = 1;
        garmentRef.config = {
          subjectType: SubjectReferenceType.SUBJECT_TYPE_PRODUCT,
          subjectDescription: prod.name,
        };

        const userRef = new RawReferenceImage();
        userRef.referenceImage = {
          imageBytes: userImg.base64,
          mimeType: userImg.mimeType,
        };
        userRef.referenceId = 2;

        const prompt = `Take the product from reference image [1] and generate a realistic, high-quality, professional e-commerce fashion photo showing the person in reference image [2] wearing it. The garment should fit naturally, adjusting perfectly to their body shape and pose, with realistic fabric folds, shadows, and lighting matching the original photo scene. Ensure the person's face, identity, hair, hands, skin tone, and features remain completely unchanged and identical. The background should match reference image [2].`;

        console.log(`[validate] Calling editImage...`);
        const response = await ai.models.editImage({
          model: "imagen-3.0-generate-002",
          prompt,
          referenceImages: [garmentRef, userRef],
          config: {
            numberOfImages: 1,
            aspectRatio: "3:4",
            personGeneration: PersonGeneration.ALLOW_ADULT,
            outputMimeType: "image/jpeg",
            addWatermark: false,
          },
        });

        const generatedImage = response.generatedImages?.[0];
        if (!generatedImage || !generatedImage.image?.imageBytes) {
          throw new Error("No image bytes returned in API response.");
        }

        const outBuffer = Buffer.from(generatedImage.image.imageBytes, "base64");
        const outFilename = `${prod.id}_tryon_${userIndex}.jpg`;
        const outPath = path.join(ARTIFACTS_DIR, outFilename);
        
        fs.writeFileSync(outPath, outBuffer);
        console.log(`[validate] Success! Saved output to: ${outPath}`);
      } catch (err) {
        console.error(`[validate] Pass #${userIndex} failed:`, err.message);
      }
    }
  }

  console.log("\n[validate] Validation testing completed.");
}

run().catch(console.error);
