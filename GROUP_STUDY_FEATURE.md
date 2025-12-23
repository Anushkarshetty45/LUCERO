# 🎥 Group Study Feature - Complete Guide

## Overview

The Group Study feature allows you to video call with friends and study together in real-time, similar to Google Meet. You can create a study session and share the meeting code with friends, or join someone else's session using their code.

## Features

### ✨ Core Functionality
- **Create Meeting**: Start a new study session and get a unique 6-character code
- **Join Meeting**: Enter a friend's code to join their study session
- **Video Calling**: Full HD video and audio powered by Jitsi Meet
- **Screen Sharing**: Share your screen to explain concepts
- **Chat**: Built-in text chat during video calls
- **Recording**: Host can record the session (if enabled)
- **Multiple Participants**: Up to 10 participants per session (configurable)

### 🎯 User Interface
- **Sidebar Button**: Quick access from Dashboard sidebar
- **Study Tools Card**: Also available in Study Tools grid
- **Clean Modal Interface**: Intuitive create/join flow
- **Theme Integration**: Fully themed to match your selected color scheme

## How to Use

### Creating a Study Session

1. **Open Group Study Modal**
   - Click "🎥 Group Study" in the sidebar, OR
   - Click the "Group Study" card in Study Tools section

2. **Create Your Session**
   - Optionally enter a session title (e.g., "Physics Study Group")
   - Click "➕ Create Meeting"
   - You'll get a unique 6-character code (e.g., "A3F9K2")

3. **Share the Code**
   - Copy the meeting code using the "📋 Copy Code" button
   - Send it to your friends via text, email, or any messenger
   - They need to have a LUCERO account to join

4. **Start the Video Call**
   - Click "🎥 Start Video Call"
   - Your camera and microphone will activate
   - Wait for friends to join using your code

### Joining a Study Session

1. **Get the Meeting Code**
   - Ask your friend for their 6-character meeting code

2. **Open Group Study Modal**
   - Click "🎥 Group Study" in the sidebar

3. **Join the Session**
   - Enter the 6-character code
   - Click "🚪 Join Meeting"
   - You'll be connected to the video call automatically

### During the Video Call

**Video Controls:**
- 🎤 **Microphone**: Mute/unmute your audio
- 📹 **Camera**: Turn video on/off
- 🖥️ **Screen Share**: Share your screen
- 💬 **Chat**: Send text messages
- 🎬 **Recording**: Host can record (if enabled)
- ⚙️ **Settings**: Adjust audio/video settings
- ✋ **Raise Hand**: Signal you have a question

**Leaving the Call:**
- Click **👋 Leave** in the header to exit
- Your session data is saved (join/leave times tracked)

**Ending the Session (Host Only):**
- Click **🛑 End Session for All**
- This will disconnect everyone and close the meeting
- Meeting code becomes invalid after session ends

## Database Setup

**IMPORTANT:** Before using Group Study, run the database migration!

### Step 1: Run the Migration

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents from:
   ```
   /database-migrations/add-group-study-sessions.sql
   ```
5. Click **Run** to execute

### What the Migration Creates

**Tables:**
- `study_sessions` - Stores meeting information (code, host, times, status)
- `study_session_participants` - Tracks who joined each session

**Functions:**
- `generate_meeting_code()` - Creates unique 6-character codes
- `cleanup_old_study_sessions()` - Cleans up sessions older than 24 hours

**Security:**
- Row Level Security (RLS) policies ensure users only see their own sessions
- Only hosts can end sessions
- Participants can only update their own participation status

## Technical Details

### Video Technology: Jitsi Meet

The feature uses **Jitsi Meet**, an open-source video conferencing solution:
- **Free to use**: No API keys or payment required
- **High quality**: Full HD video and audio
- **Secure**: End-to-end encryption available
- **Feature-rich**: Screen sharing, chat, recording, etc.
- **Reliable**: Used by millions worldwide

### Meeting Codes

- **Format**: 6 characters (letters and numbers)
- **Characters**: Only uppercase (A-Z, 2-9, no confusing 0/O or 1/I)
- **Uniqueness**: Database function ensures no duplicates
- **Lifetime**: Valid as long as session is active
- **Example**: `A3F9K2`, `XY7WN4`, `BC9R2M`

### Session Lifecycle

1. **Created**: Host creates session, meeting code generated
2. **Active**: Participants can join using the code
3. **In Progress**: Video call is ongoing
4. **Ended**: Host ends session OR automatic cleanup after 24 hours
5. **Archived**: Session data saved for history/analytics

## Files Created/Modified

### New Files (Components)
1. `/src/components/GroupStudyModal.tsx` - Main modal interface
2. `/src/components/GroupStudyModal.css` - Modal styling
3. `/src/components/VideoRoom.tsx` - Video call interface
4. `/src/components/VideoRoom.css` - Video room styling

### New Files (Database)
5. `/database-migrations/add-group-study-sessions.sql` - Database setup
6. `/GROUP_STUDY_FEATURE.md` - This documentation

### Modified Files
7. `/src/services/api.ts` - Added 7 new API functions
8. `/src/pages/Dashboard.tsx` - Added Group Study button and modal

### API Functions Added

```typescript
// Create a new study session
createStudySession(userId, title?) → { session, meetingCode }

// Join an existing session
joinStudySession(sessionId, userId) → StudySessionParticipant

// Get session by meeting code
getStudySessionByCode(meetingCode) → StudySession | null

// Get user's active sessions
getActiveStudySessions(userId) → StudySession[]

// Get session participants
getSessionParticipants(sessionId) → StudySessionParticipant[]

// Leave a session
leaveStudySession(sessionId, userId) → void

// End session (host only)
endStudySessionByHost(sessionId, userId) → void
```

## Usage Examples

### Example 1: Quick Study Session

```
You:
1. Click "Group Study"
2. Click "Create Meeting"
3. Copy code: "A3F9K2"
4. Text friend: "Join my study session! Code: A3F9K2"
5. Click "Start Video Call"
6. Friend joins using the code
7. Study together!
```

### Example 2: Planned Group Study

```
Group Chat:
You: "Hey everyone, let's study for the physics exam tomorrow!"
Friend 1: "Sounds good! What time?"
You: "7 PM. I'll create a LUCERO Group Study session"

At 7 PM:
You:
1. Create meeting: "Physics Exam Prep"
2. Share code: "XY7WN4"
3. Everyone joins
4. Study for 2 hours
5. You end the session when done
```

## Troubleshooting

### Cannot Create Meeting
- **Check**: Did you run the database migration?
- **Check**: Are you logged in?
- **Fix**: Run the SQL migration in Supabase

### Meeting Code Not Working
- **Check**: Is the code exactly 6 characters?
- **Check**: Is the session still active?
- **Check**: Are you entering uppercase letters?
- **Fix**: Ask host for a new code

### Video Not Working
- **Check**: Did you allow camera/microphone permissions?
- **Check**: Is your camera being used by another app?
- **Check**: Try refreshing the page
- **Fix**: Check browser permissions in settings

### Can't Hear Anyone
- **Check**: Is your microphone muted?
- **Check**: Is their microphone muted?
- **Check**: Volume settings
- **Fix**: Click microphone icon to unmute

## Best Practices

### For Hosts
1. **Set a clear title** for your session (e.g., "Math Homework Help")
2. **Test your camera and mic** before friends join
3. **Share the code promptly** so everyone can join on time
4. **End the session properly** when done (don't just close tab)
5. **Use screen share** to explain difficult concepts

### For Participants
1. **Join on time** to avoid missing important discussions
2. **Mute when not talking** to reduce background noise
3. **Use chat** if you have trouble with audio
4. **Respect everyone's study time**
5. **Leave properly** instead of closing tab

### For Everyone
1. **Find a quiet environment** for better audio quality
2. **Use headphones** to prevent echo
3. **Good lighting** improves video quality
4. **Stable internet** (Wi-Fi preferred over cellular)
5. **Have study materials ready** before starting

## Privacy & Security

### Data Collection
- **Session metadata**: Title, code, times, participant count
- **Participation data**: Join/leave times per user
- **NOT collected**: Video/audio content is NOT recorded by default
- **Host control**: Only host can enable recording

### Who Can See What
- **Meeting codes**: Only participants who have the code
- **Video/audio**: Only current participants in the call
- **Session history**: Only you can see your own sessions
- **Participant list**: Visible to all participants in the session

### Security Features
- **Unique codes**: Each session has a unique, randomly generated code
- **Time-limited**: Sessions auto-cleanup after 24 hours
- **Host control**: Only host can end the session for everyone
- **RLS policies**: Database-level security prevents unauthorized access

## Future Enhancements

Possible features to add later:
- **Breakout rooms** for small group discussions
- **Whiteboard** for collaborative problem-solving
- **Polls** for quick questions
- **Session scheduling** for future study sessions
- **Study session history** to review past sessions
- **Invite via email/link** instead of just codes
- **Mobile app** for studying on the go

---

## Quick Reference

**Access**: Dashboard sidebar → 🎥 Group Study

**Create**: Click "Create Meeting" → Copy code → Share → Start video

**Join**: Click "Join Meeting" → Enter code → Join automatically

**Leave**: Click "👋 Leave" button in video call header

**End**: Click "🛑 End Session for All" (host only)

**Support**: If you encounter issues, check the Troubleshooting section above

---

🎉 **Enjoy studying together with friends!**
