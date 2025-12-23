# Technology Stack - Quick Reference

## Frontend Technologies

### Core Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | Main UI framework |
| TypeScript | 4.9.5 | Type-safe JavaScript |
| React Router DOM | 7.9.5 | Page navigation |

### UI & Styling
| Technology | Version | Purpose |
|------------|---------|---------|
| Custom CSS | - | Styling and animations |
| React Icons | 4.12.0 | Icon library (HeroIcons) |

### 3D Graphics & Animation
| Technology | Version | Purpose |
|------------|---------|---------|
| Three.js | 0.182.0 | 3D graphics engine |
| @react-three/fiber | 9.4.2 | React renderer for Three.js |
| @react-three/drei | 10.7.7 | Three.js helpers |

### Data Visualization
| Technology | Version | Purpose |
|------------|---------|---------|
| ReactFlow | 11.11.4 | Mind maps and diagrams |
| Recharts | 3.5.1 | Charts and graphs |

---

## Backend & Database

### Backend as a Service
| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | 2.81.1 | Backend platform |
| PostgreSQL | - | Database (via Supabase) |
| Supabase Auth | 0.4.7 | User authentication |
| Supabase Storage | - | File storage (PDFs) |

---

## AI & Machine Learning

### AI Services
| Technology | Version | Purpose |
|------------|---------|---------|
| Google Gemini AI | 1.5-flash | Text generation & analysis |
| face-api.js | 0.22.2 | Face detection ML models |

**AI Model Details:**
- **Gemini 1.5 Flash**: Fast, efficient model for text understanding
- **TinyFaceDetector**: Lightweight face detection
- **FaceLandmark68Net**: 68-point facial landmark detection

---

## Document Processing

### PDF Libraries
| Technology | Version | Purpose |
|------------|---------|---------|
| pdfjs-dist | 5.4.449 | PDF text extraction |
| jsPDF | 3.0.4 | PDF generation |
| html2pdf.js | 0.12.1 | HTML to PDF conversion |
| react-pdf | 10.2.0 | PDF viewing |
| file-saver | 2.0.5 | File downloads |

---

## Utilities & Helpers

### Date & Time
| Technology | Version | Purpose |
|------------|---------|---------|
| date-fns | 4.1.0 | Date formatting & manipulation |

### HTTP & API
| Technology | Version | Purpose |
|------------|---------|---------|
| axios | 1.13.2 | HTTP requests |

### Security
| Technology | Version | Purpose |
|------------|---------|---------|
| DOMPurify | 3.3.1 | XSS protection |

---

## Development Tools

### Build & Testing
| Technology | Version | Purpose |
|------------|---------|---------|
| react-scripts | 5.0.1 | Build tooling (Webpack, Babel) |
| @testing-library/react | 16.3.0 | Component testing |
| @testing-library/jest-dom | 6.9.1 | Jest DOM matchers |
| TypeScript | 4.9.5 | Type checking |

---

## API Integrations

### External APIs Used

**1. Google Gemini API**
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- **Purpose**: AI text generation, analysis, summarization
- **Cost**: Free tier available
- **Rate Limits**: 60 requests per minute
- **Used For**:
  - PDF analysis
  - Flashcard generation
  - Quiz creation
  - Chat responses
  - Study plan creation
  - Mind map generation

**2. Supabase APIs**
- **Database API**: RESTful API for PostgreSQL
- **Auth API**: User authentication and session management
- **Storage API**: File upload and retrieval
- **Realtime API**: Live updates (not currently used)

---

## Browser APIs Used

### Web APIs
| API | Purpose |
|-----|---------|
| MediaStream API | Webcam access for face detection |
| localStorage | Session persistence |
| Intersection Observer | Scroll animations |
| requestAnimationFrame | Smooth animations |
| Canvas API | Image processing for face detection |
| File API | File uploads |
| Blob API | File creation and downloads |

---

## Architecture Patterns

### Design Patterns Used

**1. Component-Based Architecture**
- Reusable UI components
- Props for data passing
- Component composition

**2. Context API**
- Global state management
- TimerContext for study timer
- LiveStudyContext for focus tracking

**3. Custom Hooks**
- useAuth - Authentication logic
- useTimer - Timer functionality
- useFaceDetection - Face tracking
- useTabVisibility - Tab visibility detection

**4. Service Layer**
- api.ts - Database operations
- pdfAnalysisApi.ts - PDF feature APIs
- aiPrompts.ts - AI prompt templates
- supabase.ts - Supabase client

**5. Type Safety**
- TypeScript interfaces
- Type definitions in /types
- Strict type checking

---

## Data Flow

### How Data Moves Through the App

```
User Action
    ↓
React Component
    ↓
Custom Hook (optional)
    ↓
Service Layer
    ↓
External API (Supabase/Gemini)
    ↓
Response
    ↓
Update React State
    ↓
Re-render UI
```

### Example: Creating a Course

```
Dashboard.tsx
    ↓
CreateCourseModal.tsx (User fills form)
    ↓
api.createCourse() (Service layer)
    ↓
Supabase Database (Insert into courses table)
    ↓
Response with new course data
    ↓
Update courses state in Dashboard
    ↓
Dashboard re-renders with new course card
```

---

## State Management

### Local State (useState)
- Form inputs
- Modal open/close
- Loading states
- UI toggles

### Context State (React Context)
- Study timer (TimerContext)
- Live study session (LiveStudyContext)
- User authentication (useAuth)

### Server State (Supabase)
- Courses
- Topics
- Notes
- PDF analyses
- Study sessions

---

## Performance Optimizations

### Techniques Used

1. **Code Splitting**
   - React.lazy() for route-based splitting
   - Lazy loading of heavy components

2. **Memoization**
   - useMemo() for expensive calculations
   - React.memo() for component optimization
   - useCallback() for function memoization

3. **Debouncing**
   - Search inputs
   - API calls

4. **Lazy Loading**
   - Images
   - 3D models
   - Face detection models

5. **Efficient Rendering**
   - Key props for lists
   - Conditional rendering
   - Avoiding inline functions in JSX

---

## File Structure by Technology

```
LUCERO/
├── React Components
│   ├── src/components/      # UI components
│   ├── src/pages/           # Page components
│   └── src/contexts/        # Context providers
│
├── TypeScript
│   ├── src/types/           # Type definitions
│   └── *.tsx, *.ts files    # All source files
│
├── CSS
│   ├── src/pages/*.css      # Page styles
│   └── src/components/*.css # Component styles
│
├── Supabase
│   └── src/services/
│       ├── supabase.ts      # Client setup
│       ├── api.ts           # Database queries
│       └── pdfAnalysisApi.ts
│
├── AI Integration
│   └── src/services/
│       └── aiPrompts.ts     # Gemini prompts
│
├── Face Detection
│   ├── src/hooks/useFaceDetection.ts
│   ├── src/utils/faceDetectionSetup.ts
│   └── public/models/       # AI models
│
└── 3D Graphics
    └── src/pages/Home.tsx   # Three.js components
```

---

## Environment Configuration

### Required Environment Variables

```env
# Supabase (Backend)
REACT_APP_SUPABASE_URL=         # Your Supabase project URL
REACT_APP_SUPABASE_ANON_KEY=    # Supabase anonymous key

# AI
REACT_APP_GEMINI_API_KEY=       # Google Gemini API key
```

---

## Deployment Considerations

### Production Build

```bash
npm run build
```

**Output:**
- Optimized production build in `/build`
- Minified JavaScript
- Optimized CSS
- Asset fingerprinting

### Hosting Options

1. **Vercel** (Recommended)
   - Automatic deployments
   - Edge network
   - Environment variables support

2. **Netlify**
   - Simple setup
   - Continuous deployment
   - Form handling

3. **AWS Amplify**
   - Full AWS integration
   - CI/CD pipeline
   - Scalable hosting

4. **GitHub Pages**
   - Free for public repos
   - Static hosting only

### Database (Supabase)
- Already hosted
- Automatic backups
- Scalable infrastructure

---

## Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Recommended |
| Firefox | 88+ | Full support |
| Safari | 14+ | Face detection may be slower |
| Edge | 90+ | Full support |
| Opera | 76+ | Full support |

**Required Features:**
- ES6+ JavaScript
- WebRTC (for webcam)
- WebGL (for 3D graphics)
- localStorage
- Fetch API

---

## Security Stack

### Frontend Security
- DOMPurify for XSS prevention
- Environment variables for API keys
- HTTPS enforced
- No sensitive data in localStorage

### Backend Security (Supabase)
- Row Level Security (RLS) policies
- JWT-based authentication
- Password hashing (bcrypt)
- SQL injection prevention
- CORS configuration

---

## Testing Stack

### Testing Libraries
- Jest (test runner)
- React Testing Library (component tests)
- @testing-library/user-event (user interactions)
- @testing-library/dom (DOM utilities)

### Test Files
- `*.test.tsx` - Component tests
- `setupTests.ts` - Test configuration
- `App.test.tsx` - Main app test

---

## Cost Analysis

### Free Tier Limits

**Supabase (Free)**
- 500MB database
- 1GB file storage
- 2GB bandwidth/month
- 50,000 monthly active users

**Gemini API (Free)**
- 60 requests per minute
- 1500 requests per day
- No credit card required

**Estimated Monthly Cost:**
- **$0** for small projects (<100 users)
- **$25-50** for medium projects (100-1000 users)
- Custom pricing for enterprise

---

This tech stack provides a modern, scalable foundation for an AI-powered study platform with minimal infrastructure overhead.
