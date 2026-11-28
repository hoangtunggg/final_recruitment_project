-- Interview sessions run in ai-service; this service only binds each session id to its owner and meters usage.
CREATE TABLE interview_sessions (
  session_id varchar(128) PRIMARY KEY,
  user_id uuid NOT NULL,
  track varchar(64),
  level varchar(32),
  job_id uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  finalized_at timestamptz
);
CREATE INDEX idx_interview_sessions_user_day ON interview_sessions (user_id, started_at DESC);
