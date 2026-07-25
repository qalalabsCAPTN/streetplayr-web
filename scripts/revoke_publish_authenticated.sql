REVOKE ALL ON FUNCTION public.publish_page_blocks(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_page_blocks(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.publish_page_blocks(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.publish_page_blocks(UUID, TEXT) TO service_role;
