import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("ai_tryon_saves")
      .select(
        "id, image_url, product_title, product_slug, product_id, product_image_url, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ai-tryon/saves] list error:", error);
      return NextResponse.json({ items: [] });
    }

    const items = (data ?? []).map((row) => ({
      id: row.id as string,
      imageUrl: row.image_url as string,
      productTitle: row.product_title as string,
      productSlug: row.product_slug as string | null,
      productId: row.product_id as string | null,
      productImageUrl: row.product_image_url as string | null,
      createdAt: row.created_at as string,
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[ai-tryon/saves] unexpected:", err);
    return NextResponse.json({ items: [] });
  }
}

export async function DELETE(req: Request) {
  try {
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: row } = await supabase
      .from("ai_tryon_saves")
      .select("id, storage_path")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!row) {
      return NextResponse.json({ ok: true });
    }

    if (row.storage_path) {
      await supabase.storage.from("tryon-saves").remove([row.storage_path]);
    }

    await supabase
      .from("ai_tryon_saves")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ai-tryon/saves] delete unexpected:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
