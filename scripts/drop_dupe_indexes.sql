-- Drop advisor-reported duplicate indexes (keep longer-named / clearer ones)
DROP INDEX IF EXISTS public.idx_nwt_user_id;
DROP INDEX IF EXISTS public.idx_re_user_id;
DROP INDEX IF EXISTS public.idx_wallet_accounts_user_id;
