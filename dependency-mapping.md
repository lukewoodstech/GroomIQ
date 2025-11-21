# Dependency Mapping - GroomIQ

## Overview

This document maps every external dependency your application relies on - from cloud services to npm packages to API endpoints. For each, we'll explain WHY it's needed and WHAT would break if it failed.

---

## 1. External Services (Cloud Infrastructure)

### Service 1: Vercel (Deployment Platform)

**What it does:**
- Hosts your Next.js application
- Automatically deploys when you push to GitHub
- Provides serverless functions for your API routes
- Global CDN for fast page loads
- Automatic HTTPS/SSL certificates

**Why you need it:**
Without Vercel (or similar platform like Railway, Render, AWS):
- Your app wouldn't be accessible on the internet
- No automatic deployments
- You'd need to manage servers yourself

**What breaks if it fails:**
- ❌ Entire website goes down
- ❌ Users can't access the app
- ❌ API routes stop working
- ❌ Database connections fail

**Current Status:** Likely configured for deployment (standard Next.js setup)

---

### Service 2: PostgreSQL Database (via Neon/Supabase/Railway)

**What it does:**
- Stores all your data permanently
- Manages relationships between tables
- Ensures data consistency
- Handles concurrent access

**Your Database URL Format:**
```
DATABASE_URL="postgresql://user:password@host:5432/database"
```

**Tables Stored:**
- Users (groomer accounts)
- Clients (pet owners)
- Pets
- Appointments
- Services
- Settings
- Auth-related (Account, Session, VerificationToken)

**Why you need it:**
- No database = no data persistence
- Users couldn't save or retrieve information
- Every refresh would reset the app

**What breaks if it fails:**
- ❌ Can't create/read/update/delete any data
- ❌ Authentication fails (can't verify users)
- ❌ Existing users can't log in
- ❌ All app features become non-functional

**Backup Strategy:** Should implement automated backups!

---

### Service 3: NextAuth.js Session Storage

**What it does:**
- Stores user sessions (who's logged in)
- Uses JWT tokens by default (stored in cookies)
- Could optionally use database sessions

**Current Configuration:** JWT strategy (serverless-friendly)

**What breaks if it fails:**
- ❌ Users get logged out randomly
- ❌ Can't maintain login state
- ❌ Have to log in on every page navigation

---

## 2. Major Libraries & Packages

### Framework Layer

#### Next.js 16.0.3
**What:** Full-stack React framework
**Why:** Provides routing, server-side rendering, API routes, optimization
**What breaks:** Everything. Your entire app is built on Next.js.

**Key Features You Use:**
- App Router (file-based routing)
- Server Actions (backend functions)
- API Routes
- Middleware
- Image optimization
- Built-in TypeScript support

---

#### React 19.2.0
**What:** UI library for building interactive interfaces
**Why:** Powers all your components and user interactions
**What breaks:** All UI stops working. Components won't render.

**Features You Use:**
- Components
- Hooks (useState, useEffect, useForm)
- Client components
- Server components

---

### Backend/Data Layer

#### Prisma 6.19.0
**What:** ORM (Object-Relational Mapper) - JavaScript interface to your database
**Why:**
- Type-safe database queries
- Automatic migrations
- Schema management
- Connection pooling

**What it replaces:** Writing raw SQL queries

**What breaks if it fails:**
- ❌ Can't query database
- ❌ All CRUD operations fail
- ❌ No type safety for database operations

**Commands You Use:**
```bash
npx prisma generate    # Generate Prisma Client
npx prisma migrate dev # Create new migration
npx prisma db seed     # Load demo data
```

---

#### @auth/prisma-adapter 2.11.1
**What:** Connects NextAuth.js to Prisma/database
**Why:** Stores user accounts, sessions in PostgreSQL
**What breaks:** Can't authenticate users, sessions won't persist

---

#### NextAuth.js 5.0.0-beta.30
**What:** Authentication library for Next.js
**Why:** Handles login, logout, sessions, password hashing
**What breaks:**
- ❌ Can't log in or sign up
- ❌ No session management
- ❌ No protected routes

**Providers You Use:**
- Credentials (email/password)

---

#### bcryptjs 3.0.3
**What:** Password hashing library
**Why:** Securely stores passwords (never store plain text!)
**What breaks:** Can't hash passwords, security vulnerability if removed

**Example:**
```javascript
// Hashing (signup)
const hashed = await bcrypt.hash("password123", 10);
// Stores: "$2a$10$N9qo8uLO..."

// Comparing (login)
const match = await bcrypt.compare("password123", stored);
```

---

### Validation Layer

#### Zod 4.1.12
**What:** TypeScript-first schema validation library
**Why:** Validates form inputs, API requests, ensures data integrity
**What breaks:**
- ❌ No input validation
- ❌ Bad data could reach database
- ❌ Security vulnerabilities

**Example Usage:**
```typescript
const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Invalid email"),
});

clientSchema.parse(formData); // Throws error if invalid
```

---

### UI/Form Layer

#### React Hook Form 7.66.0
**What:** Form state management library
**Why:** Handles form inputs, validation, submission efficiently
**What breaks:** Forms become harder to manage, more code needed

---

#### @hookform/resolvers 5.2.2
**What:** Connects React Hook Form with Zod validation
**Why:** Combines form management + validation seamlessly
**What breaks:** Have to manually wire up validation

---

### UI Component Libraries

#### Radix UI (Multiple Packages)
**What:** Unstyled, accessible UI primitives
**Packages Used:**
- @radix-ui/react-dialog - Modal popups
- @radix-ui/react-dropdown-menu - Dropdowns
- @radix-ui/react-label - Form labels
- @radix-ui/react-popover - Popovers
- @radix-ui/react-slot - Component composition

**Why:** Accessibility, keyboard navigation, screen reader support built-in
**What breaks:** UI components lose accessibility features

---

#### Lucide React 0.553.0
**What:** Icon library (open source)
**Why:** Provides all icons (Calendar, Users, Settings, etc.)
**What breaks:** No icons display, UI looks plain

**Icons You Use:**
```typescript
import { Calendar, Users, PawPrint, Settings, LogOut } from "lucide-react"
```

---

### Styling Layer

#### Tailwind CSS 4.0
**What:** Utility-first CSS framework
**Why:** Fast styling without writing custom CSS
**What breaks:** App looks unstyled (just raw HTML)

**Example:**
```tsx
<button className="bg-blue-500 text-white px-4 py-2 rounded">
  Click Me
</button>
```

---

#### class-variance-authority 0.7.1
**What:** Utility for managing component variants
**Why:** Makes it easy to create button variants (primary, secondary, danger)
**What breaks:** Have to manually manage CSS classes for variants

---

#### tailwind-merge 3.4.0
**What:** Merges Tailwind classes intelligently
**Why:** Prevents conflicts when combining classes
**What breaks:** CSS conflicts when classes override each other

---

#### clsx 2.1.1
**What:** Utility for conditionally combining class names
**Why:** Makes dynamic class names cleaner
**What breaks:** More verbose conditional class logic needed

---

### Utility Libraries

#### date-fns 4.1.0
**What:** Date/time manipulation library
**Why:** Formats dates, calculates time differences
**What breaks:** Date formatting becomes manual

**Example:**
```javascript
import { format } from "date-fns"
format(new Date(), "MMM dd, yyyy") // "Nov 21, 2025"
```

---

#### sonner 2.0.7
**What:** Toast notification library
**Why:** Shows success/error messages to users
**What breaks:** No user feedback on actions (silent failures/successes)

**Example:**
```javascript
import { toast } from "sonner"
toast.success("Client created!")
toast.error("Something went wrong")
```

---

#### cmdk 1.1.1
**What:** Command menu component (Command + K style)
**Why:** Could enable keyboard shortcuts for power users
**What breaks:** No command palette functionality (if implemented)

---

## 3. API Endpoints in Your Backend

### Authentication Endpoints

#### `POST /api/auth/signup`
**Purpose:** Create new user account
**File:** `/src/app/api/auth/signup/route.ts`
**Input:** { name, email, password }
**Output:** { message, userId }
**What it does:**
1. Validates input (Zod)
2. Checks if email exists
3. Hashes password (bcrypt)
4. Creates user in database
5. Creates default settings for user

---

#### `GET/POST /api/auth/[...nextauth]`
**Purpose:** NextAuth.js authentication endpoints
**File:** `/src/app/api/auth/[...nextauth]/route.ts`
**Handles:**
- `/api/auth/signin` - Login page
- `/api/auth/signout` - Logout
- `/api/auth/session` - Get current session
- `/api/auth/providers` - List auth providers
- `/api/auth/callback/credentials` - Handle login

**Powered by:** NextAuth.js handlers

---

### Server Actions (Backend Functions)

These are NOT traditional REST API endpoints - they're Next.js Server Actions.

**Client Management:**
- `getClients(page, itemsPerPage)` - List clients with pagination
- `getClient(id)` - Get single client
- `createClient(formData)` - Create new client
- `updateClient(id, formData)` - Update client
- `deleteClient(id)` - Delete client

**Pet Management:**
- `getPets(page, itemsPerPage)` - List pets
- `getPet(id)` - Get single pet
- `createPet(formData)` - Create pet
- `updatePet(id, formData)` - Update pet
- `deletePet(id)` - Delete pet
- `getClients()` - Get all clients (for dropdown in pet form)

**Appointment Management:**
- `getAppointments()` - List all appointments
- `getPets()` - Get all pets (for appointment form)
- `createAppointment(formData)` - Create appointment
- `updateAppointment(id, formData)` - Update appointment
- `updateAppointmentStatus(id, status)` - Change status
- `deleteAppointment(id)` - Delete appointment
- `checkAppointmentConflict()` - Helper to prevent double-booking

**Service Management:**
- `getServices()` - List all services
- `getActiveServices()` - List only active services
- `createService(formData)` - Create service
- `updateService(id, formData)` - Update service
- `deleteService(id)` - Delete service
- `toggleServiceActive(id)` - Enable/disable service

**Settings Management:**
- `getSettings()` - Get business settings
- `updateSettings(formData)` - Update settings

---

## 4. Database Tables and Relationships

### Entity Relationship Diagram (Text Format)

```
User (Groomer Account)
  │
  ├──< has many >── Client (Pet Owners)
  │                    │
  │                    └──< has many >── Pet
  │                                       │
  ├──< has many >───────────────────────< Appointment
  │
  ├──< has many >── Service (Offerings)
  │
  ├──< has one >─── Settings (Business Config)
  │
  └──< has many >── Account, Session (NextAuth)
```

### Table Breakdown

#### Users Table
```sql
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT,
  name        TEXT,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```
**Relationships:**
- One-to-many with Clients
- One-to-many with Pets
- One-to-many with Appointments
- One-to-many with Services
- One-to-one with Settings

**Critical Data:** Email (for login), Password (hashed)

---

#### Clients Table
```sql
CREATE TABLE clients (
  id         TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  user_id    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
**Relationships:**
- Belongs to User
- One-to-many with Pets

**CASCADE:** Deleting user deletes all their clients

---

#### Pets Table
```sql
CREATE TABLE pets (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  breed      TEXT,
  species    TEXT NOT NULL,  -- "dog", "cat", "other"
  age        INTEGER,
  notes      TEXT,
  client_id  TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
**Relationships:**
- Belongs to Client
- Belongs to User
- One-to-many with Appointments

**CASCADE:** Deleting client deletes their pets

---

#### Appointments Table
```sql
CREATE TABLE appointments (
  id         TEXT PRIMARY KEY,
  date       TIMESTAMP NOT NULL,
  duration   INTEGER DEFAULT 60,
  service    TEXT,
  notes      TEXT,
  status     TEXT DEFAULT 'scheduled',
  pet_id     TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
**Relationships:**
- Belongs to Pet
- Belongs to User

**Important Fields:**
- date - When appointment is scheduled
- duration - How long it takes (minutes)
- status - "scheduled", "completed", "cancelled"

---

#### Services Table
```sql
CREATE TABLE services (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  duration    INTEGER DEFAULT 60,
  price       DECIMAL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INTEGER DEFAULT 0,
  user_id     TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
**Relationships:**
- Belongs to User

**Purpose:** Define what services are offered (Full Groom, Nail Trim, etc.)

---

#### Settings Table
```sql
CREATE TABLE settings (
  id              TEXT PRIMARY KEY,
  business_name   TEXT DEFAULT '',
  business_email  TEXT DEFAULT '',
  business_phone  TEXT DEFAULT '',
  default_duration INTEGER DEFAULT 60,
  open_time       TEXT DEFAULT '09:00',
  close_time      TEXT DEFAULT '17:00',
  days_open       TEXT DEFAULT '1,2,3,4,5',
  user_id         TEXT UNIQUE NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```
**Relationships:**
- Belongs to User (one-to-one)

**Purpose:** Store business configuration per user

---

#### NextAuth Tables (Auto-Generated)

**Account** - OAuth connections (if you add Google/Facebook login)
**Session** - Active sessions (if using database sessions)
**VerificationToken** - Email verification tokens

---

## 5. Third-Party Integrations

### Current Integrations: ✅

1. **PostgreSQL Database** (via Neon/Supabase/Railway/local)
2. **NextAuth.js** (authentication)
3. **Prisma** (ORM)

### Future Integrations (Not Yet Implemented): 🔮

1. **Stripe** - Payment processing
   - Would handle subscriptions
   - One-time payments for services
   - Invoice generation

2. **SendGrid/Resend** - Email notifications
   - Appointment reminders
   - Confirmation emails
   - Password reset emails

3. **Twilio** - SMS notifications
   - Text reminders
   - Confirmation texts

4. **Google Calendar** - Calendar sync
   - Sync appointments
   - Two-way sync

5. **Cloudinary** - Image uploads
   - Pet photos
   - Before/after photos

---

## Critical Dependency Chain

### What Your App CANNOT Function Without:

1. **PostgreSQL Database**
   - No data = no app functionality

2. **Next.js Runtime**
   - Framework that powers everything

3. **React**
   - UI rendering

4. **Prisma**
   - Database access

5. **NextAuth.js**
   - User authentication

### What Would Degrade Gracefully:

1. **Sonner (Toasts)**
   - App works, but no user feedback

2. **Lucide Icons**
   - App works, but looks plain

3. **Tailwind CSS**
   - App works, but unstyled

4. **date-fns**
   - Dates display as ISO strings

---

## Summary: Dependency Health Check

### ✅ Production-Ready Dependencies
- Next.js - Stable, well-supported
- React - Industry standard
- Prisma - Mature ORM
- NextAuth.js - Trusted authentication
- Tailwind CSS - Widely adopted
- Zod - Growing rapidly

### 🟡 Worth Monitoring
- NextAuth v5 (still in beta) - Might want to update when stable
- Next.js 16 (just released) - Stay on latest stable

### ❌ Missing But Recommended
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Database backups (automated)
- Email service (for password reset)

---

## What to Do If Dependencies Fail

| Dependency | Backup Plan | Migration Effort |
|------------|-------------|------------------|
| Vercel | Deploy to Railway/Render/AWS | Medium (1-2 days) |
| PostgreSQL | Switch provider (Neon→Supabase) | Easy (1-2 hours) |
| NextAuth | Implement custom auth | Hard (1-2 weeks) |
| Prisma | Raw SQL or TypeORM | Hard (2-3 weeks) |
| Tailwind | CSS Modules or Emotion | Medium (3-5 days) |
| Radix UI | HeadlessUI or custom | Medium (1 week) |

**Key Insight:** Your most critical dependencies (Next.js, React, Prisma) are all industry-standard choices with large communities and long-term support.
