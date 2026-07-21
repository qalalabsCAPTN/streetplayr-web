-- 00016_ecommerce_production_fix.sql
-- Production consolidation migration for Streetplayr e-commerce

-- 1. Ensure profiles table has missing columns
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS sprr_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'STREET';

-- 2. Create wallet_transactions table if not exists
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount NUMERIC NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet transactions" 
  ON public.wallet_transactions FOR SELECT 
  USING (auth.uid() = user_id);

-- 3. Create collections and collection_products if not exists
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_products (
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, product_id)
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for collections" 
  ON public.collections FOR SELECT USING (true);

CREATE POLICY "Public read access for collection_products" 
  ON public.collection_products FOR SELECT USING (true);

-- 4. Create operational_events table for OpsOS logging
CREATE TABLE IF NOT EXISTS public.operational_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  action TEXT NOT NULL,
  severity TEXT DEFAULT 'info',
  actor_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.operational_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view operational events" 
  ON public.operational_events FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.role = 'super_admin' OR profiles.role = 'admin')
    )
  );
