-- ============================================
-- CLEANUP SCRIPT - Run this FIRST
-- This removes all existing tables and functions
-- ============================================

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS generate_meeting_code() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_study_sessions() CASCADE;

-- Drop tables (CASCADE removes dependencies)
DROP TABLE IF EXISTS study_session_participants CASCADE;
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Success message
SELECT 'All tables and functions dropped successfully!' AS status;
