import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TRYON_SAVES_MAX } from "@/lib/tryon-saves/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "tryon-saves";
const MAX_BYTES = 8 * 1024 * 1024;

type SaveBody = {
  resultUrl?: string;
  productTitle?: string;
  productSlug?: string;
  productId?: string;
  productImageUrl?: string;
};

function guessExt(contentType: string, url: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (url.includes(".png")) return "png";
  if (url.includes(".webp")) return "webp";
  return "jpg";
}

export async function POST(req: Request) {
  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as SaveBody;
    const rawUrl = body.resultUrl?.trim();
    const productTitle = body.productTitle?.trim() || "StreetplayR try-on";

    if (!rawUrl) {
      return NextResponse.json(
        { error: "A valid try-on image URL is required." },
        { status: 400 }
      );
    }

    const resultUrl = rawUrl;
    const isHttp = /^https?:\/\//i.test(resultUrl);
    const isData = resultUrl.startsWith("data:image/");
    if (!isHttp && !isData) {
      return NextResponse.json(
        { error: "A valid try-on image URL is required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Cap gallery size
    const { count } = await supabase
      .from("ai_tryon_saves")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (typeof count === "number" && count >= TRYON_SAVES_MAX) {
      return NextResponse.json(
        {
          error: `Gallery full (${TRYON_SAVES_MAX}). Remove an older try-on first.`,
        },
        { status: 429 }
      );
    }

    let buffer: Buffer;
    let contentType = "image/jpeg";

    if (resultUrl.startsWith("data:image/")) {
      const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(resultUrl);
      if (!match) {
        return NextResponse.json({ error: "Invalid data URL." }, { status: 400 });
      }
      contentType = match[1];
      buffer = Buffer.from(match[2], "base64");
    } else {
      const imgRes = await fetch(resultUrl);
      if (!imgRes.ok) {
        return NextResponse.json(
          { error: "Could not fetch try-on image to save." },
          { status: 502 }
        );
      }
      contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const ab = await imgRes.arrayBuffer();
      buffer = Buffer.from(ab);
    }

    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image too large to save (max 8 MB)." },
        { status: 413 }
      );
    }

    const ext = guessExt(contentType, resultUrl);
    const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("[ai-tryon/save] upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to store try-on image." },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const imageUrl = urlData.publicUrl;

    const row = {
      user_id: user.id,
      product_id: body.productId ?? null,
      product_slug: body.productSlug ?? null,
      product_title: productTitle,
      product_image_url: body.productImageUrl ?? null,
      image_url: imageUrl,
      storage_path: storagePath,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("ai_tryon_saves")
      .insert(row)
      .select("id, image_url, product_title, product_slug, product_id, product_image_url, created_at")
      .single();

    if (insertError || !inserted) {
      console.error("[ai-tryon/save] insert error:", insertError);
      // Still return URL so client can keep a local copy
      return NextResponse.json({
        item: {
          id: crypto.randomUUID(),
          imageUrl,
          productTitle,
          productSlug: body.productSlug ?? null,
          productId: body.productId ?? null,
          productImageUrl: body.productImageUrl ?? null,
          createdAt: new Date().toISOString(),
        },
        warning: "Stored image but database insert failed.",
      });
    }

    return NextResponse.json({
      item: {
        id: inserted.id,
        imageUrl: inserted.image_url,
        productTitle: inserted.product_title,
        productSlug: inserted.product_slug,
        productId: inserted.product_id,
        productImageUrl: inserted.product_image_url,
        createdAt: inserted.created_at,
      },
    });
  } catch (err) {
    console.error("[ai-tryon/save] unexpected:", err);
    return NextResponse.json(
      { error: "Save failed unexpectedly." },
      { status: 500 }
    );
  }
}
