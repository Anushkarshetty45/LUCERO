-- ============================================
-- LUCERO - COMPLETE DATABASE SETUP
-- Run this AFTER running CLEANUP.sql
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================

CREATE TABLE profiles (
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. AUTO-CREATE PROFILE ON SIGNUP
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 3. STUDY SESSIONS TABLE
-- ============================================

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

-- Indexes for faster lookups
CREATE INDEX idx_study_sessions_meeting_code ON study_sessions(meeting_code);
CREATE INDEX idx_study_sessions_host ON study_sessions(host_user_id, is_active);

-- Enable RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all active study sessions"
  ON study_sessions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can create their own study sessions"
  ON study_sessions FOR INSERT
  WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update their own study sessions"
  ON study_sessions FOR UPDATE
  USING (auth.uid() = host_user_id);

CREATE POLICY "Hosts can delete their own study sessions"
  ON study_sessions FOR DELETE
  USING (auth.uid() = host_user_id);

-- ============================================
-- 4. STUDY SESSION PARTICIPANTS TABLE
-- ============================================

CREATE TABLE study_session_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  is_currently_in_session BOOLEAN DEFAULT true,
  UNIQUE(session_id, user_id)
);

-- Indexes
CREATE INDEX idx_study_session_participants_session
  ON study_session_participants(session_id, is_currently_in_session);

CREATE INDEX idx_study_session_participants_user
  ON study_session_participants(user_id, is_currently_in_session);

-- Enable RLS
ALTER TABLE study_session_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view participants of sessions they're in"
  ON study_session_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    session_id IN (
      SELECT id FROM study_sessions WHERE host_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join sessions as participants"
  ON study_session_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON study_session_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Generate unique meeting codes
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

-- Cleanup old sessions (run periodically)
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
-- SETUP COMPLETE! ✅
-- ============================================

SELECT 'Database setup completed successfully! ✅' AS status;
