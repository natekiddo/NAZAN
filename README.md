# 🚀 ProjectHub — Developer Workspace & Project Management Platform

ProjectHub is a modern, production-grade workspace and project management web application tailored for software developers, technical teams, and solo builders. It unifies project tracking, task boards, deep work session timers, private cloud storage, AI assistance, calendar notifications, Google Drive linking, and local desktop synchronization into a single, cohesive dashboard.

---

## ✨ Features & Modules

### 1. 📂 Projects & Workspace Management
- **Centralized Project Catalog**: Manage multiple projects with custom statuses (`planning`, `in_progress`, `completed`, `on_hold`, `archived`), priorities (`low`, `medium`, `high`, `urgent`), categories, and tech stack tags.
- **Detailed Project View**: 6 dedicated tabs per project:
  - **Overview**: Description, metadata, tech stack badges, deadline metrics, and quick action bar.
  - **Tasks**: Filtered project task lists and progress indicators.
  - **Milestones**: Roadmap timeline tracking target dates and completion status.
  - **Files**: Dedicated project asset repository with instant preview and download.
  - **Notes**: Markdown-ready documentation and project-specific scratchpads.
  - **History**: Audit trail tracking status updates, member activity, and commits.
- **Project ZIP Export**: Bundle and download all project files, metadata, and task exports in a single ZIP file powered by client-side streaming.

### 2. 📋 Interactive Kanban & Task Tracking
- **5-Column Workflow**: Move tasks seamlessly between `Backlog`, `Todo`, `In Progress`, `In Review`, and `Done`.
- **Dynamic Task Metadata**: Due dates, priorities, subtask checklist counters, tags, and project associations.
- **Automated Progress Sync**: Project overall completion percentages recalculate automatically as tasks reach completion.
- **View Toggle**: Switch effortlessly between the visual Kanban board and a compact tabular list view.

### 3. ⏱️ Deep Work Sessions & Session Journal
- **Persistent Live Stopwatch**: Global work timer that continues running across page navigations and browser refreshes with delta timestamp tracking.
- **Floating Active Session Bar**: Pause, resume, minimize, and stop sessions from anywhere in the application.
- **Reflective Journaling**: Prompting prompt on session completion:
  - Summary of work accomplished.
  - Blockers and challenges encountered.
  - Clear next steps for the next session.
- **"Continue Where You Stopped"**: One-click resume widget on the dashboard that surfaces your last unfinished task and previous session notes.

### 4. 📁 File Manager & Supabase Storage
- **Drag-and-Drop Uploader**: Direct upload pipeline supporting code, images, archives, documents, and videos.
- **Strict Tenant Isolation**: Files are stored in a private Supabase Storage bucket (`project-files`) organized by user and file IDs with strict Row Level Security (RLS).
- **Time-Limited Signed URLs**: Secure authenticated access to download and preview files without public bucket exposure.
- **Search & Filters**: Filter by project, file category (images, documents, code, archives), and search by name.

### 5. 🤖 Gemini 3.8 Flash AI Assistant
- **Context-Aware Workspace Assistant**: Chat with Google's Gemini 3.8 Flash model (`gemini-3.8-flash` or `models/gemini-3.8-flash`) directly within the dashboard.
- **Automatic Workspace Context**: The assistant automatically inspects your active projects, pending high-priority tasks, and recent session notes to give actionable advice.
- **Daily Executive Briefing**: Generate on-demand daily summaries highlighting your most critical deadlines, blocker mitigations, and prioritized to-do list.
- **Resilient Fallback Mode**: Gracefully operates even when offline or before an API key is configured with built-in heuristic analysis.

### 6. 📅 Calendar, Reminders & Email Notifications
- **Unified Event Calendar**: Month and week grid views displaying task due dates, milestone targets, and custom reminders.
- **Multi-Channel Reminders**: Configure alerts via in-app notification center or high-priority email delivery via Resend.
- **Automated Cron Processor**: Deduplicated background processing with idempotency keys ready for Vercel Cron or scheduled webhooks.
- **Notification Inbox**: Mark as read, filter unread alerts, and jump directly to relevant project items.

### 7. ☁️ Google Drive Integration
- **OAuth 2.0 Flow**: Connect Google Drive securely with token refresh rotation.
- **Document Picker**: Link Google Docs, Sheets, Slides, and Drive folders directly to projects.
- **Live Search & Fallback**: Search Drive files with metadata, web links, and file icon categorization, plus a demo mode for testing without credentials.

### 8. 💻 Desktop Synchronization & CLI
- **Two-Way Sync Architecture**: Synchronize local project folders on developer workstations with ProjectHub cloud storage.
- **Device Management**: Register and inspect connected desktop machines, configure conflict resolution strategies (`server_wins`, `client_wins`, `manual`), and customize `.projecthubignore` rules.
- **Standalone Node.js CLI**: Run `scripts/projecthub-sync-cli.js` on your computer to watch directories, upload local changes, and fetch remote updates via pre-signed S3/Supabase upload URLs.

### 9. 🔍 Global Search & Command Palette
- **Keyboard Shortcut (`Ctrl+K` / `Cmd+K`)**: Rapidly search across projects, tasks, past work sessions, and uploaded files.
- **Quick Navigation**: Keyboard-accessible results with status badges and instant deep-links.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (v16.2 with App Router and Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) Icons
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with RLS, SSR Auth, Edge Storage)
- **AI Engine**: Google Gemini API via official `@google/genai` SDK (`gemini-3.8-flash`)
- **Email Service**: [Resend](https://resend.com/) API
- **File Utilities**: [JSZip](https://stuk.github.io/jszip/) for client-side archive generation
- **TypeScript**: Strict type-checking across all schemas, server actions, and API routes

---

## 📁 Project Structure

```text
projecthub/
├── docs/
│   └── SYNC_ARCHITECTURE.md        # Desktop synchronization protocol specification
├── scripts/
│   └── projecthub-sync-cli.js       # Node.js CLI daemon for local filesystem sync
├── supabase/
│   └── migrations/
│       ├── 20261009000000_init_schema.sql    # 16 PostgreSQL tables, RLS policies & triggers
│       └── 20261010000001_storage_setup.sql  # Supabase private storage bucket & RLS policies
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Login, Signup, Forgot Password routes
│   │   ├── (dashboard)/            # Core dashboard layout & feature views
│   │   │   ├── page.tsx            # Executive Dashboard & "Continue where you stopped"
│   │   │   ├── projects/           # Projects list & [id] detail views
│   │   │   ├── tasks/              # Kanban & list task management
│   │   │   ├── sessions/           # Deep work session journal & history
│   │   │   ├── files/              # Storage file explorer & dropzone
│   │   │   ├── calendar/           # Calendar view & reminder creator
│   │   │   ├── notifications/      # Notification center
│   │   │   ├── drive/              # Google Drive integration view
│   │   │   └── settings/           # Profile & desktop sync devices configuration
│   │   └── api/                    # Serverless endpoints (sync, reminders, Google OAuth)
│   ├── components/                 # Modular, accessible UI components
│   │   ├── ai/                     # Gemini assistant chat & briefing modals
│   │   ├── calendar/               # Calendar grid & reminder modals
│   │   ├── dashboard/              # Metrics, charts, resume work buttons
│   │   ├── drive/                  # Google Drive file viewer & linkers
│   │   ├── files/                  # Dropzone, grid, list, and project file managers
│   │   ├── layout/                 # Sidebar, TopNavbar, Command Palette modal
│   │   ├── notifications/          # Notification inbox & badge popovers
│   │   ├── projects/               # Project cards, tables, detail tabs & modals
│   │   ├── sessions/               # ActiveSessionBar & session completion journal
│   │   ├── sync/                   # Connected devices manager & conflict settings
│   │   └── tasks/                  # Kanban board, task cards, and task modal
│   ├── context/
│   │   └── SessionTimerContext.tsx # Persistent work session stopwatch provider
│   ├── lib/
│   │   ├── actions/                # Next.js Server Actions for Supabase mutations
│   │   ├── email.ts                # Resend HTML email dispatcher & templates
│   │   ├── gemini.ts               # Google GenAI SDK integration
│   │   ├── google-drive.ts         # Google OAuth & Drive API client
│   │   ├── supabase/               # Client, Server, and Middleware Supabase instances
│   │   └── utils.ts                # Formatting and class merging helpers
│   ├── types/
│   │   └── database.ts             # TypeScript definitions for all database tables
│   └── middleware.ts               # Supabase SSR session validation middleware
├── .env.example                    # Template of all environment variables
├── package.json
└── vercel.json                     # Vercel Cron schedule configuration
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18.18 or higher (v20+ recommended)
- A free [Supabase](https://supabase.com/) project
- (Optional) [Google Gemini API Key](https://aistudio.google.com/) for AI assistant features
- (Optional) [Resend API Key](https://resend.com/) for automated email notifications
- (Optional) [Google Cloud Console Credentials](https://console.cloud.google.com/) for Google Drive integration

---

### 2. Clone and Install Dependencies

```bash
cd projecthub
npm install
```

---

### 3. Database & Storage Setup (Supabase)

1. Log into your **Supabase Dashboard** and navigate to your project.
2. Open the **SQL Editor** in the left sidebar.
3. **Run Migration 1 (Core Schema)**:
   - Copy the entire contents of [`supabase/migrations/20261009000000_init_schema.sql`](supabase/migrations/20261009000000_init_schema.sql).
   - Paste into the SQL Editor and click **Run**.
   - This creates 16 database tables, indexes, automatic `updated_at` triggers, and Row Level Security (RLS) policies.
4. **Run Migration 2 (Storage Bucket & Policies)**:
   - Copy the entire contents of [`supabase/migrations/20261010000001_storage_setup.sql`](supabase/migrations/20261010000001_storage_setup.sql).
   - Paste into the SQL Editor and click **Run**.
   - This creates the private `project-files` storage bucket and configures user-scoped access policies.

---

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env.local
```

Fill in the required values:

```ini
# Supabase Configuration (Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Google Gemini API (https://aistudio.google.com/)
GEMINI_API_KEY=your-gemini-api-key

# Resend Email (https://resend.com/)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=notifications@yourdomain.com

# Google Drive Integration (Google Cloud Console OAuth 2.0 Client)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_PICKER_API_KEY=your-google-api-key

# App Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note**: If you do not have API keys for Gemini, Resend, or Google Drive yet, ProjectHub will automatically switch to **graceful simulation modes**, allowing you to explore and test all UI and database features immediately without configuration errors!

---

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
Create an account on the `/signup` page to begin managing your workspace!

---

## 💻 Running the Desktop Sync CLI

ProjectHub includes a lightweight Node.js sync agent that can sync local project directories on your computer to ProjectHub cloud storage.

1. Generate an API token / obtain your User ID from your Supabase dashboard or ProjectHub Settings.
2. Run the sync CLI:
   ```bash
   node scripts/projecthub-sync-cli.js --path ./my-local-code --project-id <PROJECT_UUID> --api-url http://localhost:3000
   ```
3. Pass `--watch` to keep the CLI running in daemon mode, automatically synchronizing whenever files are saved locally:
   ```bash
   node scripts/projecthub-sync-cli.js --path ./my-local-code --project-id <PROJECT_UUID> --watch
   ```
4. For full architectural details, conflict strategies, and ignore rules, read [`docs/SYNC_ARCHITECTURE.md`](docs/SYNC_ARCHITECTURE.md).

---

## ☁️ Deployment (Vercel)

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Import the repository in [Vercel](https://vercel.com).
3. Add your environment variables in the Vercel Project Settings.
4. Set the `NEXT_PUBLIC_APP_URL` variable to your production domain (e.g., `https://projecthub.yourdomain.com`).
5. Vercel will automatically detect `vercel.json` and schedule the reminder cron job:
   ```json
   {
     "crons": [
       {
         "path": "/api/reminders/process",
         "schedule": "*/15 * * * *"
       }
     ]
   }
   ```
6. Click **Deploy**. Your ProjectHub platform is live!

---

## 📄 License

MIT License. Free to use, adapt, and build upon for personal and commercial development workspaces.
