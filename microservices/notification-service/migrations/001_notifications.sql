CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE notifications(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),legacy_id bigint UNIQUE,user_id uuid NOT NULL,title varchar(255) NOT NULL,message text NOT NULL,type varchar(32) NOT NULL DEFAULT 'info' CHECK(type IN ('info','success','warning','error','job_alert','application_status','system')),priority varchar(16) NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),is_read boolean NOT NULL DEFAULT false,read_at timestamptz,link text,metadata jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id,is_read,created_at DESC);
CREATE INDEX idx_notifications_metadata ON notifications USING gin(metadata);
CREATE TABLE processed_events(event_id uuid PRIMARY KEY,event_type text NOT NULL,processed_at timestamptz NOT NULL DEFAULT now());
