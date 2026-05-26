import { GoogleGenAI, RawReferenceImage, SubjectReferenceImage, SubjectReferenceType, PersonGeneration } from "@google/genai";

/**
 * Helper to fetch a public URL and convert it to a base64 string.
 */
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = res.headers.get("content-type") || "image/jpeg";
    return {
      base64: buffer.toString("base64"),
      mimeType,
    };
  } catch (error) {
    console.error(`[ai-tryon/gemini] Failed to fetch image from URL: ${url}`, error);
    throw new Error(`Failed to fetch input image for AI try-on: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Triggers the Gemini/Imagen 3 image editing API to perform a virtual try-on.
 * Takes the person's image and the garment's image, and generates a composite.
 * Returns a Buffer of the generated JPEG image.
 */
export async function generateTryOnGemini(
  userImageUrl: string,
  garmentImageUrl: string,
  productTitle: string
): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_AI_API_KEY in environment variables.");
  }

  // 1. Fetch both images and convert to base64 for inline SDK transmission
  const [userImg, garmentImg] = await Promise.all([
    fetchImageAsBase64(userImageUrl),
    fetchImageAsBase64(garmentImageUrl),
  ]);

  // 2. Initialize Gemini SDK
  const ai = new GoogleGenAI({ apiKey });

  // 3. Construct reference images
  // Reference ID 1: The product garment (Subject)
  const garmentRef = new SubjectReferenceImage();
  garmentRef.referenceImage = {
    imageBytes: garmentImg.base64,
    mimeType: garmentImg.mimeType,
  };
  garmentRef.referenceId = 1;
  garmentRef.config = {
    subjectType: SubjectReferenceType.SUBJECT_TYPE_PRODUCT,
    subjectDescription: productTitle || "streetwear clothing garment",
  };

  // Reference ID 2: The person (Raw/Base image to edit)
  const userRef = new RawReferenceImage();
  userRef.referenceImage = {
    imageBytes: userImg.base64,
    mimeType: userImg.mimeType,
  };
  userRef.referenceId = 2;

  // 4. Formulate the composition prompt using reference IDs [1] and [2]
  const prompt = `Take the product from reference image [1] and generate a realistic, high-quality, professional e-commerce fashion photo showing the person in reference image [2] wearing it. The garment should fit naturally, adjusting perfectly to their body shape and pose, with realistic fabric folds, shadows, and lighting matching the original photo scene. Ensure the person's face, identity, hair, hands, skin tone, and features remain completely unchanged and identical. The background should match reference image [2].`;

  const modelName = process.env.AI_TRYON_MODEL || "imagen-3.0-generate-002";

  console.log(`[ai-tryon/gemini] Invoking editImage on ${modelName} with prompt length: ${prompt.length}`);

  // 5. Trigger the edit API
  const response = await ai.models.editImage({
    model: modelName,
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
    if (generatedImage?.raiFilteredReason) {
      throw new Error(`AI Try-On request was filtered by safety policies: ${generatedImage.raiFilteredReason}`);
    }
    throw new Error("Gemini API completed but did not return any image data.");
  }

  // 6. Return Buffer
  return Buffer.from(generatedImage.image.imageBytes, "base64");
}
