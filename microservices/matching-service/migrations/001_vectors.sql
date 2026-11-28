CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE model_versions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name varchar(128) NOT NULL UNIQUE,architecture varchar(128) NOT NULL CHECK(architecture='siamese_bigru_attention'),
 vector_dimensions integer NOT NULL CHECK(vector_dimensions=128),metadata jsonb NOT NULL DEFAULT '{}',quality_gate_passed boolean NOT NULL DEFAULT false,
 artifact_hash char(64),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE embeddings(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),entity_type varchar(16) NOT NULL CHECK(entity_type IN ('resume','job')),entity_id uuid NOT NULL,
 owner_user_id uuid,model_version_id uuid NOT NULL REFERENCES model_versions(id),content_hash char(64) NOT NULL,embedding vector(128) NOT NULL,
 metadata jsonb NOT NULL DEFAULT '{}',embedded_at timestamptz NOT NULL DEFAULT now(),invalidated_at timestamptz,
 UNIQUE(entity_type,entity_id,model_version_id,content_hash)
);
CREATE INDEX idx_embeddings_entity ON embeddings(entity_type,entity_id,model_version_id) WHERE invalidated_at IS NULL;
CREATE INDEX idx_embeddings_metadata ON embeddings USING gin(metadata);
-- Exact cosine search is intentional. Add HNSW only after representative corpus benchmarks justify it.
CREATE TABLE match_results(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,resume_id uuid NOT NULL,job_id uuid NOT NULL,model_version_id uuid NOT NULL REFERENCES model_versions(id),input_hash char(64) NOT NULL,result jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(user_id,resume_id,job_id,model_version_id,input_hash));
CREATE TABLE processed_events(event_id uuid PRIMARY KEY,event_type text NOT NULL,processed_at timestamptz NOT NULL DEFAULT now());
