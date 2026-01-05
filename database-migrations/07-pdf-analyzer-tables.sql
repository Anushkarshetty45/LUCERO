-- ============================================
-- PDF ANALYZER TABLES FOR LUCERO
-- Creates all tables needed for PDF analysis features
-- ============================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS pdf_translations CASCADE;
DROP TABLE IF EXISTS pdf_mind_maps CASCADE;
DROP TABLE IF EXISTS pdf_study_plans CASCADE;
DROP TABLE IF EXISTS pdf_chat_messages CASCADE;
DROP TABLE IF EXISTS pdf_chat_sessions CASCADE;
DROP TABLE IF EXISTS pdf_quiz_attempts CASCADE;
DROP TABLE IF EXISTS pdf_quizzes CASCADE;
DROP TABLE IF EXISTS pdf_flashcards CASCADE;
DROP TABLE IF EXISTS pdf_analyses CASCADE;

-- ============================================
-- 1. PDF ANALYSES TABLE
-- ============================================
CREATE TABLE pdf_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  explanation TEXT NOT NULL,
  key_terms JSONB DEFAULT '[]',
  page_count INTEGER DEFAULT 0,
  analyzed_pages TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_analyses_user_id ON pdf_analyses(user_id);
CREATE INDEX idx_pdf_analyses_course_id ON pdf_analyses(course_id);
ALTER TABLE pdf_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own PDF analyses" ON pdf_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own PDF analyses" ON pdf_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own PDF analyses" ON pdf_analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own PDF analyses" ON pdf_analyses FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 2. PDF FLASHCARDS TABLE
-- ============================================
CREATE TABLE pdf_flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_flashcards_analysis_id ON pdf_flashcards(pdf_analysis_id);
ALTER TABLE pdf_flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view flashcards from own analyses" ON pdf_flashcards FOR SELECT USING (
  EXISTS (SELECT 1 FROM pdf_analyses WHERE pdf_analyses.id = pdf_flashcards.pdf_analysis_id AND pdf_analyses.user_id = auth.uid())
);
CREATE POLICY "Users can create flashcards for own analyses" ON pdf_flashcards FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pdf_analyses WHERE pdf_analyses.id = pdf_flashcards.pdf_analysis_id AND pdf_analyses.user_id = auth.uid())
);
CREATE POLICY "Users can delete flashcards from own analyses" ON pdf_flashcards FOR DELETE USING (
  EXISTS (SELECT 1 FROM pdf_analyses WHERE pdf_analyses.id = pdf_flashcards.pdf_analysis_id AND pdf_analyses.user_id = auth.uid())
);

-- ============================================
-- 3. PDF QUIZZES TABLE
-- ============================================
CREATE TABLE pdf_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_quizzes_analysis_id ON pdf_quizzes(pdf_analysis_id);
ALTER TABLE pdf_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quizzes from own analyses" ON pdf_quizzes FOR SELECT USING (
  EXISTS (SELECT 1 FROM pdf_analyses WHERE pdf_analyses.id = pdf_quizzes.pdf_analysis_id AND pdf_analyses.user_id = auth.uid())
);
CREATE POLICY "Users can create quizzes for own analyses" ON pdf_quizzes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pdf_analyses WHERE pdf_analyses.id = pdf_quizzes.pdf_analysis_id AND pdf_analyses.user_id = auth.uid())
);

-- ============================================
-- 4. PDF QUIZ ATTEMPTS TABLE
-- ============================================
CREATE TABLE pdf_quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pdf_quiz_id UUID REFERENCES pdf_quizzes(id) ON DELETE CASCADE NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_quiz_attempts_user_id ON pdf_quiz_attempts(user_id);
CREATE INDEX idx_pdf_quiz_attempts_quiz_id ON pdf_quiz_attempts(pdf_quiz_id);
ALTER TABLE pdf_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz attempts" ON pdf_quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own quiz attempts" ON pdf_quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 5. PDF CHAT SESSIONS TABLE
-- ============================================
CREATE TABLE pdf_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_chat_sessions_analysis_id ON pdf_chat_sessions(pdf_analysis_id);
CREATE INDEX idx_pdf_chat_sessions_user_id ON pdf_chat_sessions(user_id);
ALTER TABLE pdf_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions" ON pdf_chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own chat sessions" ON pdf_chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat sessions" ON pdf_chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. PDF CHAT MESSAGES TABLE
-- ============================================
CREATE TABLE pdf_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_session_id UUID REFERENCES pdf_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_chat_messages_session_id ON pdf_chat_messages(chat_session_id);
ALTER TABLE pdf_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own chat sessions" ON pdf_chat_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM pdf_chat_sessions WHERE pdf_chat_sessions.id = pdf_chat_messages.chat_session_id AND pdf_chat_sessions.user_id = auth.uid())
);
CREATE POLICY "Users can create messages in own chat sessions" ON pdf_chat_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pdf_chat_sessions WHERE pdf_chat_sessions.id = pdf_chat_messages.chat_session_id AND pdf_chat_sessions.user_id = auth.uid())
);

-- ============================================
-- 7. PDF STUDY PLANS TABLE
-- ============================================
CREATE TABLE pdf_study_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  duration_days INTEGER NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_study_plans_analysis_id ON pdf_study_plans(pdf_analysis_id);
CREATE INDEX idx_pdf_study_plans_user_id ON pdf_study_plans(user_id);
ALTER TABLE pdf_study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own study plans" ON pdf_study_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own study plans" ON pdf_study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study plans" ON pdf_study_plans FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 8. PDF MIND MAPS TABLE
-- ============================================
CREATE TABLE pdf_mind_maps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE NOT NULL,
  map_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pdf_mind_maps_analysis_id ON pdf_mind_maps(pdf_analysis_id);
ALTER TABLE pdf_mind_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mind maps from own analyses" ON pdf_mind_maps FOR SELECT USING (
  EXISTS (SELECT 1 FROM pdf_analyses WHERE pdf_analyses.id = pdf_mind_maps.pdf_analysis_id AND pdf_analyses.user_id = auth.uid())
);
CREATE POLICY "Users can create mind maps for own analyses" ON pdf_mind_maps FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pdf_analyses WHERE pdf_analyses.id = pdf_mind_maps.pdf_analysis_id AND pdf_analyses.user_id = auth.uid())
);

-- ============================================
-- 9. PDF TRANSLATIONS TABLE
-- ============================================
CREATE TABLE pdf_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE NOT NULL,
  language_code TEXT NOT NULL,
  translated_summary TEXT NOT NULL,
  translated_explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pdf_analysis_id, language_code)
);

CREATE INDEX idx_pdf_translations_analysis_id ON pdf_translations(pdf_analysis_id);
ALTER TABLE pdf_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view translations from own analyses" ON pdf_translations FOR SELECT USING (
  EXISTS (SELECT 1 FROM pdf_analyses WHERE pdf_analyses.id = pdf_translations.pdf_analysis_id AND pdf_analyses.user_id = auth.uid())
);
CREATE POLICY "Users can create translations for own analyses" ON pdf_translations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pdf_analyses WHERE pdf_analyses.id = pdf_translations.pdf_analysis_id AND pdf_analyses.user_id = auth.uid())
);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT '✅ ALL PDF ANALYZER TABLES CREATED SUCCESSFULLY!' AS status;
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN (
  'pdf_analyses', 'pdf_flashcards', 'pdf_quizzes', 'pdf_quiz_attempts',
  'pdf_chat_sessions', 'pdf_chat_messages', 'pdf_study_plans',
  'pdf_mind_maps', 'pdf_translations'
)
ORDER BY table_name;
