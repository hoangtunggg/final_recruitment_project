-- Daily budget of paid helper calls (TTS, STT, CV / JD parsing) per user; see session-store.js takeHelperCall.
CREATE TABLE interview_helper_usage (
  user_id uuid NOT NULL,
  day date NOT NULL,
  calls integer NOT NULL DEFAULT 0 CHECK (calls >= 0),
  PRIMARY KEY (user_id, day)
);
