-- COMPLETE DATABASE SETUP FOR LUCERO
-- Run this entire file in Supabase SQL Editor

-- ============================================
-- 1. CREATE PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE RLS POLICIES FOR PROFILES
-- ============================================

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. CREATE AUTO-PROFILE TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (
    id,
    email,
    username,
    first_name,
    last_name,
    full_name,
    avatar_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 5. CREATE STUDY SESSIONS TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS study_sessions (
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

CREATE TABLE IF NOT EXISTS study_session_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_currently_in_session BOOLEAN DEFAULT true,
  UNIQUE(session_id, user_id)
);

-- ============================================
-- 6. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_study_sessions_meeting_code
  ON study_sessions(meeting_code);

CREATE INDEX IF NOT EXISTS idx_study_sessions_host
  ON study_sessions(host_user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_study_session_participants_session
  ON study_session_participants(session_id, is_currently_in_session);

CREATE INDEX IF NOT EXISTS idx_study_session_participants_user
  ON study_session_participants(user_id, is_currently_in_session);

-- ============================================
-- 7. ENABLE RLS FOR STUDY SESSIONS
-- ============================================

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_session_participants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. CREATE RLS POLICIES FOR STUDY SESSIONS
-- ============================================

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

-- ============================================
-- 9. CREATE RLS POLICIES FOR PARTICIPANTS
-- ============================================

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

-- ============================================
-- 10. CREATE HELPER FUNCTIONS
-- ============================================

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

    SELECT EXISTS(SELECT 1 FROM study_sessions WHERE meeting_code = result) INTO code_exists;

    IF NOT code_exists THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

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

-- ============================================
-- SETUP COMPLETE!
-- ============================================
