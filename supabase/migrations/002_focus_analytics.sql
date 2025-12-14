-- Focus Analytics System Migration
-- Phase 2: Advanced Study Session Tracking

-- ==================== FOCUS EVENTS TABLE ====================
-- Tracks individual focus events during study sessions
CREATE TABLE IF NOT EXISTS focus_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('face_detected', 'face_lost', 'looking_away', 'resumed_focus')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confidence DECIMAL(5,2), -- Face detection confidence (0-100)
  metadata JSONB, -- Additional data (head position, gaze direction, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_focus_events_session ON focus_events(session_id);
CREATE INDEX idx_focus_events_user ON focus_events(user_id);
CREATE INDEX idx_focus_events_timestamp ON focus_events(timestamp);

-- ==================== SESSION ANALYTICS TABLE ====================
-- Aggregated analytics for each study session
CREATE TABLE IF NOT EXISTS session_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES study_sessions(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  focus_score INTEGER NOT NULL CHECK (focus_score >= 0 AND focus_score <= 100),
  total_focused_time INTEGER NOT NULL DEFAULT 0, -- in seconds
  total_distracted_time INTEGER NOT NULL DEFAULT 0, -- in seconds
  distraction_count INTEGER NOT NULL DEFAULT 0,
  longest_focus_streak INTEGER NOT NULL DEFAULT 0, -- in seconds
  average_focus_streak INTEGER NOT NULL DEFAULT 0, -- in seconds
  focus_timeline JSONB, -- Array of {timestamp, type, duration} objects
  insights JSONB, -- AI-generated insights and recommendations
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_session_analytics_user ON session_analytics(user_id);
CREATE INDEX idx_session_analytics_score ON session_analytics(focus_score);

-- ==================== ACHIEVEMENTS TABLE ====================
-- Achievement definitions (static data)
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('focus', 'consistency', 'milestone', 'special')),
  criteria JSONB NOT NULL, -- Conditions to unlock
  points INTEGER NOT NULL DEFAULT 0,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default achievements
INSERT INTO achievements (id, name, description, icon, category, criteria, points, rarity) VALUES
  ('deep_focus_master', 'Deep Focus Master', 'Maintain focus for 60 minutes straight', '🏆', 'focus', '{"focusStreak": 3600}', 100, 'epic'),
  ('consistency_champion', 'Consistency Champion', 'Study for 7 days in a row', '🔥', 'consistency', '{"studyStreak": 7}', 150, 'rare'),
  ('early_bird', 'Early Bird', 'Start a study session before 8 AM', '🌅', 'special', '{"hourBefore": 8}', 50, 'common'),
  ('night_owl', 'Night Owl', 'Study after 10 PM', '🦉', 'special', '{"hourAfter": 22}', 50, 'common'),
  ('marathon_student', 'Marathon Student', 'Study for 4+ hours in one day', '🏃', 'milestone', '{"dailyMinutes": 240}', 200, 'legendary'),
  ('focus_warrior', 'Focus Warrior', 'Achieve 90%+ focus score in a session', '⚡', 'focus', '{"focusScore": 90}', 75, 'rare'),
  ('speed_learner', 'Speed Learner', 'Complete 5 topics in one session', '🚀', 'milestone', '{"topicsCompleted": 5}', 100, 'epic'),
  ('distraction_free', 'Distraction Free', 'Complete a 30-min session with 0 distractions', '🎯', 'focus', '{"distractionCount": 0, "minDuration": 1800}', 80, 'rare'),
  ('century_club', 'Century Club', 'Study for 100 hours total', '💯', 'milestone', '{"totalHours": 100}', 500, 'legendary'),
  ('perfect_week', 'Perfect Week', 'Maintain 85%+ avg focus score for a week', '⭐', 'consistency', '{"weeklyAvgScore": 85}', 250, 'epic')
ON CONFLICT (id) DO NOTHING;

-- ==================== USER ACHIEVEMENTS TABLE ====================
-- Track which achievements users have unlocked
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB, -- Context about how it was unlocked
  UNIQUE(user_id, achievement_id)
);

-- Indexes
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(unlocked_at);

-- ==================== DAILY STATISTICS TABLE ====================
-- Aggregated daily statistics for trend analysis
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_study_time INTEGER NOT NULL DEFAULT 0, -- in seconds
  total_focus_time INTEGER NOT NULL DEFAULT 0, -- in seconds
  average_focus_score INTEGER NOT NULL DEFAULT 0,
  best_focus_streak INTEGER NOT NULL DEFAULT 0, -- in seconds
  sessions_count INTEGER NOT NULL DEFAULT 0,
  distractions_count INTEGER NOT NULL DEFAULT 0,
  achievements_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes
CREATE INDEX idx_daily_stats_user ON daily_stats(user_id);
CREATE INDEX idx_daily_stats_date ON daily_stats(date);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE focus_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Focus Events Policies
CREATE POLICY "Users can view their own focus events"
  ON focus_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own focus events"
  ON focus_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Session Analytics Policies
CREATE POLICY "Users can view their own session analytics"
  ON session_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own session analytics"
  ON session_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own session analytics"
  ON session_analytics FOR UPDATE
  USING (auth.uid() = user_id);

-- Achievements Policies (read-only for users)
CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

-- User Achievements Policies
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Daily Stats Policies
CREATE POLICY "Users can view their own daily stats"
  ON daily_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily stats"
  ON daily_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily stats"
  ON daily_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ==================== FUNCTIONS ====================

-- Function to update daily stats
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_stats (user_id, date, sessions_count)
  VALUES (NEW.user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    sessions_count = daily_stats.sessions_count + 1,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update daily stats when session ends
CREATE TRIGGER update_daily_stats_trigger
AFTER UPDATE OF ended_at ON study_sessions
FOR EACH ROW
WHEN (NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL)
EXECUTE FUNCTION update_daily_stats();

-- Function to calculate focus score
CREATE OR REPLACE FUNCTION calculate_focus_score(
  p_session_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_total_time INTEGER;
  v_focused_time INTEGER;
  v_score INTEGER;
BEGIN
  -- Get total session duration
  SELECT EXTRACT(EPOCH FROM (ended_at - started_at))::INTEGER
  INTO v_total_time
  FROM study_sessions
  WHERE id = p_session_id;

  -- Get total focused time
  SELECT COALESCE(SUM(duration), 0)
  INTO v_focused_time
  FROM session_analytics
  WHERE session_id = p_session_id;

  -- Calculate score (focused time / total time * 100)
  IF v_total_time > 0 THEN
    v_score := ROUND((v_focused_time::DECIMAL / v_total_time) * 100);
  ELSE
    v_score := 0;
  END IF;

  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql;

-- ==================== COMMENTS ====================
COMMENT ON TABLE focus_events IS 'Records individual focus/distraction events during study sessions';
COMMENT ON TABLE session_analytics IS 'Aggregated analytics and metrics for completed study sessions';
COMMENT ON TABLE achievements IS 'Achievement definitions and criteria';
COMMENT ON TABLE user_achievements IS 'Tracks which achievements users have unlocked';
COMMENT ON TABLE daily_stats IS 'Daily aggregated statistics for trend analysis';
