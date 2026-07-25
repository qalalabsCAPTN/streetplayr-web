SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN (
  'wallet_transactions','wallet_accounts','nectar_wallet_transactions',
  'reward_rules','reward_executions','reward_redemptions'
)
ORDER BY table_name, ordinal_position;
