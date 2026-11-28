ALTER TABLE companies
  ADD COLUMN cover_object_key text,
  ADD COLUMN logo_mime_type varchar(64),
  ADD COLUMN cover_mime_type varchar(64);

CREATE UNIQUE INDEX uq_companies_owner ON companies(owner_user_id);
