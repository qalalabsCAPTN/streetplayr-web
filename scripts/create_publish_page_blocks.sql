-- Ensure hardened publish_page_blocks exists (was missing on staging)
CREATE OR REPLACE FUNCTION public.publish_page_blocks(p_site_id UUID, p_page_slug TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' AND NOT public.is_ops_role() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.page_blocks
  SET published_content = content
  WHERE site_id = p_site_id AND page_slug = p_page_slug;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_page_blocks(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_page_blocks(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.publish_page_blocks(UUID, TEXT) FROM authenticated;
-- App publishes via server action + service_role admin client
GRANT EXECUTE ON FUNCTION public.publish_page_blocks(UUID, TEXT) TO service_role;
