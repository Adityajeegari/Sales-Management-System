-- Drizzle/SQL migration template: add sales_os_user_id, backfill from clerk_user_id

BEGIN TRANSACTION;

ALTER TABLE user_roles ADD COLUMN sales_os_user_id VARCHAR(255);
ALTER TABLE users ADD COLUMN sales_os_user_id VARCHAR(255);

-- Backfill (batch this for large tables)
UPDATE user_roles SET sales_os_user_id = clerk_user_id WHERE sales_os_user_id IS NULL AND clerk_user_id IS NOT NULL;
UPDATE users SET sales_os_user_id = clerk_user_id WHERE sales_os_user_id IS NULL AND clerk_user_id IS NOT NULL;

COMMIT;

-- After deploying application code that writes both columns and reads the new column,
-- schedule a later migration to drop the old columns:
-- ALTER TABLE user_roles DROP COLUMN clerk_user_id;
-- ALTER TABLE users DROP COLUMN clerk_user_id;
