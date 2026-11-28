ALTER TABLE jobs
  ADD COLUMN image_object_key text,
  ADD COLUMN image_mime_type varchar(64);
