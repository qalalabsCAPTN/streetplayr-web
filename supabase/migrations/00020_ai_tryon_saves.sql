-- Profile gallery of saved AI Try-On results (multi-garment, many photos)
CREATE TABLE IF NOT EXISTS ai_tryon_saves (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id        TEXT,
  product_slug      TEXT,
  product_title     TEXT NOT NULL,
  product_image_url TEXT,
  image_url         TEXT NOT NULL,
  storage_path      TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_tryon_saves_user_created
  ON ai_tryon_saves (user_id, created_at DESC);

ALTER TABLE ai_tryon_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own try-on saves"
  ON ai_tryon_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own try-on saves"
  ON ai_tryon_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own try-on saves"
  ON ai_tryon_saves FOR DELETE
  USING (auth.uid() = user_id);

-- Durable bucket for profile saves (temp uploads stay in tryon-temp)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tryon-saves',
  'tryon-saves',
  true,
  8388608,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
