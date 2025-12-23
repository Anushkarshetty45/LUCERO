# LUCERO - AI-Powered Study Platform

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Features & Implementation](#features--implementation)
4. [Project Structure](#project-structure)
5. [Setup & Installation](#setup--installation)
6. [How Each Part Works](#how-each-part-works)

---

## Project Overview

**LUCERO** is an intelligent study platform designed to help students organize their learning, track their progress, and study more effectively using AI technology. The platform combines traditional course management with modern AI-powered features like PDF analysis, automated quiz generation, flashcards, and focus tracking.

### What Problem Does It Solve?
- Students struggle to organize study materials across multiple courses
- Creating study aids like flashcards and quizzes is time-consuming
- It's hard to track study time and maintain focus
- Extracting key information from PDFs and documents takes effort
- Students need personalized study plans but don't know where to start

### What Does LUCERO Do?
- Organizes all your courses and study materials in one place
- Automatically generates flashcards, quizzes, and study plans from PDFs
- Tracks your study time with a built-in timer
- Monitors your focus using face detection technology
- Provides AI-powered chat to answer questions about your study materials
- Creates visual mind maps and study aids from documents
- Generates personalized study schedules

---

## Technology Stack

### Frontend Framework
**React 19.2.0 with TypeScript**
- **What it is**: React is a JavaScript library for building user interfaces
- **Why we use it**: Makes it easy to create interactive web pages with reusable components
- **Simple explanation**: Instead of writing one big HTML file, we break the website into small pieces (components) that can be reused and managed easily

### Routing
**React Router DOM v7.9.5**
- **What it is**: A library that handles navigation between pages
- **Why we use it**: Lets users move between different pages (Home, Dashboard, Courses) without reloading the entire website
- **Simple explanation**: Like a GPS for your website - tells the app which page to show based on the URL

### Database & Authentication
**Supabase**
- **What it is**: A backend service that provides database and user authentication
- **Why we use it**: We don't have to build our own server - Supabase handles user accounts, login, and data storage
- **Simple explanation**: Like a secure online filing cabinet that remembers who you are and stores all your study data
- **Components used**:
  - `@supabase/supabase-js` - Main library to talk to Supabase
  - `@supabase/auth-ui-react` - Pre-built login/signup forms
  - Database: PostgreSQL (included with Supabase)
  - Storage: For storing uploaded PDF files

### AI Integration
**Google Gemini AI (gemini-1.5-flash)**
- **What it is**: Google's artificial intelligence model for understanding and generating text
- **Why we use it**: Powers all the smart features like summarizing PDFs, generating quizzes, creating flashcards
- **Simple explanation**: Like having a super-smart tutor that can read your materials and create study aids instantly
- **API Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash`

### PDF Processing
**PDF.js (pdfjs-dist v5.4.449)**
- **What it is**: A library that can read PDF files in the browser
- **Why we use it**: Extracts text from uploaded PDFs so the AI can analyze them
- **Simple explanation**: Takes your PDF and converts it to text that the computer can understand and process

### Face Detection
**face-api.js v0.22.2**
- **What it is**: A JavaScript library that can detect faces using your webcam
- **Why we use it**: Tracks if you're looking at the screen during study sessions
- **Simple explanation**: Uses your camera to check if you're paying attention while studying
- **How it works**: Uses machine learning models to find faces and facial features in real-time

### 3D Graphics & Animation
**Three.js v0.182.0 with React Three Fiber**
- **What it is**: A library for creating 3D graphics in the browser
- **Why we use it**: Creates beautiful animated backgrounds and visual effects on the homepage
- **Simple explanation**: Makes the website look modern with 3D shapes and particle effects
- **Components**:
  - `@react-three/fiber` - Makes Three.js work with React
  - `@react-three/drei` - Pre-made 3D components

### Visualization
**ReactFlow v11.11.4**
- **What it is**: A library for creating node-based diagrams
- **Why we use it**: Displays mind maps with topics and connections
- **Simple explanation**: Creates visual maps showing how different concepts are related

**Recharts v3.5.1**
- **What it is**: A charting library for React
- **Why we use it**: Shows study statistics and progress graphs
- **Simple explanation**: Turns your study data into easy-to-read charts and graphs

### Utility Libraries
**date-fns v4.1.0**
- **What it is**: A library for working with dates
- **Why we use it**: Formats dates, calculates study plan schedules
- **Simple explanation**: Makes it easy to work with dates like "2 weeks from now"

**axios v1.13.2**
- **What it is**: A library for making HTTP requests
- **Why we use it**: Talks to APIs and fetches data from servers
- **Simple explanation**: Like a messenger that gets information from other websites

**DOMPurify v3.3.1**
- **What it is**: A security library that cleans user input
- **Why we use it**: Prevents malicious code from being injected into the app
- **Simple explanation**: A security guard that checks all user input for harmful code

### Document Export
**jsPDF v3.0.4 & html2pdf.js v0.12.1**
- **What it is**: Libraries that create PDF files from web content
- **Why we use it**: Lets users export their study materials as PDF documents
- **Simple explanation**: Saves your notes and study guides as downloadable PDF files

**file-saver v2.0.5**
- **What it is**: A library for saving files to your computer
- **Why we use it**: Downloads exported materials
- **Simple explanation**: The "Save File" button functionality

### Icons
**React Icons v4.12.0**
- **What it is**: A collection of popular icon sets
- **Why we use it**: Adds professional-looking icons throughout the app
- **Simple explanation**: Small pictures that make buttons and features easy to recognize

### Styling
**Custom CSS**
- **What it is**: Cascading Style Sheets
- **Why we use it**: Makes the website look good with colors, layouts, and animations
- **Simple explanation**: The "paint and decoration" that makes the website visually appealing

---

## Features & Implementation

### 1. User Authentication
**Technology**: Supabase Auth
**Files**:
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- `src/hooks/useAuth.ts`

**How it works**:
1. User enters email and password
2. Supabase checks credentials against its database
3. If valid, Supabase creates a session (like a login ticket)
4. Session is stored in browser's local storage
5. App checks this session to know if user is logged in

**Simple explanation**: Like showing your ID card at the door - Supabase checks if you're allowed in and remembers you while you're inside.

### 2. Course Management
**Technology**: React + Supabase Database
**Files**:
- `src/pages/Dashboard.tsx`
- `src/pages/Course.tsx`
- `src/components/CreateCourseModal.tsx`
- `src/components/CourseCard.tsx`

**How it works**:
1. User creates a course with name, color, and description
2. Data is saved to Supabase `courses` table
3. Each course can have multiple topics (stored in `topics` table)
4. Dashboard fetches all courses for logged-in user
5. Displays as cards with statistics

**Simple explanation**: Like creating folders on your computer, but for your study subjects. Each folder can hold different topics and materials.

### 3. PDF Analyzer (Most Complex Feature)
**Technology**: PDF.js + Gemini AI + React
**Location**: `src/components/PDFAnalyzer/`

#### Main Components:

**a) PDFAnalyzerModal.tsx**
- **What it does**: Main container for all PDF analysis features
- **How it works**:
  1. User uploads a PDF file
  2. PDF.js extracts text from each page
  3. Text is sent to Gemini AI with a prompt
  4. AI returns summary and explanation
  5. Results are saved to Supabase database

**b) ChatTab.tsx**
- **What it does**: Chat with AI about the PDF content
- **Technology**: Gemini AI
- **How it works**:
  1. User types a question
  2. Question + PDF content + chat history sent to Gemini AI
  3. AI generates contextual answer
  4. Response displayed in chat interface
  5. All messages saved to database

**c) FlashcardsTab.tsx**
- **What it does**: Creates study flashcards from PDF
- **Technology**: Gemini AI
- **How it works**:
  1. PDF content sent to AI with "create flashcards" prompt
  2. AI returns JSON with question/answer pairs
  3. Cards saved to database
  4. Interactive flip animation using CSS
  5. Users can navigate between cards

**d) QuizTab.tsx**
- **What it does**: Generates multiple-choice quizzes
- **Technology**: Gemini AI
- **How it works**:
  1. PDF content sent to AI with quiz generation prompt
  2. AI returns questions with options and correct answers
  3. Quiz saved to database
  4. User takes quiz and sees immediate feedback
  5. Score calculated and stored

**e) StudyPlanTab.tsx**
- **What it does**: Creates personalized study schedules
- **Technology**: Gemini AI + date-fns
- **How it works**:
  1. User selects duration (3 days, 1 week, etc.)
  2. PDF content + duration sent to AI
  3. AI creates day-by-day study plan
  4. Dates calculated using date-fns
  5. Plan displayed with checkboxes for activities

**f) MindMapTab.tsx**
- **What it does**: Visual diagram of concepts and relationships
- **Technology**: Gemini AI + ReactFlow
- **How it works**:

  1. PDF content sent to AI with mind map prompt
  2. AI returns central topic + branches + subtopics
  3. ReactFlow creates visual nodes and connections
  4. Nodes positioned in circular pattern
  5. Interactive diagram users can explore

**g) ExportTab.tsx**
- **What it does**: Export analysis as PDF/Markdown
- **Technology**: jsPDF + file-saver
- **How it works**:
  1. User clicks export button
  2. Analysis data formatted as PDF or Markdown
  3. File generated in browser
  4. Download prompt appears

### 4. Study Timer
**Technology**: React Context + Hooks
**Files**:
- `src/contexts/TimerContext.tsx`
- `src/components/StudyTimerModal.tsx`
- `src/components/FloatingTimer.tsx`

**How it works**:
1. User starts timer for a course
2. JavaScript `setInterval` increments counter every second
3. Timer state stored in React Context (accessible everywhere)
4. When stopped, duration saved to database
5. Statistics calculated for reports

**Simple explanation**: Like a stopwatch that remembers all your study sessions and shows you how much time you spent on each subject.

### 5. Live Study Session (Focus Tracking)
**Technology**: face-api.js + MediaStream API
**Files**:
- `src/components/LiveStudy/LiveStudySession.tsx`
- `src/hooks/useFaceDetection.ts`
- `src/utils/faceDetectionSetup.ts`

**How it works**:
1. User starts live study session
2. Browser asks permission to use webcam
3. face-api.js loads pre-trained AI models
4. Every few seconds:
   - Captures frame from webcam
   - AI detects if face is present
   - Checks if user is looking at screen
5. Calculates focus percentage
6. If user looks away, shows warning
7. Session data saved to database

**Simple explanation**: Uses your camera to check if you're actually studying or getting distracted. Like having a study buddy who gently reminds you to focus.

**Technical details**:
- Face detection models: TinyFaceDetector, FaceLandmark68Net
- Detection interval: Every 2-3 seconds
- Focus threshold: Face confidence > 0.5
- Warnings: After 10 seconds of looking away

### 6. Notes System
**Technology**: React + Supabase + DOMPurify
**Files**:
- `src/components/CreateNoteModal.tsx`
- `src/components/NotesModal.tsx`
- `src/components/AllNotesModal.tsx`

**How it works**:
1. User writes note with title and content
2. DOMPurify sanitizes input (removes harmful code)
3. Note saved to Supabase with course/topic ID
4. Notes displayed in list view
5. Click to expand/edit

**Simple explanation**: Digital notepad that's tied to your courses. Like sticky notes that you can't lose.

### 7. AI Chatbot
**Technology**: Gemini AI
**Files**:
- `src/components/ChatbotModal.tsx`
- `src/services/aiPrompts.ts`

**How it works**:
1. User asks a question
2. Question + conversation history sent to Gemini AI
3. AI provides study-related answers
4. Conversation persists during session
5. Can provide explanations, summaries, study tips

**Simple explanation**: A helpful AI tutor that answers your study questions instantly.

### 8. 3D Animated Homepage
**Technology**: Three.js + React Three Fiber
**Files**:
- `src/pages/Home.tsx`
- `src/components/ParticleBurst.tsx`

**How it works**:
1. Canvas element created in React
2. Three.js renders 3D scene
3. Particle system with 1500+ points
4. Animated rotation using requestAnimationFrame
5. MeshDistortMaterial creates wavy sphere effect
6. Runs at 60fps for smooth animation

**Simple explanation**: The cool moving background with particles and 3D shapes that makes the website look modern and engaging.

### 9. Session Reports
**Technology**: Recharts + React
**Files**:
- `src/components/SessionReportModal.tsx`
- `src/components/FocusMetricsOverlay.tsx`

**How it works**:
1. After study session ends, data is collected
2. Statistics calculated (focus %, distractions, time)
3. Recharts creates visual graphs
4. Data stored for historical tracking
5. Displays trends over time

**Simple explanation**: Report card for your study session showing how well you focused and how long you studied.

---

## Project Structure

```
LUCERO/
├── public/                      # Static files
│   ├── pdf.worker.min.mjs      # PDF.js worker
│   └── models/                 # Face detection AI models
│
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── auth/              # Login/signup forms
│   │   ├── LiveStudy/         # Focus tracking components
│   │   └── PDFAnalyzer/       # PDF analysis features
│   │
│   ├── pages/                 # Full page views
│   │   ├── Home.tsx           # Landing page
│   │   ├── Dashboard.tsx      # Course overview
│   │   ├── Course.tsx         # Individual course view
│   │   ├── Profile.tsx        # User profile
│   │   └── Settings.tsx       # App settings
│   │
│   ├── contexts/              # React Context (global state)
│   │   ├── TimerContext.tsx   # Study timer state
│   │   └── LiveStudyContext.tsx # Focus tracking state
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts         # Authentication logic
│   │   ├── useTimer.ts        # Timer functionality
│   │   └── useFaceDetection.ts # Face tracking logic
│   │
│   ├── services/              # API and external services
│   │   ├── supabase.ts        # Supabase client
│   │   ├── api.ts             # Database operations
│   │   ├── pdfAnalysisApi.ts  # PDF feature APIs
│   │   └── aiPrompts.ts       # AI prompt templates
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── index.ts           # Core types
│   │   ├── pdfAnalysis.ts     # PDF feature types
│   │   └── liveStudy.ts       # Focus tracking types
│   │
│   ├── utils/                 # Helper functions
│   │   ├── faceDetectionSetup.ts
│   │   ├── security.ts
│   │   └── helpers.ts
│   │
│   ├── App.tsx                # Main app component
│   └── index.tsx              # App entry point
│
├── .env                       # Environment variables (API keys)
├── package.json               # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

---

## Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Supabase account
- Google Gemini API key

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd LUCERO
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file in the root directory:
```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI Configuration
REACT_APP_GEMINI_API_KEY=your_gemini_api_key
```

4. **Set up Supabase Database**
Run the following SQL in your Supabase SQL editor to create tables:
```sql
-- Users table (automatically created by Supabase Auth)

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#667eea',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Topics table
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  topic_id UUID REFERENCES topics(id),
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Study sessions table
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  duration INTEGER NOT NULL,
  started_at TIMESTAMP DEFAULT NOW()
);

-- Live study sessions table
CREATE TABLE live_study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  duration INTEGER,
  focus_percentage NUMERIC(5,2),
  distractions INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PDF analyses table
CREATE TABLE pdf_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES courses(id),
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  title TEXT,
  summary TEXT,
  explanation TEXT,
  key_terms TEXT[],
  page_count INTEGER,
  analyzed_pages TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PDF flashcards table
CREATE TABLE pdf_flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PDF quizzes table
CREATE TABLE pdf_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PDF chat sessions table
CREATE TABLE pdf_chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  title TEXT DEFAULT 'New Chat',
  created_at TIMESTAMP DEFAULT NOW()
);

-- PDF chat messages table
CREATE TABLE pdf_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES pdf_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PDF study plans table
CREATE TABLE pdf_study_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  duration_days INTEGER NOT NULL,
  plan_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- PDF mind maps table
CREATE TABLE pdf_mind_maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID REFERENCES pdf_analyses(id) ON DELETE CASCADE,
  map_data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz attempts table
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  quiz_id UUID REFERENCES pdf_quizzes(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

5. **Set up Supabase Storage**
- Go to Storage in Supabase dashboard
- Create a new bucket called `pdf-files`
- Set it to public or private based on your needs

6. **Download Face Detection Models**
Place these files in `public/models/`:
- tiny_face_detector_model-weights_manifest.json
- face_landmark_68_model-weights_manifest.json

Download from: https://github.com/justadudewhohacks/face-api.js-models

7. **Start the development server**
```bash
npm start
```

The app will open at http://localhost:3000 (or http://localhost:3001 if 3000 is taken)

---

## How Each Part Works

### Data Flow Examples

#### 1. Creating a Course
```
User clicks "Create Course"
  → Modal opens (CreateCourseModal.tsx)
  → User fills form (name, color, description)
  → Click "Create"
  → Data sent to Supabase API (api.ts)
  → Supabase saves to courses table
  → Success response returned
  → Dashboard refreshes to show new course
  → User sees new course card
```

#### 2. Analyzing a PDF
```
User uploads PDF file
  → PDFAnalyzerModal.tsx receives file
  → PDF.js extracts text from each page
  → Progress bar updates (0-50%)
  → Text sent to Gemini AI with analysis prompt
  → Progress bar updates (50-80%)
  → Gemini returns summary + explanation
  → Progress bar reaches 100%
  → PDF uploaded to Supabase Storage
  → Analysis saved to database
  → User can now use all PDF features (chat, flashcards, etc.)
```

#### 3. Starting a Live Study Session
```
User clicks "Start Live Study"
  → Browser requests camera permission
  → User grants permission
  → face-api.js loads AI models (1-2 seconds)
  → Webcam stream starts
  → Video feed displays in corner
  → Face detection begins (every 2 seconds):
    - Capture frame from video
    - Run through AI model
    - Detect face position
    - Calculate if looking at screen
    - Update focus percentage
  → If face not detected for 10s:
    - Show warning notification
    - Increment distraction counter
  → User clicks "End Session":
    - Stop webcam
    - Calculate final statistics
    - Save to database
    - Show session report with graphs
```

#### 4. Generating Flashcards
```
User opens PDF Analyzer
  → Clicks "Flashcards" tab
  → Clicks "Generate Flashcards"
  → FlashcardsTab.tsx sends request:
    - Takes first 15,000 characters of PDF
    - Creates prompt: "Create flashcards from this content"
    - Sends to Gemini AI
  → Gemini returns JSON:
    {
      "flashcards": [
        {
          "front": "Question",
          "back": "Answer",
          "category": "Topic"
        }
      ]
    }
  → Flashcards saved to database
  → Interactive card interface displays
  → User can flip cards, navigate, shuffle
```

---

## API Endpoints Used

### Supabase (Database)
- **Auth**: `supabase.auth.signIn()`, `signUp()`, `signOut()`
- **Database**: `supabase.from('table').select()`, `insert()`, `update()`, `delete()`
- **Storage**: `supabase.storage.from('bucket').upload()`

### Gemini AI
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- **Method**: POST
- **Request**:
```json
{
  "contents": [{
    "parts": [{ "text": "your prompt here" }]
  }],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 4096
  }
}
```
- **Response**:
```json
{
  "candidates": [{
    "content": {
      "parts": [{ "text": "AI generated response" }]
    }
  }]
}
```

---

## Security Features

1. **Authentication**: Supabase handles secure password hashing
2. **Row Level Security**: Database rules ensure users only see their own data
3. **Input Sanitization**: DOMPurify cleans all user input
4. **API Key Protection**: Environment variables keep keys secret
5. **HTTPS**: All API calls encrypted in transit
6. **Session Management**: Automatic logout after inactivity

---

## Performance Optimizations

1. **Code Splitting**: React.lazy() for loading components on-demand
2. **Memoization**: useMemo() and React.memo() prevent unnecessary re-renders
3. **Debouncing**: Search and input fields debounced to reduce API calls
4. **Image Optimization**: Lazy loading for images
5. **PDF Processing**: Truncates large PDFs to avoid API limits
6. **Face Detection**: Runs at intervals (not every frame) to save processing power

---

## Browser Requirements

- **Chrome**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

**Required Permissions**:
- Camera access (for focus tracking)
- Local storage (for session persistence)

---

## Future Enhancement Ideas

1. **Mobile App**: React Native version for iOS/Android
2. **Collaborative Study**: Real-time collaboration on notes
3. **More AI Models**: Support for Claude, GPT-4, etc.
4. **Voice Commands**: Hands-free control while studying
5. **Spaced Repetition**: Intelligent flashcard scheduling
6. **Gamification**: Points, badges, achievements
7. **Study Groups**: Virtual study rooms with video chat
8. **Calendar Integration**: Sync with Google Calendar
9. **Offline Mode**: Work without internet connection
10. **Export to Anki**: Export flashcards to Anki format

---

## Troubleshooting

### Common Issues

**PDF Analysis fails**
- Check Gemini API key is valid
- Ensure PDF has extractable text (not scanned images)
- Try a smaller PDF (< 50 pages)

**Face detection not working**
- Grant camera permissions
- Ensure adequate lighting
- Check models are downloaded to /public/models/

**Login issues**
- Verify Supabase credentials in .env
- Check email confirmation if required
- Clear browser cache and cookies

**Build errors**
- Delete node_modules and package-lock.json
- Run `npm install` again
- Ensure Node.js version is 16+

---

## Credits

**Built with**:
- React - UI framework
- Supabase - Backend and database
- Google Gemini - AI capabilities
- Three.js - 3D graphics
- face-api.js - Face detection
- And many other amazing open-source libraries!

**Created by**: Anushka
**License**: MIT (or your chosen license)
**Version**: 0.1.0

---

## Contact & Support

For questions, issues, or feature requests, please open an issue on the GitHub repository.

Happy studying with LUCERO! 🌟📚
