# Database Migration Guide

## 🎉 GOOD NEWS: Authentication is Working!

Your user registration and login are working correctly! You're successfully logged in as `24etcs002022@msruas.ac.in`.

However, the Dashboard needs additional database tables to function properly.

## Current Issues

❌ Missing database tables:
- `courses` - for managing courses
- `lessons` - for course lessons
- `lesson_progress` - for tracking progress
- `materials` - for course materials
- `daily_activities` - for activity tracking
- `user_settings` - for user preferences
- `user_notes` - for user notes

## Complete Setup (Run in Order)

### Step 1: Run the Master Fix (if not done already)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `MASTER_FIX.sql`
6. Paste it into the SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 2: Create All Required Tables

1. Still in the SQL Editor
2. Click **New Query**
3. Copy the entire contents of `04-create-all-tables.sql`
4. Paste it into the SQL Editor
5. Click **Run**

### Step 3: Verify Success

You should see:
```
✅ All tables created successfully!
✅ Database setup complete! Refresh your app.
```

### Step 4: Refresh Your App

1. Go back to your app at http://localhost:3000
2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
3. The Dashboard should now load without errors!

## What the Fix Does

1. **Removes all conflicting triggers** - Cleans up any duplicate or broken triggers
2. **Fixes RLS policies** - Makes the INSERT policy permissive so triggers can create profiles
3. **Ensures CASCADE deletion** - All foreign keys properly cascade when users are deleted
4. **Adds error handling** - The trigger won't fail user creation even if profile creation has issues
5. **Sets proper permissions** - Grants necessary access to the trigger function

## Alternative: Run Diagnostic First

If you want to see what's currently in your database before fixing:

1. Run `01-diagnostic.sql` first
2. Check the output to understand the current state
3. Then run `MASTER_FIX.sql`

## Troubleshooting

If you still get errors after running MASTER_FIX.sql:

1. Check the Supabase logs:
   - Go to Supabase Dashboard → Logs → Database
   - Look for error messages when registering

2. Run the diagnostic script:
   - Run `01-diagnostic.sql` to see current database state

3. Check for a `courses` table:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'courses';
   ```
   If it exists and has foreign keys to auth.users, you may need to add CASCADE deletion for it.

## Files in This Directory

- **MASTER_FIX.sql** - The main fix script (run this!)
- **01-diagnostic.sql** - Check current database state
- **02-fix-profiles.sql** - Alternative fix focusing on profiles table
- **CLEANUP.sql** - Complete cleanup (use with caution)
- **COMPLETE_SETUP.sql** - Full setup including study sessions
- **README.md** - This file

## After Successful Fix

Once registration is working:

1. Test the full flow: Register → OTP → Login → Dashboard
2. Verify profile data is being saved correctly
3. Check that user data appears in the profiles table

## Need Help?

If the issue persists, please check:
- Supabase project URL is correct in `.env`
- Supabase anon key is correct in `.env`
- Email service is configured in Supabase (Settings → Auth → Email)
- Rate limits haven't been hit (wait a few minutes and try again)
