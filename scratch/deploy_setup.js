const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

// Manual parse of .env.local to avoid 'dotenv' package dependency
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const parts = trimmed.split("=");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join("=").trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("[deploy-setup] Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

async function main() {
  console.log("[deploy-setup] Connecting to Supabase storage panel...");

  // 1. Create/Verify tryon-results storage bucket
  const BUCKET_NAME = "tryon-results";
  console.log(`[deploy-setup] Checking if storage bucket '${BUCKET_NAME}' exists...`);
  
  const { data: buckets, error: getError } = await supabase.storage.listBuckets();
  
  if (getError) {
    console.error("[deploy-setup] Failed to retrieve storage buckets:", getError.message);
    process.exit(1);
  }

  const exists = buckets.some(b => b.name === BUCKET_NAME);

  if (exists) {
    console.log(`[deploy-setup] Storage bucket '${BUCKET_NAME}' already exists!`);
  } else {
    console.log(`[deploy-setup] Bucket missing. Programmatically creating public bucket '${BUCKET_NAME}'...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      fileSizeLimit: 8388608 // 8MB
    });

    if (createError) {
      console.error("[deploy-setup] Failed to create bucket programmatically:", createError.message);
      console.log("[deploy-setup] NOTE: Please manually create the bucket 'tryon-results' in your Supabase storage panel.");
    } else {
      console.log(`[deploy-setup] Success! Public bucket '${BUCKET_NAME}' successfully created.`);
    }
  }

  // 2. Database migration validation
  console.log("[deploy-setup] Verifying if table 'ai_tryon_logs' exists in the database...");
  const { data, error } = await supabase.from("ai_tryon_logs").select("id").limit(1);

  if (error) {
    if (error.code === "PGRST116" || error.message.includes("does not exist") || error.message.includes("undefined")) {
      console.log("[deploy-setup] Migration Status: NOT YET DEPLOYED.");
      console.log("[deploy-setup] IMPORTANT: Please copy the contents of 'supabase/migrations/00015_ai_tryon.sql' and execute it in your Supabase SQL Editor.");
    } else {
      console.error("[deploy-setup] Database query failed:", error.message);
    }
  } else {
    console.log("[deploy-setup] Migration Status: DEPLOYED SUCCESS! Table 'ai_tryon_logs' is fully accessible.");
  }
}

main().catch(console.error);
