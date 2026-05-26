import { NextResponse } from "next/server";
import { Client, handle_file } from "@gradio/client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { userImageUrl, garmentImageUrl } = await req.json();

    if (!userImageUrl || !garmentImageUrl) {
      return NextResponse.json(
        { error: "Missing userImageUrl or garmentImageUrl" },
        { status: 400 }
      );
    }

    // IDM-VTON on HuggingFace — API confirmed open via /info endpoint
    // Space: https://huggingface.co/spaces/yisol/IDM-VTON
    const client = await Client.connect("yisol/IDM-VTON");

    // handle_file() is the correct way to pass image URLs to Gradio client
    // The ImageEditor dict needs background as a handle_file reference
    const result = await client.predict("/tryon", {
      dict: {
        background: handle_file(userImageUrl),
        layers: [],
        composite: handle_file(userImageUrl), // composite = same as background for auto-mask
      },
      garm_img: handle_file(garmentImageUrl),
      garment_des: "streetwear garment",
      is_checked: true,       // auto-masking ON
      is_checked_crop: false,
      denoise_steps: 30,
      seed: 42,
    });

    // Returns [output_image, masked_image] — first is the try-on result
    const data = result.data as Array<{ url?: string; path?: string } | null>;
    const first = data[0];
    const output =
      first && typeof first === "object"
        ? (first.url ?? first.path ?? null)
        : null;

    if (!output) {
      console.error("[ai-tryon] No output in result.data:", data);
      return NextResponse.json(
        { error: "Model returned no output. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ output });
  } catch (err: unknown) {
    let message = "Unknown error occurred";
    let isGradioError = false;

    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    } else if (err && typeof err === "object") {
      const e = err as Record<string, unknown>;
      isGradioError = e.type === "status";
      // Extract human-readable message from Gradio status error
      message = (e.message as string) || (e.title as string) || JSON.stringify(err);
    }

    console.error("[ai-tryon] raw error:", err);
    console.error("[ai-tryon] message:", message);

    if (isGradioError) {
      return NextResponse.json(
        { error: "The AI model is temporarily unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }

    if (message.toLowerCase().includes("queue") || message.toLowerCase().includes("too many")) {
      return NextResponse.json(
        { error: "The AI model is busy right now. Please try again shortly." },
        { status: 503 }
      );
    }

    if (message.toLowerCase().includes("timeout")) {
      return NextResponse.json(
        { error: "Request timed out. Please try again." },
        { status: 504 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
