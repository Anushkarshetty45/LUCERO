# Supabase Email Verification Setup Guide

## Current Status

✅ **Good News**: Your account was created successfully!
❌ **Issue**: Rate limiting on OTP requests

## The Problem

Your registration flow is trying to send **two** verification emails:
1. Supabase's built-in confirmation email (from `signUp()`)
2. A separate OTP email (from `signInWithOtp()`)

This causes rate limiting and confusion.

## Solution: Choose One Verification Method

### Option 1: Use OTP Verification (Current Implementation)

**Disable built-in email confirmation in Supabase:**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **Settings**
4. Scroll to **Email Auth**
5. **Disable** "Enable email confirmations"
6. Click **Save**

This will prevent the automatic confirmation email and only use your custom OTP flow.

### Option 2: Use Built-in Email Confirmation (Simpler)

**Enable built-in confirmation and remove custom OTP:**

1. Go to **Authentication** → **Settings** → **Email Auth**
2. **Enable** "Enable email confirmations"
3. Set "Confirm email" to **Enabled**
4. Click **Save**

Then update the registration code to remove the custom OTP flow (I can help with this).

## Current Rate Limiting

You've hit Supabase's rate limit because you tried multiple registrations. To proceed:

**Option A: Wait and Try Again**
- Wait 60 seconds
- Try registering with a different email

**Option B: Login Directly**
- Your account `24ETCS002022@msruas.ac.in` was created
- Check your email inbox for a confirmation link from Supabase
- Click the link to verify your email
- Then try logging in

**Option C: Reset Your Password**
- Click "Forgot password?" on the login page
- Enter your email
- Use the reset link to set a new password
- This will also verify your email

## Recommended Configuration

I recommend **Option 1 (OTP Verification)** since that's what you originally requested:

1. Disable email confirmations in Supabase
2. Wait 60 seconds for rate limit to reset
3. Try registering again (or use a new email)
4. You'll receive a 6-digit OTP code
5. Enter the OTP to verify your email

## Next Steps

1. Go to Supabase Dashboard → Authentication → Settings
2. Disable "Enable email confirmations"
3. Wait 60 seconds
4. Try the flow again

Let me know which option you prefer, and I can help adjust the code if needed!
