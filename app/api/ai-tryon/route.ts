import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTryOnGemini } from "@/lib/ai-tryon/gemini";
import { generateTryOnIdmVton } from "@/lib/ai-tryon/idmvton";

export const runtime = "nodejs";
export const maxDuration = 60; // AI try-on can take up to 60s

const RESULTS_BUCKET = "tryon-results";

export async function POST(req: Request) {
  const startTime = Date.now();
  
  // 1. Authenticate user via Supabase SSR client
  const clientSupabase = await createClient();
  const { data: { user } } = await clientSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in to use AI Try-On." },
      { status: 401 }
    );
  }

  // 2. Parse request body
  let userImageUrl: string;
  let garmentImageUrl: string;
  let productTitle = "streetwear garment";
  let productId = "";

  try {
    const body = await req.json();
    userImageUrl = body.userImageUrl;
    garmentImageUrl = body.garmentImageUrl;
    if (body.productTitle) productTitle = body.productTitle;
    if (body.productId) productId = body.productId;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  if (!userImageUrl || !garmentImageUrl) {
    return NextResponse.json(
      { error: "Missing userImageUrl or garmentImageUrl parameters." },
      { status: 400 }
    );
  }

  // Create an admin client to bypass RLS for aggregate check & log inserting
  const adminSupabase = createAdminClient();
  
  // 3. Resolve today's date in UTC for calendar rate-limiting
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  // 4. Rate limiting: Count total store generations today (Cost Cap)
  const storeLimit = parseInt(process.env.AI_TRYON_DAILY_LIMIT || "500", 10);
  const { count: storeCount, error: storeCountErr } = await adminSupabase
    .from("ai_tryon_logs")
    .select("*", { count: "exact", head: true })
    .eq("status", "success")
    .gte("created_at", todayISO);

  if (storeCountErr) {
    console.error("[ai-tryon] Error counting store usage:", storeCountErr);
  } else if (storeCount !== null && storeCount >= storeLimit) {
    console.warn(`[ai-tryon] Store-wide daily limit of ${storeLimit} reached.`);
    return NextResponse.json(
      { error: "The AI try-on system has reached its daily quota limit. Please try again tomorrow." },
      { status: 503 }
    );
  }

  // 5. Rate limiting: Count current user generations today (Abuse Protection)
  const userLimit = parseInt(process.env.AI_TRYON_USER_DAILY_LIMIT || "3", 10);
  const { count: userCount, error: userCountErr } = await adminSupabase
    .from("ai_tryon_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "success")
    .gte("created_at", todayISO);

  if (userCountErr) {
    console.error("[ai-tryon] Error counting user usage:", userCountErr);
  } else if (userCount !== null && userCount >= userLimit) {
    console.warn(`[ai-tryon] User ${user.id} reached daily limit of ${userLimit}.`);
    return NextResponse.json(
      { error: `You have reached your daily limit of ${userLimit} try-ons. Please try again tomorrow.` },
      { status: 429 }
    );
  }

  // 6. Setup provider abstraction
  const provider = (process.env.AI_TRYON_PROVIDER || "idmvton").toLowerCase();
  
  if (provider !== "gemini" && provider !== "idmvton") {
    return NextResponse.json(
      { error: "AI Try-On provider is misconfigured or disabled." },
      { status: 500 }
    );
  }

  // 7. Insert initial PENDING log row in DB
  const { data: logRow, error: logInsertErr } = await adminSupabase
    .from("ai_tryon_logs")
    .insert({
      user_id: user.id,
      product_id: productId || productTitle,
      provider,
      status: "pending",
    })
    .select()
    .single();

  if (logInsertErr) {
    console.error("[ai-tryon] Failed to insert initial log row:", logInsertErr);
  }

  const logId = logRow?.id;

  try {
    let resultBuffer: Buffer;

    if (provider === "gemini") {
      // Execute Gemini/Imagen 3 pipeline (returns Buffer)
      resultBuffer = await generateTryOnGemini(userImageUrl, garmentImageUrl, productTitle);
    } else {
      // Execute legacy HF IDM-VTON pipeline (returns remote temporary URL string)
      const hfUrl = await generateTryOnIdmVton(userImageUrl, garmentImageUrl);
      
      // Download remote HF image buffer to persist inside our own results bucket
      const downloadRes = await fetch(hfUrl);
      if (!downloadRes.ok) {
        throw new Error(`Failed to download image from HuggingFace space: status ${downloadRes.status}`);
      }
      resultBuffer = Buffer.from(await downloadRes.arrayBuffer());
    }

    // 8. Upload resulting image buffer to manual results bucket
    const ext = "jpg";
    const filename = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

    const { error: uploadError } = await adminSupabase.storage
      .from(RESULTS_BUCKET)
      .upload(filename, resultBuffer, {
        contentType: "image/jpeg",
        cacheControl: "604800", // 7 days CDN cache
        upsert: false,
      });

    if (uploadError) {
      console.error("[ai-tryon] Supabase upload to results bucket failed:", uploadError);
      throw new Error("Failed to store generated try-on output inside cloud storage.");
    }

    // Get the public URL of our persistent bucket storage
    const { data: urlData } = adminSupabase.storage.from(RESULTS_BUCKET).getPublicUrl(filename);
    const publicUrl = urlData.publicUrl;

    const duration = Date.now() - startTime;

    // 9. Update DB log row to SUCCESS
    if (logId) {
      const { error: logUpdateErr } = await adminSupabase
        .from("ai_tryon_logs")
        .update({
          status: "success",
          duration_ms: duration,
          result_url: publicUrl,
        })
        .eq("id", logId);

      if (logUpdateErr) {
        console.error("[ai-tryon] Failed to update success log row:", logUpdateErr);
      }
    }

    return NextResponse.json({ output: publicUrl });
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[ai-tryon] Generation failed via ${provider}:`, errorMsg);

    // 10. Update DB log row to ERROR
    if (logId) {
      const { error: logUpdateErr } = await adminSupabase
        .from("ai_tryon_logs")
        .update({
          status: "error",
          duration_ms: duration,
          error_msg: errorMsg.slice(0, 1000), // safe truncation
        })
        .eq("id", logId);

      if (logUpdateErr) {
        console.error("[ai-tryon] Failed to update error log row:", logUpdateErr);
      }
    }

    // Standard user-friendly error codes
    let status = 500;
    let message = "AI Try-On generation failed. Please try again.";

    if (errorMsg.includes("filtered by safety policies")) {
      status = 400;
      message = "Your request was declined because the uploaded photo or product did not comply with safety policies.";
    } else if (errorMsg.toLowerCase().includes("timeout")) {
      status = 504;
      message = "AI generation timed out. Please try again in a moment.";
    } else if (errorMsg.toLowerCase().includes("busy") || errorMsg.toLowerCase().includes("queue")) {
      status = 503;
      message = "The AI servers are currently busy. Please try again shortly.";
    }

    return NextResponse.json({ error: message, details: errorMsg }, { status });
  }
}
