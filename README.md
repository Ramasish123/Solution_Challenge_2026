# Smart Classroom & Timetable Intelligence System

Production-grade full-stack timetable optimization platform for universities. The system combines a FastAPI backend, PostgreSQL persistence, a Genetic Algorithm engine, and a modern React dashboard to generate and analyze multi-solution academic schedules.

## Highlights

- Genetic Algorithm with chromosome-level timetable optimization
- Multi-solution output with top 5 schedules and fitness scoring
- Hard and soft constraint-aware fitness function
- Dynamic rescheduling for faculty unavailability
- Smart swap suggestions and timetable score dashboard
- Multi-department and multi-shift data model support
- JWT authentication with sign-in and sign-up flows
- Modern React multi-page dashboard with analytics charts, heatmaps, timetable grid, and solution comparison

## Page Features

The frontend currently exposes the following user-facing features on the page.

### Authentication Page

- Sign in with either user ID or email
- Sign up directly from the UI
- Teacher and student role selection during registration
- Password confirmation validation during sign up
- Last-used identifier remembered in local storage for faster sign in
- Loading and error feedback during authentication

### Dashboard Header And Session Controls

- Logged-in user summary with full name, username, and role
- Account snapshot card with full name, email, and last login timestamp
- Logout action from the main dashboard
- Success notices and error banners for user actions
- Loading state banner while generation or repair is running

### Optimization Controls

- One-click timetable generation from the Optimization Engine panel
- One-click dynamic rescheduling for faculty unavailability
- Live behavior checklist showing the optimization goals:
  - faculty and room clash elimination
  - workload balancing
  - better room utilization and reduced gaps
  - heavy-subject spacing and slot repair

### Analytics And Monitoring

- Summary stat cards generated from backend analytics
- Dedicated optimization result metrics after generation or rescheduling:
  - utilization percentage
  - conflict count
  - faculty load balance
  - mutation rate
  - generations executed
- Faculty workload bar chart
- Room usage heatmap by day and timeslot

### Timetable Exploration

- Main timetable grid laid out by weekday and time range
- Per-slot subject cards showing subject, batch, faculty, and classroom
- Fitness score and conflict count shown for the selected timetable
- Export of the selected timetable as a JSON file
- Responsive layout with horizontal scroll support for large grids

### Solution Comparison And Decision Support

- Top Solutions section for switching between generated timetable candidates
- Per-solution comparison cards showing fitness, conflicts, utilization, and load balance
- Smart Suggestions panel for swap opportunities and projected gains

### Full CRUD Data Management

- Comprehensive Data Management panel for managing Faculty, Subjects, Classrooms, Batches, and Constraints
- Dynamic assignment of subjects to faculty during creation and editing
- CSV import support for bulk data entry
- Interactive faculty availability management grid

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, Recharts
- Backend: FastAPI, SQLAlchemy
- Database: PostgreSQL
- Algorithm: Genetic Algorithm

## Project Structure

```text
.
├── algorithm/
│   └── genetic_scheduler.py
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   └── package.json
└── start_backend.sh
```

## Database Model

Normalized entities included:

- `departments`
- `faculties`
- `subjects`
- `classrooms`
- `batches`
- `timeslots`
- `constraints`
- `faculty_subjects`
- `faculty_availabilities`
- `faculty_leave_events`
- `users`
- `timetables`
- `timetable_entries`

## Genetic Algorithm Design

### Chromosome

Each chromosome represents a complete timetable.

- Gene: `(batch, subject, faculty, room, timeslot)`

### Initial Population

The initial population is generated using a constructive heuristic, not blind random assignment. It prefers:

- qualified faculty
- available faculty-time combinations
- room capacity fit
- department-local room allocation
- lower clash probability

### Fitness Function

The GA scores each timetable with:

Hard constraints with heavy penalties:

- Faculty clash
- Room clash
- Batch overlap
- Capacity violation
- Invalid faculty-subject allocation
- Faculty unavailability allocation
- Lab/lecture room mismatch

Soft constraints with weighted scoring:

- Balanced faculty workload
- Minimized gaps in daily schedules
- Reduced heavy-subject streaks
- Better room utilization

### Genetic Operations

- Selection: Tournament selection
- Crossover: block crossover across timetable segments
- Mutation: assignment regeneration for selected genes
- Repair: post-mutation hard-conflict repair
- Adaptive mutation: increases when convergence stalls

## API Endpoints

### Auth

- `POST /auth/login`

### Scheduling

- `POST /generate-timetable`
- `GET /timetables`
- `POST /reschedule`
- `GET /analytics`

## Local Setup

### 1. Quick Start (Recommended)

```bash
./start_backend.sh
```

This script automatically creates a virtual environment, installs dependencies, and starts the backend. SQLite is used by default — no database setup needed.

### 2. Backend setup

```bash
cd backend
cp .env.example .env
python3 -m pip install -r requirements.txt
uvicorn app.main:app --reload
``` 

The app seeds demo users and demo scheduling data on first startup.

If you do not have PostgreSQL running yet, the backend now works locally out of the box with the default SQLite fallback at `backend/smart_classroom.db`. For production or full PostgreSQL use, set `DATABASE_URL` in `backend/.env`.

### 3. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

### Demo Accounts

- Admin: `admin@smartclassroom.local` / `Admin@123`
- Scheduler: `scheduler@smartclassroom.local` / `Scheduler@123`
- Viewer: `viewer@smartclassroom.local` / `Viewer@123`

## Feature Notes

### Dynamic Rescheduling

`POST /reschedule` repairs only affected timetable slots for an unavailable faculty member while preserving the rest of the schedule.

### Smart Suggestions Engine

The backend generates targeted swap recommendations by analyzing dense batch days and heavy faculty concentration patterns.

### Timetable Score Dashboard

The dashboard surfaces:

- utilization percentage
- conflict count
- faculty workload balance
- adaptive mutation rate
- multi-solution comparisons

## Verification Performed

Verified locally in this workspace:

- Python source compilation
- FastAPI import boot with database initialization
- GA timetable generation against a real SQLAlchemy-backed database
- Vite production build

## Notes

- The production target database is PostgreSQL.
- A temporary SQLite override was used only for local verification in this workspace.
- The seeded demo environment is intentionally schedulable and designed to showcase multi-department and multi-shift optimization behavior.
