CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE profiles (
  user_id uuid PRIMARY KEY, legacy_user_id bigint UNIQUE, phone varchar(64), profile_picture text, resume_path text,
  skills jsonb NOT NULL DEFAULT '[]', experience jsonb NOT NULL DEFAULT '[]', education jsonb NOT NULL DEFAULT '[]',
  bio text, location varchar(255), website text, linkedin text, github text,
  applications_count integer NOT NULL DEFAULT 0 CHECK (applications_count >= 0), saved_jobs_count integer NOT NULL DEFAULT 0 CHECK (saved_jobs_count >= 0),
  subscription jsonb NOT NULL DEFAULT '{"plan":"free","expiresAt":null}', employer_details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_skills ON profiles USING gin (skills);
CREATE INDEX idx_profiles_employer_details ON profiles USING gin (employer_details);
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), legacy_id bigint UNIQUE, category varchar(64) NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}', updated_by uuid, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), legacy_id bigint UNIQUE, action varchar(64) NOT NULL,
  target_user_id uuid, performed_by uuid, details jsonb NOT NULL DEFAULT '{}', ip_address inet, user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor_created ON audit_logs (performed_by, created_at DESC);
CREATE INDEX idx_audit_target_created ON audit_logs (target_user_id, created_at DESC);
CREATE INDEX idx_audit_details ON audit_logs USING gin (details);
