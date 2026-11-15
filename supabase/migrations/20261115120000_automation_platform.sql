-- AI and automation assets (n8n workflow packs, AI agent kits) are a platform
-- of their own. Postgres cannot use a new enum value in the transaction that
-- adds it, so the categories that use it are in the next migration.
alter type public.platform_type add value if not exists 'automation';
