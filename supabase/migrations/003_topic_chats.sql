-- Topic Chats Migration
-- AI Chat Integration for Topic Generation

-- ==================== TOPIC CHATS TABLE ====================
-- Stores chat sessions associated with course topics
CREATE TABLE IF NOT EXISTS topic_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  topic_name TEXT NOT NULL,
  topic_context TEXT, -- Generated notes/content for AI context
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_topic_chats_user ON topic_chats(user_id);
CREATE INDEX idx_topic_chats_course ON topic_chats(course_id);
CREATE INDEX idx_topic_chats_created ON topic_chats(created_at DESC);

-- ==================== TOPIC CHAT MESSAGES TABLE ====================
-- Stores individual messages within each chat session
CREATE TABLE IF NOT EXISTS topic_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES topic_chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB -- Additional info (model version, tokens, etc.)
);

-- Indexes for better query performance
CREATE INDEX idx_topic_chat_messages_chat ON topic_chat_messages(chat_id);
CREATE INDEX idx_topic_chat_messages_timestamp ON topic_chat_messages(timestamp);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on tables
ALTER TABLE topic_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_chat_messages ENABLE ROW LEVEL SECURITY;

-- Topic Chats Policies
CREATE POLICY "Users can view their own topic chats"
  ON topic_chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own topic chats"
  ON topic_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own topic chats"
  ON topic_chats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own topic chats"
  ON topic_chats FOR DELETE
  USING (auth.uid() = user_id);

-- Topic Chat Messages Policies
CREATE POLICY "Users can view messages in their chats"
  ON topic_chat_messages FOR SELECT
  USING (
    auth.uid() = user_id
  );

CREATE POLICY "Users can create messages in their chats"
  ON topic_chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Users can delete their own messages"
  ON topic_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- ==================== FUNCTIONS ====================

-- Function to update topic_chats.updated_at on message insert
CREATE OR REPLACE FUNCTION update_topic_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE topic_chats
  SET updated_at = NOW()
  WHERE id = NEW.chat_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp when new message is added
CREATE TRIGGER update_topic_chat_timestamp_trigger
AFTER INSERT ON topic_chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_topic_chat_timestamp();

-- ==================== COMMENTS ====================
COMMENT ON TABLE topic_chats IS 'Chat sessions for topic-specific AI conversations';
COMMENT ON TABLE topic_chat_messages IS 'Individual messages within topic chat sessions';
