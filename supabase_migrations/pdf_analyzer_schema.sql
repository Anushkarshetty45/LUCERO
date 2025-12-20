-- PDF Analyzer Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PDF Analyses Storage
CREATE TABLE IF NOT EXISTS pdf_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  title TEXT,
  summary TEXT,
  explanation TEXT,
  key_terms JSONB DEFAULT '[]'::jsonb,
  page_count INTEGER,
  analyzed_pages TEXT DEFAULT 'all',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flashcards from PDFs
CREATE TABLE IF NOT EXISTS pdf_flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdf_analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes from PDFs
CREATE TABLE IF NOT EXISTS pdf_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdf_analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS pdf_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pdf_quiz_id UUID REFERENCES pdf_quizzes(id) ON DELETE CASCADE,
  selected_answer TEXT,
  is_correct BOOLEAN,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Sessions with PDFs
CREATE TABLE IF NOT EXISTS pdf_chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdf_analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS pdf_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_session_id UUID REFERENCES pdf_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study Plans
CREATE TABLE IF NOT EXISTS pdf_study_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdf_analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_days INTEGER DEFAULT 7,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mind Maps
CREATE TABLE IF NOT EXISTS pdf_mind_maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdf_analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE,
  map_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Translations
CREATE TABLE IF NOT EXISTS pdf_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdf_analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  translated_summary TEXT,
  translated_explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pdf_analyses_user_id ON pdf_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_analyses_course_id ON pdf_analyses(course_id);
CREATE INDEX IF NOT EXISTS idx_pdf_flashcards_analysis_id ON pdf_flashcards(pdf_analysis_id);
CREATE INDEX IF NOT EXISTS idx_pdf_quizzes_analysis_id ON pdf_quizzes(pdf_analysis_id);
CREATE INDEX IF NOT EXISTS idx_pdf_quiz_attempts_user_id ON pdf_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_pdf_chat_sessions_analysis_id ON pdf_chat_sessions(pdf_analysis_id);
CREATE INDEX IF NOT EXISTS idx_pdf_chat_messages_session_id ON pdf_chat_messages(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_pdf_study_plans_user_id ON pdf_study_plans(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE pdf_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_mind_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_translations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pdf_analyses
CREATE POLICY "Users can view their own PDF analyses"
  ON pdf_analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDF analyses"
  ON pdf_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PDF analyses"
  ON pdf_analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDF analyses"
  ON pdf_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for pdf_flashcards
CREATE POLICY "Users can view flashcards from their PDFs"
  ON pdf_flashcards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pdf_analyses
      WHERE pdf_analyses.id = pdf_flashcards.pdf_analysis_id
      AND pdf_analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert flashcards for their PDFs"
  ON pdf_flashcards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pdf_analyses
      WHERE pdf_analyses.id = pdf_flashcards.pdf_analysis_id
      AND pdf_analyses.user_id = auth.uid()
    )
  );

-- RLS Policies for pdf_quizzes
CREATE POLICY "Users can view quizzes from their PDFs"
  ON pdf_quizzes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pdf_analyses
      WHERE pdf_analyses.id = pdf_quizzes.pdf_analysis_id
      AND pdf_analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert quizzes for their PDFs"
  ON pdf_quizzes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pdf_analyses
      WHERE pdf_analyses.id = pdf_quizzes.pdf_analysis_id
      AND pdf_analyses.user_id = auth.uid()
    )
  );

-- RLS Policies for pdf_quiz_attempts
CREATE POLICY "Users can view their own quiz attempts"
  ON pdf_quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts"
  ON pdf_quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for pdf_chat_sessions
CREATE POLICY "Users can view their own chat sessions"
  ON pdf_chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create chat sessions"
  ON pdf_chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for pdf_chat_messages
CREATE POLICY "Users can view messages from their chat sessions"
  ON pdf_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pdf_chat_sessions
      WHERE pdf_chat_sessions.id = pdf_chat_messages.chat_session_id
      AND pdf_chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their chat sessions"
  ON pdf_chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pdf_chat_sessions
      WHERE pdf_chat_sessions.id = pdf_chat_messages.chat_session_id
      AND pdf_chat_sessions.user_id = auth.uid()
    )
  );

-- RLS Policies for pdf_study_plans
CREATE POLICY "Users can view their own study plans"
  ON pdf_study_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create study plans"
  ON pdf_study_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for pdf_mind_maps
CREATE POLICY "Users can view mind maps from their PDFs"
  ON pdf_mind_maps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pdf_analyses
      WHERE pdf_analyses.id = pdf_mind_maps.pdf_analysis_id
      AND pdf_analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create mind maps for their PDFs"
  ON pdf_mind_maps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pdf_analyses
      WHERE pdf_analyses.id = pdf_mind_maps.pdf_analysis_id
      AND pdf_analyses.user_id = auth.uid()
    )
  );

-- RLS Policies for pdf_translations
CREATE POLICY "Users can view translations from their PDFs"
  ON pdf_translations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pdf_analyses
      WHERE pdf_analyses.id = pdf_translations.pdf_analysis_id
      AND pdf_analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create translations for their PDFs"
  ON pdf_translations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pdf_analyses
      WHERE pdf_analyses.id = pdf_translations.pdf_analysis_id
      AND pdf_analyses.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_pdf_analyses_updated_at
    BEFORE UPDATE ON pdf_analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
