CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), legacy_key varchar(255) UNIQUE, owner_user_id uuid NOT NULL,
  name varchar(255) NOT NULL, slug varchar(255) NOT NULL UNIQUE, description text, website text, logo_object_key text,
  location varchar(255), details jsonb NOT NULL DEFAULT '{}', status varchar(32) NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_companies_owner ON companies(owner_user_id);
CREATE INDEX idx_companies_details ON companies USING gin(details);
