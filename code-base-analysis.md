# Code Base Analysis - GroomIQ

## Project Overview

**GroomIQ** is a pet grooming CRM (Customer Relationship Management) application built with modern web technologies. It helps pet groomers manage their clients, pets, appointments, services, and business settings all in one place.

**Total Lines of Code:** 7,535 lines (excluding dependencies)
**Total Code Files:** 48 files
**Framework:** Next.js 16 (React-based full-stack framework)

---

## Complete Directory Structure

```
groomiq/
├── prisma/                      # Database layer
│   ├── migrations/              # Database schema changes over time
│   └── schema.prisma           # Database table definitions
├── public/                      # Static files (images, icons)
├── src/                         # All application source code
│   ├── app/                    # Frontend pages and backend API routes
│   │   ├── actions/            # Server-side business logic
│   │   ├── api/                # Backend API endpoints
│   │   ├── clients/            # Client management pages
│   │   ├── login/              # Authentication pages
│   │   ├── pets/               # Pet management pages
│   │   ├── schedule/           # Appointment scheduling pages
│   │   ├── settings/           # Business settings pages
│   │   └── signup/             # User registration pages
│   ├── components/             # Reusable UI components
│   │   └── ui/                 # Shadcn UI component library
│   ├── lib/                    # Utility functions and configurations
│   └── types/                  # TypeScript type definitions
├── .env                        # Environment variables (secrets, API keys)
├── package.json                # Project dependencies and scripts
└── tsconfig.json               # TypeScript configuration
```

---

## Role of Each Major Directory

### 1. `/prisma` - Database Layer

**Purpose:** Manages everything related to your database

- **`schema.prisma`** - The single source of truth for your database structure. Defines tables like User, Client, Pet, Appointment, Service, Settings
- **`migrations/`** - Keeps a history of all database changes. Think of it like Git commits for your database
- **`seed.ts`** - Pre-loads your database with demo data (demo user, default services)

**Analogy:** Think of Prisma as your database's instruction manual. The schema is the blueprint, migrations are the construction log, and seed is the furniture you put in when moving in.

---

### 2. `/src/app` - The Heart of Your Application

**Purpose:** Contains all your pages (frontend) and API routes (backend)

Next.js uses "file-based routing" - the folder structure = URL structure:
- `app/page.tsx` → Home page at `/`
- `app/clients/page.tsx` → Clients page at `/clients`
- `app/clients/[id]/page.tsx` → Individual client page at `/clients/123`

#### Sub-directories:

**`/app/actions/`** - Server Actions (Backend Logic)
- **What:** Server-side functions that handle database operations
- **Files:**
  - `appointments.ts` - Create, read, update, delete appointments
  - `clients.ts` - Manage client records
  - `pets.ts` - Manage pet records
  - `services.ts` - Manage service offerings
  - `settings.ts` - Manage business settings
- **Why separate from pages?** Keeps data logic separate from UI code. These run on the server only, never sent to the user's browser.

**`/app/api/`** - API Routes (Backend Endpoints)
- **`api/auth/[...nextauth]/route.ts`** - Handles login/logout requests
- **`api/auth/signup/route.ts`** - Handles new user registration
- **Why:** These are traditional REST API endpoints. The client sends a request, gets JSON back.

**Page Directories:**
- **`/clients`** - List all clients, view/edit individual clients
- **`/pets`** - List all pets, view/edit individual pets
- **`/schedule`** - View and manage appointments
- **`/settings`** - Configure business hours, services, pricing
- **`/login` & `/signup`** - Authentication pages (no sidebar shown)

Each page directory contains:
- `page.tsx` - The main page component (what users see)
- Sometimes `layout.tsx` - Custom layout wrapper for that section
- Sometimes `[id]/page.tsx` - Dynamic pages for individual items

---

### 3. `/src/components` - Reusable UI Building Blocks

**Purpose:** Components used across multiple pages

**Structure:**
```
components/
├── ui/                    # Shadcn UI primitives (buttons, dialogs, inputs)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ... (30+ components)
└── sidebar.tsx            # Main navigation sidebar
└── layout-content.tsx     # Layout wrapper for authenticated pages
```

**What's Shadcn UI?** A collection of copy-paste React components built with Radix UI and Tailwind CSS. Unlike a traditional library, you own the code - it's copied into your project.

**Key Components:**
- **`sidebar.tsx`** - The left navigation menu with links to Clients, Pets, Schedule, Settings
- **`ui/dialog.tsx`** - Modal popups for forms
- **`ui/button.tsx`** - Styled buttons used everywhere
- **`ui/input.tsx`** - Form input fields

---

### 4. `/src/lib` - Utility Functions & Configuration

**Purpose:** Helper functions and shared configurations

**Files:**
- **`prisma.ts`** - Creates a single database connection shared across the app (prevents too many connections)
- **`utils.ts`** - Helper functions like `cn()` for combining CSS classes

---

### 5. `/src/types` - TypeScript Type Definitions

**Purpose:** Custom TypeScript types to help catch bugs before runtime

**Files:**
- **`next-auth.d.ts`** - Extends NextAuth types to include user ID in session

**Why types?** TypeScript checks your code for errors while you write it, like spell-check for code.

---

### 6. Root Configuration Files

**`package.json`** - Lists all dependencies and scripts
```json
{
  "dependencies": {
    "next": "16.0.3",           // Framework
    "react": "19.2.0",          // UI library
    "prisma": "^6.19.0",        // Database ORM
    "next-auth": "^5.0.0",      // Authentication
    ...
  },
  "scripts": {
    "dev": "next dev",          // Start development server
    "build": "next build",      // Create production build
  }
}
```

**`tsconfig.json`** - TypeScript compiler settings
**`tailwind.config.ts`** - Tailwind CSS styling configuration
**`.env`** - Environment variables (database URL, secrets) - **NEVER commit this file!**

---

## File Type Categories

### Frontend Files (UI/User-Facing)
- All files in `/app/**/page.tsx` - The actual pages users see
- All files in `/components/**/*.tsx` - Reusable UI pieces
- `/app/globals.css` - Global styling
- **Count:** ~25 files

### Backend Files (Server/Data)
- All files in `/app/actions/*.ts` - Server-side data operations
- All files in `/app/api/**/route.ts` - API endpoints
- `/src/auth.ts` - Authentication configuration
- `/src/middleware.ts` - Request interception for auth
- **Count:** ~8 files

### Database Files
- `/prisma/schema.prisma` - Database structure
- `/prisma/seed.ts` - Demo data loader
- `/prisma/migrations/*` - Database version history
- **Count:** ~3 files + migrations

### Configuration Files
- `package.json`, `tsconfig.json`, `tailwind.config.ts`, `.env`, `next.config.ts`
- **Count:** ~5 files

### Type Definition Files
- `/src/types/*.d.ts`
- **Count:** ~1 file

---

## Key Technology Choices & Why

### Next.js 16 (Framework)
**What:** A React framework for building full-stack web applications
**Why:** Lets you write both frontend (UI) and backend (API) in one project. Handles routing, optimization, and deployment automatically.

### React 19 (UI Library)
**What:** JavaScript library for building user interfaces
**Why:** Industry standard. Makes it easy to build interactive UIs with reusable components.

### Prisma (Database ORM)
**What:** Object-Relational Mapper - lets you work with databases using JavaScript/TypeScript instead of SQL
**Why:** Type-safe database queries, automatic migrations, excellent developer experience.

### NextAuth.js v5 (Authentication)
**What:** Authentication library specifically for Next.js
**Why:** Handles login, logout, sessions, password hashing. Industry-standard solution.

### Tailwind CSS (Styling)
**What:** Utility-first CSS framework
**Why:** Fast styling with pre-built classes like `flex`, `p-4`, `bg-blue-500`. No need to write custom CSS.

### Shadcn UI (Component Library)
**What:** Collection of accessible, customizable React components
**Why:** Beautiful components you own and can modify. Built on Radix UI (accessibility) + Tailwind (styling).

### TypeScript (Language)
**What:** JavaScript with type checking
**Why:** Catches errors before runtime. Makes code more maintainable and self-documenting.

---

## Lines of Code Breakdown (Estimate)

| Category | Lines | Percentage |
|----------|-------|------------|
| Frontend UI Components | ~2,500 | 33% |
| Backend Logic (Actions + API) | ~1,200 | 16% |
| Database Schema + Seed | ~300 | 4% |
| Shadcn UI Components | ~3,000 | 40% |
| Configuration Files | ~300 | 4% |
| Type Definitions | ~235 | 3% |
| **Total** | **7,535** | **100%** |

---

## How Everything Connects (High-Level)

1. **User visits a page** → Next.js renders the page from `/app/*/page.tsx`
2. **Page needs data** → Calls a Server Action from `/app/actions/*.ts`
3. **Server Action** → Uses Prisma to query the PostgreSQL database
4. **Database returns data** → Prisma converts it to JavaScript objects
5. **Server Action returns data** → Page receives data and displays it
6. **User clicks a button** → Form submission triggers another Server Action
7. **Server Action updates database** → Page refreshes to show new data

**Authentication Flow:**
1. User enters credentials on `/login`
2. NextAuth validates against database
3. If valid, creates a session (JWT token)
4. Middleware checks session on every request
5. Unauthorized users redirected to `/login`

---

## Summary for a Beginner

Think of your app like a restaurant:

- **Frontend (`/app` pages)** = The dining room where customers interact
- **Components (`/components`)** = Reusable dishes you serve (appetizers, entrees)
- **Backend (`/app/actions`)** = The kitchen where food is prepared
- **Database (`/prisma`)** = The pantry and refrigerator storing ingredients
- **API Routes (`/app/api`)** = The waiter taking orders and bringing food
- **Middleware (`/middleware.ts`)** = The host checking reservations before seating
- **Configuration files** = The restaurant's recipes, pricing, and rules

Your codebase is well-organized using Next.js's recommended structure. Everything has a clear purpose and location, making it easy to find and modify features.
