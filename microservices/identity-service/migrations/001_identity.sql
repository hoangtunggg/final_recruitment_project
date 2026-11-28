CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_id bigint UNIQUE,
  name varchar(255) NOT NULL CHECK (length(trim(name)) > 0),
  email varchar(320) NOT NULL,
  password_hash varchar(255) NOT NULL,
  role varchar(32) NOT NULL DEFAULT 'jobseeker' CHECK (role IN ('jobseeker','employer','admin')),
  status varchar(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','blocked')),
  email_verified boolean NOT NULL DEFAULT false,
  email_verification_token varchar(255),
  password_reset_token varchar(255),
  password_reset_expires timestamptz,
  last_login timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_users_email_ci ON users (lower(email));
CREATE INDEX idx_users_role_status ON users (role, status);
CREATE TABLE outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), aggregate_type text NOT NULL, aggregate_id uuid NOT NULL,
  event_type text NOT NULL, event_version integer NOT NULL DEFAULT 1 CHECK (event_version > 0), payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0), created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz
);
CREATE INDEX idx_outbox_unpublished ON outbox_events (created_at) WHERE published_at IS NULL;
