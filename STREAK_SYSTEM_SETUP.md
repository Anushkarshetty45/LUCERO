# Streak System Implementation Guide

## Overview
I've implemented a comprehensive daily streak tracking system that updates your streak when you:
1. **Login** to your account (once per day)
2. **Complete flashcards** (generate and study flashcards)
3. **Complete quizzes** (finish any quiz)

## Database Setup Required

Before the streak system will work, you need to run the database migration:

### Step 1: Run the Migration in Supabase

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `/database-migrations/add-streak-tracking.sql`
5. Click "Run" to execute the migration

This will:
- Add `last_active_date`, `current_streak`, and `longest_streak` columns to `user_settings` table
- Create a new `daily_activities` table to track all daily activities
- Set up proper indexes and Row Level Security (RLS) policies

## How It Works

### 1. Daily Login Tracking
- When you open the Dashboard, it automatically records a 'login' activity for today
- This happens in `Dashboard.tsx` line 65

### 2. Flashcard Tracking
- When you generate and start studying flashcards, it records a 'flashcard' activity
- This happens in `FlashcardsModal.tsx` line 165

### 3. Quiz Tracking
- When you complete a quiz, it records a 'quiz' activity
- This happens in `QuizTab.tsx` line 93

### 4. Streak Calculation
- The system counts consecutive days where you had ANY activity (login, flashcard, or quiz)
- If you miss a day, your streak resets to 0
- The streak allows a grace period: if you were active yesterday but not today, your streak is still maintained until tomorrow

## New API Functions

### `recordDailyActivity(userId, activityType)`
Records an activity for today and automatically updates your streak.

**Activity Types:**
- `'login'` - Opening the app
- `'flashcard'` - Completing flashcards
- `'quiz'` - Completing a quiz
- `'study_session'` - Reserved for future use

### `getUserStreak(userId)`
Returns current and longest streak:
```typescript
{
  current: number,  // Current active streak
  longest: number   // All-time longest streak
}
```

### `updateUserStreak(userId)`
Recalculates and updates the user's streak based on daily activities.

## Files Modified

1. **src/services/api.ts** - Added 3 new streak tracking functions
2. **src/pages/Dashboard.tsx** - Records login activity, uses new getUserStreak()
3. **src/components/FlashcardsModal.tsx** - Records flashcard activity
4. **src/components/PDFAnalyzer/QuizTab.tsx** - Records quiz activity

## Files Created

1. **database-migrations/add-streak-tracking.sql** - Database migration script
2. **STREAK_SYSTEM_SETUP.md** - This guide

## Testing the Streak System

After running the migration:

1. **Test Login Streak:**
   - Open the Dashboard → Check streak counter
   - It should show "1 day streak"
   - Open tomorrow → Should show "2 day streak"
   - Skip a day → Should reset to "0 day streak"

2. **Test Flashcard Streak:**
   - Generate and study flashcards
   - Check Dashboard → Streak should be maintained/increased

3. **Test Quiz Streak:**
   - Complete a quiz in PDF Analyzer
   - Check Dashboard → Streak should be maintained/increased

## Database Structure

### user_settings table (new columns):
- `last_active_date` (DATE) - Last day user had any activity
- `current_streak` (INTEGER) - Current consecutive days streak
- `longest_streak` (INTEGER) - All-time longest streak record

### daily_activities table (new):
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to auth.users
- `activity_date` (DATE) - Date of activity (YYYY-MM-DD)
- `activity_types` (TEXT[]) - Array of activity types that day
- `created_at` / `updated_at` - Timestamps

## Troubleshooting

**Streak not updating?**
- Make sure you ran the database migration
- Check browser console for any errors
- Verify `daily_activities` table exists in Supabase

**Streak resetting unexpectedly?**
- The system requires activity every day
- Missing one day resets the streak
- Check `daily_activities` table to see your activity history

**Multiple activities not combining?**
- Each day can have multiple activity types (login + flashcard + quiz)
- All count toward the same day's streak
- Check the `activity_types` array in `daily_activities` table

## Future Enhancements

Possible improvements to add later:
- Streak recovery (allow one "freeze" day per week)
- Streak milestones and achievements
- Weekly/monthly streak statistics
- Streak sharing and leaderboards
- Push notifications for streak reminders
