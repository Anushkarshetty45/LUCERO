#!/bin/bash

# Quick Email Test Script for LUCERO
# This script helps you test the daily email system in sandbox mode

echo "═══════════════════════════════════════════════════"
echo "  🧪 LUCERO Email System - Sandbox Test"
echo "═══════════════════════════════════════════════════"
echo ""

# Get current times
CURRENT_UTC=$(date -u +"%H:%M")
CURRENT_LOCAL=$(date +"%H:%M")
TIMEZONE=$(date +%Z)

echo "⏰ Current Time Information:"
echo "   Local time: $CURRENT_LOCAL ($TIMEZONE)"
echo "   UTC time:   $CURRENT_UTC"
echo ""

echo "📧 To test email RIGHT NOW:"
echo ""
echo "1. Go to Supabase SQL Editor:"
echo "   https://app.supabase.com/project/pbszvegbxiczcfdpzatn/sql/new"
echo ""
echo "2. Run this SQL command:"
echo "   ────────────────────────────────────────────────"
echo "   UPDATE user_settings"
echo "   SET reminder_time = '$CURRENT_UTC'"
echo "   WHERE email_updates = true;"
echo "   ────────────────────────────────────────────────"
echo ""
echo "3. Press ENTER here to trigger the email..."
read -p ""

echo ""
echo "🚀 Triggering email function..."
echo ""

# Trigger the email function
RESPONSE=$(curl -s -X POST https://pbszvegbxiczcfdpzatn.supabase.co/functions/v1/send-daily-emails \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBic3p2ZWdieGljemNmZHB6YXRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.8_yTg2xH8Wh6wWMWPcAouzSLa1CGS_APdgvhvtNajiU" \
  -H "Content-Type: application/json")

echo "📨 Response: $RESPONSE"
echo ""

# Parse response
if [[ $RESPONSE == *"Sent 1 emails successfully"* ]]; then
  echo "✅ SUCCESS! Email sent!"
  echo ""
  echo "📬 Check your inbox for:"
  echo "   Subject: 🌟 Your Daily LUCERO Update"
  echo "   From: LUCERO <onboarding@resend.dev>"
  echo ""
  echo "💡 Don't forget to check your spam folder too!"
elif [[ $RESPONSE == *"Sent 0 emails successfully"* ]]; then
  echo "⚠️  No emails sent (0 users matched)"
  echo ""
  echo "🔍 Possible reasons:"
  echo "   1. reminder_time doesn't match current UTC time ($CURRENT_UTC)"
  echo "   2. email_updates is disabled in user_settings"
  echo "   3. No user_settings record exists"
  echo ""
  echo "💡 Run this SQL to check:"
  echo "   SELECT user_id, email_updates, reminder_time FROM user_settings;"
elif [[ $RESPONSE == *"error"* ]]; then
  echo "❌ Error occurred!"
  echo ""
  echo "Error details: $RESPONSE"
  echo ""
  echo "🔧 Troubleshooting steps:"
  echo "   1. Check Resend API key is set"
  echo "   2. Verify email is verified in Resend"
  echo "   3. Check function logs:"
  echo "      https://app.supabase.com/project/pbszvegbxiczcfdpzatn/functions/send-daily-emails/logs"
else
  echo "⚠️  Unexpected response:"
  echo "$RESPONSE"
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  📊 Next Steps"
echo "═══════════════════════════════════════════════════"
echo ""
echo "After testing, reset to production time (12 PM IST):"
echo ""
echo "Run this SQL:"
echo "   UPDATE user_settings SET reminder_time = '06:30';"
echo ""
echo "📚 Full testing guide: SANDBOX_TESTING_GUIDE.md"
echo "🚀 Production guide: PRODUCTION_DEPLOYMENT_GUIDE.md"
echo ""
