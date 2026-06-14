-- Clear legacy inline base64 and mangled Supabase URLs from meals.image_url.
-- Those rows should rely on device-local copies or re-log with cloud backup enabled.
UPDATE meals
SET image_url = ''
WHERE image_url LIKE 'data:%'
   OR image_url LIKE '%data:image%'
   OR image_url LIKE '%data%3Aimage%';
