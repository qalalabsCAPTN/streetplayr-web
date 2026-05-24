import { NextResponse } from "next/server";
import { Client } from "@gradio/client";

export const runtime = "nodejs";
export const maxDuration = 60; // HF Space can be slow when cold

export async function POST(req: Request) {
  try {
    const { userImageUrl, garmentImageUrl } = await req.json();

    if (!userImageUrl || !garmentImageUrl) {
      return NextResponse.json(
        { error: "Missing userImageUrl or garmentImageUrl" },
        { status: 400 }
      );
    }

    // Connect to the free public Kolors Virtual Try-On Space on HuggingFace
    const client = await Client.connect("Kwai-Kolors/Kolors-Virtual-Try-On");

    const result = await client.predict("/tryon", {
      human_img: { url: userImageUrl },
      garm_img: { url: garmentImageUrl },
      garment_des: "streetwear garment",
      is_checked: true,
      is_checked_crop: false,
      denoise_steps: 30,
      seed: 42,
    });

    // The Space returns an array — first element is the result image
    const data = result.data as Array<{ url?: string } | string | null>;
    const output =
      typeof data[0] === "object" && data[0] !== null
        ? (data[0] as { url?: string }).url
        : typeof data[0] === "string"
        ? data[0]
        : null;

    if (!output) {
      return NextResponse.json(
        { error: "Model returned no output. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ output });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("[ai-tryon] HuggingFace error:", message);

    // Surface queue/rate-limit errors clearly
    if (message.includes("queue") || message.includes("too many")) {
      return NextResponse.json(
        { error: "HuggingFace queue is busy. Try again in a moment." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
