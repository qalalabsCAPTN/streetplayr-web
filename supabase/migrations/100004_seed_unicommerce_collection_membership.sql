-- Expand storefront collection membership for UniCommerce + legacy slugs.
-- Safe to re-run.

UPDATE public.products
SET status = 'draft'
WHERE slug = 'rls-debug-1778380302382';

INSERT INTO public.collection_products (collection_id, product_id, sort_order)
SELECT c.id, p.id, 0
FROM public.products p
JOIN public.collections c ON c.slug = 'tees'
WHERE p.status = 'active'
  AND (
    p.slug LIKE 'PS-TEE-%'
    OR p.slug IN ('ctt-waffle', 'black-warrior', 'inspired', 'warrior-bob', 'warrior-tee', 'limited-edition-tee')
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.collection_products (collection_id, product_id, sort_order)
SELECT c.id, p.id, 0
FROM public.products p
JOIN public.collections c ON c.slug = 'tanks'
WHERE p.status = 'active'
  AND (p.slug LIKE 'PS-TNK-%' OR p.slug IN ('star-tank-dark'))
ON CONFLICT DO NOTHING;

INSERT INTO public.collection_products (collection_id, product_id, sort_order)
SELECT c.id, p.id, 0
FROM public.products p
JOIN public.collections c ON c.slug = 'pants'
WHERE p.status = 'active'
  AND (p.slug LIKE 'PS-PNT-%' OR p.slug IN ('carpenter-grey'))
ON CONFLICT DO NOTHING;

INSERT INTO public.collection_products (collection_id, product_id, sort_order)
SELECT c.id, p.id, 0
FROM public.products p
JOIN public.collections c ON c.slug = 'long-sleeve'
WHERE p.status = 'active' AND p.slug IN ('stick-no-bills')
ON CONFLICT DO NOTHING;

INSERT INTO public.collection_products (collection_id, product_id, sort_order)
SELECT c.id, p.id, 0
FROM public.products p
JOIN public.collections c ON c.slug = 'hoodies'
WHERE p.status = 'active' AND p.slug IN ('urban-hoodie')
ON CONFLICT DO NOTHING;

INSERT INTO public.collection_products (collection_id, product_id, sort_order)
SELECT c.id, p.id, 0
FROM public.products p
JOIN public.collections c ON c.slug = 'latest-drop'
WHERE p.status = 'active'
  AND (
    p.slug LIKE 'PS-TEE-%'
    OR p.slug LIKE 'PS-TNK-%'
    OR p.slug IN (
      'ctt-waffle', 'black-warrior', 'inspired', 'stick-no-bills',
      'warrior-tee', 'star-tank-dark'
    )
  )
ON CONFLICT DO NOTHING;
