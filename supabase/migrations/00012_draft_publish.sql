-- ============================================================================
-- NECTAR CMS — Staging & Published Content Slots
-- ============================================================================
-- Adds a separate column for published content to separate draft revisions.
-- Fully idempotent. Run AFTER 00011_page_editor.sql.
-- ============================================================================

ALTER TABLE page_blocks 
  ADD COLUMN IF NOT EXISTS published_content JSONB DEFAULT NULL;

-- Backfill published_content with the current content for zero-regression rollout
UPDATE page_blocks 
SET published_content = content 
WHERE published_content IS NULL;

-- Atomic publish RPC helper to promote draft content to published content
CREATE OR REPLACE FUNCTION publish_page_blocks(
  p_site_id   UUID,
  p_page_slug TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE page_blocks
  SET published_content = content
  WHERE site_id = p_site_id AND page_slug = p_page_slug;
END;
$$;

