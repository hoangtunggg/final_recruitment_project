CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE resumes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), legacy_id bigint UNIQUE, user_id uuid NOT NULL,
 original_name varchar(255) NOT NULL, object_key text NOT NULL UNIQUE, file_size bigint NOT NULL CHECK(file_size BETWEEN 1 AND 5242880),
 mime_type varchar(128) NOT NULL CHECK(mime_type IN ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
 is_default boolean NOT NULL DEFAULT false, content_hash char(64) NOT NULL, legacy_content bytea,
 metadata jsonb NOT NULL DEFAULT '{}', version integer NOT NULL DEFAULT 1 CHECK(version > 0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz
);
CREATE INDEX idx_resumes_owner ON resumes(user_id,created_at DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uq_resumes_default ON resumes(user_id) WHERE is_default AND deleted_at IS NULL;
CREATE INDEX idx_resumes_metadata ON resumes USING gin(metadata);
CREATE TABLE outbox_events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),aggregate_type text NOT NULL,aggregate_id uuid NOT NULL,event_type text NOT NULL,event_version integer NOT NULL DEFAULT 1,payload jsonb NOT NULL,attempts integer NOT NULL DEFAULT 0,created_at timestamptz NOT NULL DEFAULT now(),published_at timestamptz);
CREATE INDEX idx_outbox_unpublished ON outbox_events(created_at) WHERE published_at IS NULL;
