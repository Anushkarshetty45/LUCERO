# How to Rotate Your Supabase Credentials

## ⚠️ IMPORTANT: Your credentials were exposed and need to be rotated immediately!

Your Supabase URL and anonymous key were found in `.env.example` which is tracked by git. Anyone with access to your repository could have seen these credentials.

---

## Step 1: Generate New Credentials

### Option A: Reset Anonymous Key (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Under "Project API keys" section
5. Find the "anon / public" key
6. Click **Regenerate** next to the anon key
7. Copy the new key

**⚠️ Warning:** This will invalidate the old key immediately. Make sure to update all environments.

### Option B: Create New Project (If needed)

If you want to start fresh:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be created
5. Go to **Settings** → **API**
6. Copy both:
   - Project URL
   - Project API key (anon/public)

---

## Step 2: Update Your Local .env File

1. Open your `.env` file (NOT `.env.example`)
2. Update these values:

```bash
REACT_APP_SUPABASE_URL=https://your-new-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-new-anon-key-here
```

3. Save the file

---

## Step 3: Update Production Environment

If your app is deployed, update the environment variables:

### For Vercel:
1. Go to your project settings
2. Click "Environment Variables"
3. Update `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`
4. Redeploy your app

### For Netlify:
1. Go to Site settings
2. Click "Environment variables"
3. Update the variables
4. Trigger a new deploy

### For Other Platforms:
Update the environment variables in your hosting provider's dashboard and redeploy.

---

## Step 4: Verify It Works

1. **Test locally:**
   ```bash
   npm start
   ```

2. **Try logging in** with your account

3. **Check the console** - you should see:
   ```
   Supabase Config: {hasUrl: true, hasKey: true}
   ```

4. **If you see errors:**
   - Check that `.env` file has the new credentials
   - Restart the development server
   - Clear browser cache (Ctrl+Shift+R)

---

## Step 5: Update Database Migrations

If you reset the anonymous key, you may need to run migrations again:

1. Go to Supabase Dashboard → SQL Editor
2. Run these migrations in order:
   - `08-add-subscription-plans.sql`
   - `09-update-profile-trigger-for-subscription.sql`
   - `10-add-name-columns.sql`
   - `11-fix-handle-new-user-trigger.sql`
   - `12-add-group-study-tables.sql`

---

## Step 6: Check Your Git History (Optional but Recommended)

Your old credentials might still be in git history. To check:

```bash
# Search git history for exposed secrets
git log --all --full-history --source --pretty=format: -- .env.example | head -20
```

If you find exposed credentials in history, consider:

1. **Force push with cleaned history** (⚠️ Dangerous if collaborating):
   ```bash
   # Backup first!
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .env.example' \
     --prune-empty --tag-name-filter cat -- --all

   git push origin --force --all
   ```

2. **Or simply rotate the credentials** (Already done in Step 1) ✅

---

## Best Practices Going Forward

### ✅ DO:
- Keep `.env` file local and never commit it
- Use `.env.example` with placeholder values only
- Rotate credentials if ever exposed
- Use different credentials for development and production
- Store production secrets in environment variables of your hosting provider

### ❌ DON'T:
- Never put real credentials in `.env.example`
- Never commit `.env` files
- Never share API keys in chat, email, or screenshots
- Never log API keys in console (even partially)
- Never hardcode secrets in source code

---

## Checklist

After rotating credentials, verify:

- [ ] New Supabase credentials generated
- [ ] Local `.env` file updated
- [ ] Production environment variables updated
- [ ] App tested and working locally
- [ ] App tested and working in production
- [ ] Database migrations run (if needed)
- [ ] Old credentials no longer work
- [ ] `.env.example` has only placeholders (already fixed)
- [ ] `.gitignore` includes all `.env*` files (already fixed)

---

## Need Help?

If you encounter any issues:

1. **Can't login after rotating:**
   - Check `.env` file has correct new credentials
   - Restart dev server
   - Clear browser cache

2. **Database errors:**
   - Run migrations again in Supabase SQL Editor
   - Check RLS policies are enabled

3. **Still seeing old credentials:**
   - Make sure you're editing the right `.env` file
   - Check you're not reading from `.env.example`

---

**Status:** ✅ Credentials rotation guide ready
**Priority:** 🚨 CRITICAL - Do this immediately!
