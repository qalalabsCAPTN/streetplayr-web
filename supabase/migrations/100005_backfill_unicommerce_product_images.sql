-- Backfill featured images for UniCommerce streetwear SKUs from local /assets/products packs.
-- Safe to re-run.

UPDATE public.products SET
  featured_image_url = '/assets/products/ctt-waffle/image-1.webp',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'gallery_images', '["/assets/products/ctt-waffle/image-1.webp","/assets/products/ctt-waffle/image-2.jpg","/assets/products/ctt-waffle/image-3.jpg","/assets/products/ctt-waffle/image-4.jpg","/assets/products/ctt-waffle/image-5.webp"]'::jsonb
  )
WHERE slug = 'PS-TEE-CRT-WHT';

UPDATE public.products SET
  featured_image_url = '/assets/products/ctt-maroon/image-1.jpg',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'gallery_images', '["/assets/products/ctt-maroon/image-1.jpg","/assets/products/ctt-maroon/image-2.jpg","/assets/products/ctt-maroon/image-3.jpg","/assets/products/ctt-maroon/image-4.jpg","/assets/products/ctt-maroon/image-5.jpg"]'::jsonb
  )
WHERE slug = 'PS-TEE-CRT-RED';

UPDATE public.products SET
  featured_image_url = '/assets/products/black-warrior/image-1.webp',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'gallery_images', '["/assets/products/black-warrior/image-1.webp","/assets/products/black-warrior/image-2.jpg","/assets/products/black-warrior/image-3.webp","/assets/products/black-warrior/image-4.jpg","/assets/products/black-warrior/image-5.webp"]'::jsonb
  )
WHERE slug IN ('PS-TEE-WAR-BLK', 'warrior-tee');

UPDATE public.products SET
  featured_image_url = '/assets/products/brown-warrior/image-1.webp',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'gallery_images', '["/assets/products/brown-warrior/image-1.webp","/assets/products/brown-warrior/image-2.jpg","/assets/products/brown-warrior/image-3.webp","/assets/products/brown-warrior/image-4.jpg","/assets/products/brown-warrior/image-5.webp"]'::jsonb
  )
WHERE slug = 'PS-TEE-WAR-BRW';

UPDATE public.products SET
  featured_image_url = '/assets/products/inspired/image-1.webp',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'gallery_images', '["/assets/products/inspired/image-1.webp","/assets/products/inspired/image-2.jpg","/assets/products/inspired/image-3.webp","/assets/products/inspired/image-4.jpg","/assets/products/inspired/image-5.webp"]'::jsonb
  )
WHERE slug IN ('PS-TEE-INS-PRP', 'inspired');

UPDATE public.products SET
  featured_image_url = '/assets/products/star-tank-dark/image-1.jpg',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'gallery_images', '["/assets/products/star-tank-dark/image-1.jpg","/assets/products/star-tank-dark/image-2.jpg","/assets/products/star-tank-dark/image-3.jpg","/assets/products/star-tank-dark/image-4.jpg","/assets/products/star-tank-dark/image-5.jpg"]'::jsonb
  )
WHERE slug IN ('PS-TNK-STR-BLK', 'PS-TNK-STR-WHT', 'star-tank-dark');

UPDATE public.products SET
  featured_image_url = '/assets/products/carpenter-grey/image-1.jpg',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'gallery_images', '["/assets/products/carpenter-grey/image-1.jpg","/assets/products/carpenter-grey/image-2.jpg","/assets/products/carpenter-grey/image-3.jpg","/assets/products/carpenter-grey/image-4.jpg","/assets/products/carpenter-grey/image-5.jpg"]'::jsonb
  )
WHERE slug IN ('PS-PNT-CARP-GRY', 'PS-PNT-CORE-BLK', 'PS-PNT-CORE-CRM', 'carpenter-grey');

UPDATE public.products SET
  featured_image_url = '/assets/products/carpenter-olive/image-1.jpg',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'gallery_images', '["/assets/products/carpenter-olive/image-1.jpg","/assets/products/carpenter-olive/image-2.jpg","/assets/products/carpenter-olive/image-3.jpg","/assets/products/carpenter-olive/image-4.jpg","/assets/products/carpenter-olive/image-5.jpg"]'::jsonb
  )
WHERE slug = 'PS-PNT-CARP-GRN';

UPDATE public.products SET
  featured_image_url = '/assets/products/stick-no-bills/image-1.jpg',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'gallery_images', '["/assets/products/stick-no-bills/image-1.jpg","/assets/products/stick-no-bills/image-2.jpg","/assets/products/stick-no-bills/image-3.jpg","/assets/products/stick-no-bills/image-4.jpg","/assets/products/stick-no-bills/image-5.jpg"]'::jsonb
  )
WHERE slug = 'stick-no-bills';

UPDATE public.products SET
  featured_image_url = '/assets/products/warrior-bob/image-1.webp',
  metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
    'gallery_images', '["/assets/products/warrior-bob/image-1.webp","/assets/products/warrior-bob/image-2.jpg","/assets/products/warrior-bob/image-3.jpg","/assets/products/warrior-bob/image-4.jpg","/assets/products/warrior-bob/image-5.jpg"]'::jsonb
  )
WHERE slug = 'warrior-bob';
