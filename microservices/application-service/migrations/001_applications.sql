CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE applications(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),legacy_id bigint UNIQUE,user_id uuid,job_id uuid NOT NULL,resume_id uuid,
 applicant_name varchar(255) NOT NULL,applicant_email varchar(320) NOT NULL,applicant_phone varchar(64),cover_letter text,experience text,education text,
 skills jsonb NOT NULL DEFAULT '[]',expected_salary varchar(128),availability varchar(32) NOT NULL DEFAULT 'Immediate' CHECK(availability IN ('Immediate','1-2 weeks','2-4 weeks','1 month notice','2 months notice')),
 status varchar(32) NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','under_review','shortlisted','interview_scheduled','interviewed','offered','accepted','rejected','withdrawn')),
 notes text,job_snapshot jsonb NOT NULL,document jsonb,legacy_file_content bytea,is_verified boolean NOT NULL DEFAULT false,email_verified boolean NOT NULL DEFAULT false,
 verification_token varchar(255),ip_address inet,user_agent text,risk_score integer NOT NULL DEFAULT 0 CHECK(risk_score BETWEEN 0 AND 100),flagged boolean NOT NULL DEFAULT false,
 application_date timestamptz NOT NULL DEFAULT now(),last_updated timestamptz NOT NULL DEFAULT now(),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_applications_user_date ON applications(user_id,application_date DESC);
CREATE INDEX idx_applications_job_date ON applications(job_id,application_date DESC);
CREATE INDEX idx_applications_email_date ON applications(lower(applicant_email),application_date DESC);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_job_snapshot ON applications USING gin(job_snapshot);
CREATE UNIQUE INDEX uq_active_application ON applications(user_id,job_id) WHERE status <> 'withdrawn';
CREATE TABLE outbox_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),aggregate_type text NOT NULL,aggregate_id uuid NOT NULL,event_type text NOT NULL,event_version integer NOT NULL DEFAULT 1,payload jsonb NOT NULL,attempts integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),published_at timestamptz);
CREATE INDEX idx_outbox_unpublished ON outbox_events(created_at) WHERE published_at IS NULL;
