-- ====================================================================
-- FIX GROUP STUDY - Run this in Supabase SQL Editor
-- ====================================================================
-- This migration creates the Group Study feature tables and functions
-- Copy and paste this entire file into Supabase SQL Editor and run it
-- ====================================================================

-- 1. Drop existing tables if they have wrong schema (clean slate)
DROP TABLE IF EXISTS study_session_participants CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;

-- 2. Create study_sessions table with correct schema
CREATE TABLE study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_code VARCHAR(10) UNIQUE NOT NULL,
  room_name VARCHAR(100) NOT NULL,
  title VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 10
);

-- 3. Create study_session_participants table
CREATE TABLE study_session_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_currently_in_session BOOLEAN DEFAULT true,
  UNIQUE(session_id, user_id)
);

-- 4. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_study_sessions_meeting_code
  ON study_sessions(meeting_code);

CREATE INDEX IF NOT EXISTS idx_study_sessions_host
  ON study_sessions(host_user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_study_session_participants_session
  ON study_session_participants(session_id, is_currently_in_session);

CREATE INDEX IF NOT EXISTS idx_study_session_participants_user
  ON study_session_participants(user_id, is_currently_in_session);

-- 5. Enable Row Level Security
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_session_participants ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for study_sessions
DROP POLICY IF EXISTS "Users can view all active study sessions" ON study_sessions;
CREATE POLICY "Users can view all active study sessions"
  ON study_sessions FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can create their own study sessions" ON study_sessions;
CREATE POLICY "Users can create their own study sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

DROP POLICY IF EXISTS "Hosts can update their own study sessions" ON study_sessions;
CREATE POLICY "Hosts can update their own study sessions"
  ON study_sessions FOR UPDATE
  USING (auth.uid() = host_user_id);

DROP POLICY IF EXISTS "Hosts can delete their own study sessions" ON study_sessions;
CREATE POLICY "Hosts can delete their own study sessions"
  ON study_sessions FOR DELETE
  USING (auth.uid() = host_user_id);

-- 7. RLS Policies for study_session_participants
DROP POLICY IF EXISTS "Users can view participants of sessions they're in" ON study_session_participants;
CREATE POLICY "Users can view participants of sessions they're in"
  ON study_session_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    session_id IN (
      SELECT id FROM study_sessions WHERE host_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can join sessions as participants" ON study_session_participants;
CREATE POLICY "Users can join sessions as participants"
  ON study_session_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own participation" ON study_session_participants;
CREATE POLICY "Users can update their own participation"
  ON study_session_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- 8. Function to generate unique meeting code
CREATE OR REPLACE FUNCTION generate_meeting_code()
RETURNS VARCHAR(10) AS $$
DECLARE
  characters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result VARCHAR(10) := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(characters, floor(random() * length(characters) + 1)::int, 1);
    END LOOP;

    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM study_sessions WHERE meeting_code = result) INTO code_exists;

    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 9. Function to clean up old inactive sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_study_sessions()
RETURNS void AS $$
BEGIN
  UPDATE study_sessions
  SET is_active = false,
      ended_at = NOW()
  WHERE is_active = true
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- MIGRATION COMPLETE!
-- ====================================================================
-- The Group Study feature should now work properly.
-- You can test it by creating a new study session.
-- ====================================================================
