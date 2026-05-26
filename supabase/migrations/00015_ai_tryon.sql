-- Migration: Add AI Try-On Logs table for audit, billing, and rate-limiting
CREATE TABLE IF NOT EXISTS ai_tryon_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id   TEXT,
  provider     TEXT NOT NULL, -- 'gemini' | 'idmvton'
  status       TEXT NOT NULL, -- 'pending' | 'success' | 'error'
  duration_ms  INTEGER,
  error_msg    TEXT,
  result_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for daily query speed and efficient rate-limit lookups
CREATE INDEX IF NOT EXISTS idx_ai_tryon_logs_user_date ON ai_tryon_logs (user_id, created_at, status);
CREATE INDEX IF NOT EXISTS idx_ai_tryon_logs_date_status ON ai_tryon_logs (created_at, status);

-- Enable RLS
ALTER TABLE ai_tryon_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view their own logs; service role has full bypass
CREATE POLICY "Users can view their own AI tryon logs"
  ON ai_tryon_logs FOR SELECT
  USING (auth.uid() = user_id);
