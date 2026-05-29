# LUCERO 

**An AI-Powered Intelligent Study Platform**

LUCERO is a modern web application that helps students organize their learning, track their progress, and study more effectively using artificial intelligence.

![React](https://img.shields.io/badge/React-19.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![Gemini AI](https://img.shields.io/badge/Gemini-AI_Powered-orange)

---

## Features

### Course Management
- Create and organize multiple courses
- Add topics and study materials to each course
- Color-coded organization for easy navigation
- Track progress across all subjects

### AI-Powered PDF Analyzer
- **Smart Analysis**: Upload PDFs and get AI-generated summaries and explanations
- **Interactive Chat**: Ask questions about your PDF content
- **Auto Flashcards**: Automatically generate study flashcards
- **Quiz Generation**: Create multiple-choice quizzes with explanations
- **Study Plans**: Get personalized study schedules (3 days to 1 month)
- **Mind Maps**: Visual diagrams showing concept relationships
- **Export**: Download your analysis as PDF or Markdown

### Study Timer
- Track study time for each course
- Floating timer that works across all pages
- View detailed statistics and reports
- Historical tracking of study sessions

### Focus Tracking (Live Study)
- Uses AI-powered face detection to monitor attention
- Alerts when you're distracted or looking away
- Calculates focus percentage for each session
- Detailed session reports with charts

### Notes System
- Create notes linked to courses and topics
- Rich text editing with formatting
- Search and filter notes
- Export notes functionality

### AI Study Assistant
- Chat with AI tutor for study help
- Get explanations and clarifications
- Personalized study advice

### Analytics & Reports
- Study time statistics
- Focus metrics and trends
- Course progress tracking
- Visual charts and graphs

---

## Technology Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 19 with TypeScript |
| **Routing** | React Router DOM v7 |
| **Backend** | Supabase (PostgreSQL + Auth + Storage) |
| **AI** | Google Gemini 2.5 Flash |
| **PDF Processing** | PDF.js |
| **Face Detection** | face-api.js |
| **3D Graphics** | Three.js + React Three Fiber |
| **Visualizations** | ReactFlow (mind maps), Recharts (graphs) |
| **Styling** | Custom CSS with animations |
| **Icons** | React Icons (HeroIcons) |

---

## Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Supabase account (free tier works)
- Google Gemini API key (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
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
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Gemini AI Configuration
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key
   ```

   **Get your keys:**
   - Supabase: Sign up at [supabase.com](https://supabase.com) and create a project
   - Gemini API: Get a free key at [ai.google.dev](https://ai.google.dev)

4. **Set up the database**

   Run the SQL scripts in your Supabase SQL editor. See `PROJECT_DOCUMENTATION.md` for the complete schema.

5. **Download face detection models**

   Download models from [face-api.js models](https://github.com/justadudewhohacks/face-api.js-models) and place in `/public/models/`:
   - tiny_face_detector_model-weights_manifest.json
   - face_landmark_68_model-weights_manifest.json

6. **Start the development server**
   ```bash
   npm start
   ```

   The app will open at [http://localhost:3000](http://localhost:3000)

---

## Documentation

For detailed documentation about the architecture, features, and implementation, see:
- **[PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)** - Complete technical documentation

---

## How to Use

### 1. Sign Up / Login
- Create an account or log in
- Your data is securely stored in Supabase

### 2. Create Your First Course
- Click "New Course" on the dashboard
- Add a name, pick a color, add description
- Start adding topics to your course

### 3. Upload and Analyze a PDF
- Click the PDF Analyzer button
- Upload any study material (PDF format)
- Wait for AI analysis (30 seconds - 2 minutes)
- Explore all the generated study aids

### 4. Start Studying
- Use the study timer to track your time
- Try Live Study mode for focus tracking
- Take AI-generated quizzes
- Review flashcards
- Follow your personalized study plan

### 5. Track Your Progress
- View statistics on your dashboard
- Check session reports
- Monitor focus trends
- Review study time per course

---

## Key Features Explained

### PDF Analyzer Tabs

1. **Upload**: Upload and analyze PDF documents
2. **Analysis**: View AI-generated summary and detailed explanation
3. **History**: Access previously analyzed PDFs
4. **Chat**: Ask questions about the PDF content
5. **Flashcards**: Interactive study flashcards
6. **Quiz**: Multiple-choice questions with instant feedback
7. **Study Plan**: Personalized daily study schedule
8. **Mind Map**: Visual concept relationships
9. **Export**: Download your analysis

### Focus Tracking System

The Live Study feature uses your webcam to:
- Detect if you're looking at the screen
- Count distractions (looking away)
- Calculate focus percentage
- Show warnings when distracted
- Generate detailed session reports

**Privacy Note**: Video is processed locally in your browser and never uploaded anywhere.

---

## Security & Privacy

- **Authentication**: Secure password hashing via Supabase
- **Data Privacy**: All user data stored in isolated database rows
- **Input Sanitization**: DOMPurify prevents XSS attacks
- **API Keys**: Stored in environment variables, never exposed
- **Video Processing**: Face detection runs locally, video never leaves your device
- **HTTPS**: All API communications encrypted

---

## Project Structure

```
LUCERO/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── auth/           # Login/Register forms
│   │   ├── LiveStudy/      # Focus tracking components
│   │   └── PDFAnalyzer/    # PDF analysis features
│   ├── pages/              # Page components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API integrations
│   ├── types/              # TypeScript definitions
│   └── utils/              # Helper functions
├── public/                 # Static assets
│   └── models/            # Face detection AI models
└── .env                   # Environment variables
```

---

## Troubleshooting

### PDF Analysis Not Working
- Verify your Gemini API key is correct
- Check that the PDF has selectable text (not scanned images)
- Try with a smaller PDF first

### Face Detection Issues
- Allow camera permissions in browser
- Ensure models are downloaded to `/public/models/`
- Check lighting - face detection needs adequate light
- Try Chrome/Firefox (better webcam support)



---

## Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## Acknowledgments

Built with amazing open-source tools:
- **React** - UI framework
- **Supabase** - Backend infrastructure
- **Google Gemini** - AI capabilities
- **Three.js** - 3D graphics
- **face-api.js** - Face detection
- And many other wonderful libraries!

---

## Contact
phone number:6361889565
email id: anushkarshetty45@gmail.com

---
