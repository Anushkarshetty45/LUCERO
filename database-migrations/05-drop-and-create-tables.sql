-- ============================================
-- DROP AND CREATE ALL TABLES FOR LUCERO
-- This will DELETE existing data in these tables!
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS user_notes CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS daily_activities CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;

-- ============================================
-- 1. COURSES TABLE
-- ============================================
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#8B5CF6',
  icon TEXT DEFAULT '📚',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_user_id ON courses(user_id);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own courses"
  ON courses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own courses"
  ON courses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own courses"
  ON courses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own courses"
  ON courses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. LESSONS TABLE
-- ============================================
CREATE TABLE lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_course_id ON lessons(course_id);
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view lessons of own courses"
  ON lessons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create lessons in own courses"
  ON lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update lessons in own courses"
  ON lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete lessons in own courses"
  ON lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = lessons.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- ============================================
-- 3. LESSON PROGRESS TABLE
-- ============================================
CREATE TABLE lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  time_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lesson progress"
  ON lesson_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own lesson progress"
  ON lesson_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lesson progress"
  ON lesson_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. MATERIALS TABLE
-- ============================================
CREATE TABLE materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'video', 'link', 'doc', 'other')),
  url TEXT NOT NULL,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_materials_lesson_id ON materials(lesson_id);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view materials of own courses"
  ON materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = materials.lesson_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create materials in own courses"
  ON materials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = materials.lesson_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update materials in own courses"
  ON materials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = materials.lesson_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete materials in own courses"
  ON materials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM lessons
      JOIN courses ON courses.id = lessons.course_id
      WHERE lessons.id = materials.lesson_id
      AND courses.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. DAILY ACTIVITIES TABLE
-- ============================================
CREATE TABLE daily_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_date DATE NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'study',
  minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

CREATE INDEX idx_daily_activities_user_date ON daily_activities(user_id, activity_date);
ALTER TABLE daily_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily activities"
  ON daily_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily activities"
  ON daily_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily activities"
  ON daily_activities FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 6. USER SETTINGS TABLE
-- ============================================
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  theme TEXT DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT true,
  study_goal_minutes INTEGER DEFAULT 120,
  focus_mode_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- 7. USER NOTES TABLE
-- ============================================
CREATE TABLE user_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX idx_user_notes_course_id ON user_notes(course_id);
CREATE INDEX idx_user_notes_lesson_id ON user_notes(lesson_id);
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON user_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes"
  ON user_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON user_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON user_notes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT '✅ All 7 tables created successfully!' AS status;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('courses', 'lessons', 'lesson_progress', 'materials', 'daily_activities', 'user_settings', 'user_notes')
ORDER BY table_name;
