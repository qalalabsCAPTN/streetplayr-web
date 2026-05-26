import { Client, handle_file } from "@gradio/client";

/**
 * Triggers the open HuggingFace Space IDM-VTON try-on API.
 * Returns the public temporary URL or path of the resulting try-on image.
 */
export async function generateTryOnIdmVton(
  userImageUrl: string,
  garmentImageUrl: string
): Promise<string> {
  console.log("[ai-tryon/idmvton] Connecting to yisol/IDM-VTON space...");
  const client = await Client.connect("yisol/IDM-VTON");

  console.log("[ai-tryon/idmvton] Triggering predict /tryon...");
  const result = await client.predict("/tryon", {
    dict: {
      background: handle_file(userImageUrl),
      layers: [],
      composite: handle_file(userImageUrl), // composite = same as background for auto-masking
    },
    garm_img: handle_file(garmentImageUrl),
    garment_des: "streetwear garment",
    is_checked: true, // auto-masking ON
    is_checked_crop: false,
    denoise_steps: 30,
    seed: 42,
  });

  const data = result.data as Array<{ url?: string; path?: string } | null>;
  const first = data[0];
  const output =
    first && typeof first === "object"
      ? (first.url ?? first.path ?? null)
      : null;

  if (!output) {
    console.error("[ai-tryon/idmvton] Predict returned no output image. result.data:", data);
    throw new Error("IDM-VTON space did not return any output image.");
  }

  return output;
}
