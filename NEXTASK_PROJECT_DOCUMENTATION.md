# 📘 NexTask — Complete Project Architecture & Technical Documentation

> **Project Name:** NexTask  
> **Type:** Full-Stack Enterprise Multi-Role Project & Workflow Management Suite  
> **Author & Solo Developer:** Built and Designed end-to-end (UI/UX, Frontend & Backend Architecture)  
> **Tech Stack:** React 19, Tailwind CSS v4, Express.js, PostgreSQL / Supabase, Recharts, Vite  

---

## 📑 Table of Contents
1. [Project Overview & Mission](#1-project-overview--mission)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Role-Based Access Control (RBAC) & Workspaces](#3-role-based-access-control-rbac--workspaces)
   - [A. Executive Admin Workspace](#a-executive-admin-workspace)
   - [B. Operational Project Head Workspace](#b-operational-project-head-workspace)
   - [C. Team Member Performance Workspace](#c-team-member-performance-workspace)
4. [Core Functional Modules](#4-core-functional-modules)
   - [Projects & Task Allocation Engine](#project--task-allocation-engine)
   - [Deadline Change Request System](#deadline-change-request-system)
   - [Daily Work Reports & Hours Logging](#daily-work-reports--hours-logging)
   - [Client Relationship Pipeline (CRM)](#client-relationship-pipeline-crm)
   - [HR & Personnel Management (Attendance, Payroll, Documents)](#hr--personnel-management)
   - [Leaves & Permissions Portal](#leaves--permissions-portal)
   - [In-App Notifications & Audit History](#in-app-notifications--audit-history)
5. [UI/UX & Design System Standards](#5-uiux--design-system-standards)
6. [Data Models & Database Schema](#6-data-models--database-schema)
7. [API Endpoints Architecture](#7-api-endpoints-architecture)
8. [Setup, Installation & Running Locally](#8-setup-installation--running-locally)

---

## 1. Project Overview & Mission

**NexTask** is an end-to-end enterprise SaaS suite designed to solve the friction found in modern organization workflows:
- Disconnected tools for tasks, attendance, and client relations.
- Unclear delegation and ambiguous project ownership.
- Lack of accountability in deadlines and project budget overruns.
- Low-contrast, cluttered interfaces that hinder productivity.

NexTask consolidates **Project Governance, Client Pipelines, Task Execution, and HR Operations** into a single cohesive platform with strict Role-Based Access Control (RBAC).

---

## 2. High-Level Architecture

The project is structured as an integrated monorepo consisting of a lightweight backend and a responsive, component-driven client:

```
mini-project/f-1/
├── backend/                  # Node.js + Express REST API
│   ├── db.js                 # PostgreSQL connection pool & resilient fallback
│   ├── index.js              # Central REST API server & business logic
│   └── schema.sql            # PostgreSQL relational database schema
├── frontend/                 # React 19 + Vite SPA
│   ├── src/
│   │   ├── components/       # Header, Sidebar, UIProvider
│   │   ├── pages/            # Role-specific Dashboards & Module pages
│   │   ├── utils/            # Data export utilities (CSV/PDF)
│   │   ├── App.jsx           # Routing & RBAC guard wrappers
│   │   └── main.jsx          # Root initialization
│   └── index.html
└── package.json              # Monorepo orchestration (concurrent dev scripts)
```

### Architectural Highlights
- **Dual-Mode Persistence**: The backend connects directly to PostgreSQL (e.g. Supabase). If external cloud connectivity is unavailable or paused, it seamlessly operates using an in-memory synchronized datastore with mock data so demos and evaluations are never disrupted.
- **Client-Side RBAC Guarding**: Protected layout wrappers inspect user session state and instantly redirect unauthorized routes to their role-appropriate workspace.
- **Export Capabilities**: Built-in export engines allow project managers and admins to extract project logs, attendance rosters, and financial tables into CSV/PDF reports.

---

## 3. Role-Based Access Control (RBAC) & Workspaces

The platform enforces three distinct user roles, each with designated access permissions and specialized user interfaces:

### A. Executive Admin Workspace (`/admin`)
- **Executive KPI Dashboard**: High-level metrics aggregating total company revenue/budgets, active projects, onboarded clients, and headcount.
- **Corporate Projects Analytics (`/admin/projects`)**: Full visibility across all departments and project categories. Admins can create projects, assign budgets, set initial timelines, appoint Project Heads, and delete or archive projects.
- **Client Relationship Pipelines (`/admin/clients`)**: Lead capture, status stages (`lead` ➔ `follow_up` ➔ `onboarded`), interaction logs, and converted project linkages.
- **Personnel & HR Management (`/admin/hr`)**: Employee directories, status toggling (active/inactive), document attachments (e.g., Offer Letters, ID proofs), attendance records, and leave reviews.

### B. Operational Project Head Workspace (`/head`)
- **Operational Project Head Dashboard**: Focuses on active deliverables under their charge, team workload, milestone health, pending member reports, and urgent deadline requests.
- **Workspace Boards & Allocations (`/head/projects`)**:
  - Create granular tasks for assigned projects.
  - Delegate tasks to specific team developers.
  - Review and approve submitted progress reports and hours logged.
  - Accept or reject deadline extension requests submitted by developers.
- **Leaves & Permissions Portal (`/head/leaves`)**: Submit personal leave requests and track review status.

### C. Team Member Performance Workspace (`/member`)
- **Team Member Dashboard**: Displays individual productivity metrics (assigned tasks, hours logged, completion rate, attendance status).
- **My Tasks & Activity Board (`/member/projects`)**:
  - Filter view showing only tasks assigned to the logged-in member.
  - Task state updates (`todo` ➔ `in_progress` ➔ `review` ➔ `completed`).
  - **Submit Daily Reports**: Log hours worked, update completion %, and provide written milestone notes.
  - **Request Deadline Extension**: Modal to submit formal requests with reason for Project Head evaluation.
- **Leaves & Permissions Portal (`/member/leaves`)**: Apply for casual/sick/emergency leaves and view personal attendance history.

---

## 4. Core Functional Modules

### Project & Task Allocation Engine
- **Hierarchy**: `Client` ➔ `Project` ➔ `Tasks` ➔ `Reports / History Logs`.
- Projects track: Name, Client, Category, Department, Priority (Low, Medium, High, Urgent), Budget (₹), Dates, and Project Head.
- Tasks track: Title, Assigned Developer, Dates, Status pill, and Completion progress bar (0–100%).

### Deadline Change Request System
- Eliminates informal communication for deadlines.
- When a developer encounters blockers, they submit an extension request containing the requested date and justification.
- Project Heads receive immediate visual badges and can one-click **Approve** (which automatically updates the task's end date) or **Reject** with feedback.

### Daily Work Reports & Hours Logging
- Team members record daily contributions against specific tasks.
- Project heads review and verify submissions to prevent inaccurate project velocity estimates.

### Client Relationship Pipeline (CRM)
- Categorizes client prospects into a 3-stage funnel:
  1. **New Lead**: Recently captured inquiry.
  2. **Follow-Up**: Active discussions with timeline and pricing quotes documented.
  3. **Onboarded**: Signed client with active projects.
- Search, filter by company name, and export client lists.

### HR & Personnel Management
- **Employee Directory**: Records employee designations, departments, contact numbers, joining dates, and employment types.
- **Attendance Register**: Daily check-in, check-out tracking, remote vs. office work mode, and attendance status.
- **Document Locker**: Upload and view employee credentials, contracts, and certificates.

### Leaves & Permissions Portal
- Tracks balances for Casual, Sick, and Earned leaves.
- Form inputs validate dates and automatic day calculations.
- Live status tags: `Pending`, `Approved`, `Rejected`.

### In-App Notifications & Audit History
- Real-time notifications for assigned tasks, report approvals, and leave reviews.
- `project_history` audit trail logs creation, modifications, budget changes, and status shifts for accountability.

---

## 5. UI/UX & Design System Standards

The interface follows a custom-designed, accessibility-first design standard:
1. **High Contrast Borders**: All cards and metrics panels use solid borders (`border-slate-400` / `border-slate-300`) with crisp shadows to eliminate ambiguous faint outlines.
2. **Typography Rules**:
   - Headers: `font-bold` / `font-extrabold` in high-contrast neutral (`text-slate-900` or `text-slate-950`).
   - Labels & Badges: `font-semibold` / `font-medium`.
   - Never use thin (`font-light`) or faint gray colors.
3. **Indian Rupee Formatting**: Currency amounts are formatted in standard Indian numbering (e.g., `₹15,00,000.00`).
4. **Standardized Dates**: All displayed dates conform strictly to `DD-MM-YYYY`.
5. **No Truncated Data**: Content is wrapped cleanly without hiding vital details behind ellipses.

---

## 6. Data Models & Database Schema

The database is built on relational PostgreSQL schema rules:

| Table | Description | Key Foreign Keys |
|---|---|---|
| `users` | Accounts, roles, designations, contact info, documents | Self-contained |
| `clients` | Client CRM profiles and follow-up notes | Self-contained |
| `projects` | Master project repository with budget and timeline | `client_id` ➔ `clients`, `project_head_id` ➔ `users` |
| `tasks` | Deliverables and sprints assigned to team members | `project_id` ➔ `projects`, `assigned_to` ➔ `users` |
| `deadline_requests` | Formal requests to extend task deadlines | `task_id` ➔ `tasks`, `requested_by` ➔ `users` |
| `reports` | Daily logged progress and work hours | `task_id` ➔ `tasks`, `submitted_by` ➔ `users` |
| `project_history` | Audit trail of modifications and status updates | `project_id` ➔ `projects` |
| `attendance` | Daily check-in/out and work modes | `user_id` ➔ `users` |
| `leaves` | Leave applications and approval status | `user_id` ➔ `users`, `reviewed_by` ➔ `users` |
| `notifications` | In-app notification alerts | `user_id` ➔ `users` |

---

## 7. API Endpoints Architecture

The Express server exposes modular REST endpoints:

- **Authentication**: `POST /api/login`, `GET /api/me`
- **Users & HR**: `GET /api/users`, `POST /api/users`, `PUT /api/users/:id`, `DELETE /api/users/:id`
- **Attendance & Leaves**: `GET /api/attendance`, `POST /api/attendance`, `GET /api/leaves`, `POST /api/leaves`, `PUT /api/leaves/:id`
- **Clients**: `GET /api/clients`, `POST /api/clients`, `PUT /api/clients/:id`, `DELETE /api/clients/:id`
- **Projects**: `GET /api/projects`, `POST /api/projects`, `PUT /api/projects/:id`, `DELETE /api/projects/:id`, `GET /api/projects/:id/history`
- **Tasks & Sprints**: `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`
- **Deadline Requests**: `GET /api/deadline-requests`, `POST /api/deadline-requests`, `PUT /api/deadline-requests/:id`
- **Reports & Hours**: `GET /api/reports`, `POST /api/reports`, `PUT /api/reports/:id`
- **Notifications**: `GET /api/notifications`, `PUT /api/notifications/:id/read`

---

## 8. Setup, Installation & Running Locally

### Prerequisites
- Node.js (v18+ recommended)
- npm

### 1. Installation
Clone the repository and install root and package dependencies:
```bash
# In the root project directory:
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. Environment Configuration
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
```
*(If `DATABASE_URL` is omitted or unconfigured, the app will run with the built-in in-memory fallback store).*

### 3. Run Development Servers
From the root directory, run both frontend and backend concurrently:
```bash
npm run dev
```
- **Backend API**: Running at `http://localhost:5000`
- **Frontend App**: Running at `http://localhost:5173`

### Demo Credentials
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@saas.com` | `admin123` |
| **Project Head** | `head@saas.com` | `head123` |
| **Team Member** | `member@saas.com` | `member123` |
