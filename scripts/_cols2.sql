SELECT table_name||'.'||column_name AS col FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('wallet_transactions','reward_redemptions','wallet_accounts','reward_rules','reward_executions')
ORDER BY 1;
SELECT tablename||':'||cmd||':'||policyname AS pol FROM pg_policies
WHERE schemaname='public' AND tablename IN ('wallet_transactions','reward_redemptions','wallet_accounts','reward_rules','reward_executions','nectar_wallet_transactions','profiles','orders')
ORDER BY 1;
