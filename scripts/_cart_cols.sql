SELECT column_name||':'||data_type AS col FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('cart_items','carts') ORDER BY table_name, ordinal_position;
