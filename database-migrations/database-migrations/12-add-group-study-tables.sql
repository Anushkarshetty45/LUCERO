-- CREATE GROUP STUDY SESSIONS TABLES
-- Run this in Supabase SQL Editor to enable group study functionality

-- ============================================
-- 1. CREATE group_study_sessions TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS group_study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  meeting_code TEXT UNIQUE NOT NULL,
  room_name TEXT UNIQUE NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 10
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_group_study_sessions_meeting_code
  ON group_study_sessions(meeting_code);
CREATE INDEX IF NOT EXISTS idx_group_study_sessions_host
  ON group_study_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_group_study_sessions_active
  ON group_study_sessions(is_active);

-- ============================================
-- 2. CREATE group_study_participants TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS group_study_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES group_study_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_currently_in_session BOOLEAN DEFAULT true,
  UNIQUE(session_id, user_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_group_study_participants_session
  ON group_study_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_group_study_participants_user
  ON group_study_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_group_study_participants_active
  ON group_study_participants(is_currently_in_session);

-- ============================================
-- 3. CREATE FUNCTION TO GENERATE MEETING CODE
-- ============================================

CREATE OR REPLACE FUNCTION generate_meeting_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclude confusing chars like I, O, 0, 1
  result TEXT := '';
  i INTEGER;
  code_exists BOOLEAN;
BEGIN
  LOOP
    result := '';
    -- Generate 6-character code
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;

    -- Check if code already exists
    SELECT EXISTS(
      SELECT 1 FROM group_study_sessions WHERE meeting_code = result
    ) INTO code_exists;

    -- If code is unique, return it
    IF NOT code_exists THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE group_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_study_participants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================

-- Policy: Users can view active sessions
CREATE POLICY "Users can view active group study sessions"
  ON group_study_sessions FOR SELECT
  USING (is_active = true);

-- Policy: Users can create their own sessions
CREATE POLICY "Users can create own group study sessions"
  ON group_study_sessions FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

-- Policy: Hosts can update their own sessions
CREATE POLICY "Hosts can update own group study sessions"
  ON group_study_sessions FOR UPDATE
  USING (auth.uid() = host_user_id);

-- Policy: Hosts can delete their own sessions
CREATE POLICY "Hosts can delete own group study sessions"
  ON group_study_sessions FOR DELETE
  USING (auth.uid() = host_user_id);

-- Policy: Users can view participants in sessions they're part of
CREATE POLICY "Users can view participants in their sessions"
  ON group_study_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_study_participants gsp
      WHERE gsp.session_id = group_study_participants.session_id
      AND gsp.user_id = auth.uid()
    )
  );

-- Policy: Users can join sessions (insert themselves as participants)
CREATE POLICY "Users can join group study sessions"
  ON group_study_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own participant record
CREATE POLICY "Users can update own participation"
  ON group_study_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Hosts can update any participant in their session
CREATE POLICY "Hosts can update participants in their sessions"
  ON group_study_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_study_sessions gss
      WHERE gss.id = group_study_participants.session_id
      AND gss.host_user_id = auth.uid()
    )
  );

-- ============================================
-- DONE!
-- ============================================
-- Group study tables are now created with:
-- - group_study_sessions table
-- - group_study_participants table
-- - generate_meeting_code() function
-- - RLS policies for secure access
