-- Cloud backup is included with LifePlate Plus (is_paid); separate opt-in column removed.

ALTER TABLE users DROP COLUMN IF EXISTS cloud_image_backup;
