CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), legacy_id bigint UNIQUE, company_id uuid, company varchar(255) NOT NULL,
  employer_id uuid, title varchar(255) NOT NULL, location varchar(255) NOT NULL, description text NOT NULL, requirements text NOT NULL,
  responsibilities text, education text, benefits text, application_deadline timestamptz, contact_email varchar(320), contact_phone varchar(64), salary varchar(128),
  type varchar(32) NOT NULL CHECK(type IN ('Full-time','Part-time','Contract','Internship','Temporary')),
  experience varchar(32) NOT NULL CHECK(experience IN ('Entry Level','Mid Level','Senior Level','Lead','Manager')),
  skills jsonb NOT NULL DEFAULT '[]', status varchar(32) NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','filled','Draft','Published','Closed')),
  approval_status varchar(32) NOT NULL DEFAULT 'approved' CHECK(approval_status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_jobs_public ON jobs(status,approval_status,created_at DESC);
CREATE INDEX idx_jobs_employer ON jobs(employer_id,created_at DESC);
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_skills ON jobs USING gin(skills);
CREATE INDEX idx_jobs_search ON jobs USING gin(to_tsvector('simple',coalesce(title,'')||' '||coalesce(company,'')||' '||coalesce(description,'')));
CREATE TABLE outbox_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),aggregate_type text NOT NULL,aggregate_id uuid NOT NULL,event_type text NOT NULL,event_version integer NOT NULL DEFAULT 1,payload jsonb NOT NULL,attempts integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),published_at timestamptz);
CREATE INDEX idx_outbox_unpublished ON outbox_events(created_at) WHERE published_at IS NULL;
