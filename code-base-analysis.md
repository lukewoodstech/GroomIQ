# GroomIQ Codebase Analysis

**For Beginners on the Fast Track to World-Class Engineering**

Last Updated: December 3, 2025  
Total Lines of Code: **8,849 lines** (excluding dependencies)  
Total TypeScript Files: **55 files**

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [File-by-File Breakdown](#file-by-file-breakdown)
4. [Code Statistics](#code-statistics)

---

## Project Overview

**GroomIQ** is a modern pet grooming CRM (Customer Relationship Management) application with subscription billing.

**Tech Stack:**
- **Frontend**: Next.js 16 + React 19 + TailwindCSS v4
- **Backend**: Next.js API Routes (serverless)
- **Database**: PostgreSQL (Supabase) + Prisma ORM
- **Auth**: NextAuth.js v5
- **Payments**: Stripe
- **Hosting**: Vercel

**What This App Does:**
- Manages pet grooming clients and their pets
- Books and schedules grooming appointments
- Offers subscription plans (Free: 10 clients max, Pro: $10/month unlimited)
- Tracks services offered by businesses

---

## Directory Structure

### Root Level
```
groomiq/
├── .claude/              # Claude Code settings
├── .git/                 # Git version control
├── .next/                # Build output (gitignored)
├── node_modules/         # Dependencies (gitignored)
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── src/                  # SOURCE CODE (THIS IS WHERE YOU WORK!)
└── [config files]        # Various configs
```

---

## Detailed Directory Breakdown

### `/prisma/` - Database Layer
```
prisma/
├── migrations/           # Database change history
│   └── 20251121042350_init/
├── schema.prisma        # Database structure (8 tables)
├── seed.ts              # Default data seeder
└── prisma.config.ts     # Prisma env config
```

**Key File: `schema.prisma` (156 lines)**

Defines 8 tables:
1. **User** - Groomer accounts (with Stripe fields)
2. **Account** - OAuth providers (NextAuth)
3. **Session** - User sessions (NextAuth)
4. **VerificationToken** - Email verification (NextAuth)
5. **Client** - Pet owners
6. **Pet** - Individual pets
7. **Appointment** - Scheduled grooming sessions
8. **Service** - Services offered (bath, haircut, etc.)
9. **Settings** - Business settings (hours, contact info)

---

### `/src/app/` - Pages & API Routes

#### Frontend Pages (React Server Components)
```
app/
├── page.tsx                    # Dashboard homepage
├── layout.tsx                  # Root layout (sidebar, nav)
├── login/
│   ├── page.tsx               # Login form
│   └── layout.tsx             # Auth layout wrapper
├── signup/
│   ├── page.tsx               # Signup form
│   └── layout.tsx             # Auth layout wrapper
├── clients/
│   ├── page.tsx               # Client list
│   ├── client-components.tsx  # Client list UI
│   └── [id]/
│       ├── page.tsx           # Single client detail
│       └── client-components.tsx
├── pets/
│   ├── page.tsx               # Pet list
│   ├── client-components.tsx  # Pet list UI
│   └── [id]/
│       ├── page.tsx           # Single pet detail
│       └── pet-detail-components.tsx
├── schedule/
│   ├── page.tsx               # Calendar view
│   └── client-components.tsx  # Calendar UI
├── settings/
│   ├── page.tsx               # Settings + subscription
│   └── client-components.tsx  # Settings UI
└── calendar-components.tsx    # Shared calendar widgets
```

#### Backend API Routes
```
app/api/
├── auth/
│   ├── [...nextauth]/
│   │   └── route.ts           # NextAuth handler
│   └── signup/
│       └── route.ts           # User registration
├── user/
│   ├── profile/route.ts       # Update profile
│   └── password/route.ts      # Change password
└── stripe/                     # 🆕 STRIPE INTEGRATION
    ├── checkout/route.ts       # Create payment session
    ├── portal/route.ts         # Billing portal
    └── webhook/route.ts        # Stripe event handler
```

#### Server Actions (Backend Logic)
```
app/actions/
├── appointments.ts            # Appointment CRUD
├── clients.ts                 # Client CRUD (with plan limits!)
├── pets.ts                    # Pet CRUD
├── services.ts                # Service CRUD
└── settings.ts                # Settings CRUD
```

---

### `/src/components/` - Reusable UI

```
components/
├── ui/                        # Shadcn UI components
│   ├── button.tsx            
│   ├── card.tsx              
│   ├── dialog.tsx            # Modals
│   ├── form.tsx              
│   ├── input.tsx             
│   ├── label.tsx             
│   ├── alert-dialog.tsx      
│   ├── command.tsx           
│   ├── dropdown-menu.tsx     
│   ├── navigation-menu.tsx   
│   ├── popover.tsx           
│   ├── searchable-select.tsx 
│   ├── separator.tsx         
│   ├── sheet.tsx             
│   ├── submit-button.tsx     
│   └── textarea.tsx          
├── sidebar.tsx                # App navigation
└── conditional-layout.tsx     # Layout wrapper
```

---

### `/src/lib/` - Utilities & Config

```
lib/
├── prisma.ts              # Database connection singleton
├── stripe.ts              # 🆕 Stripe config & helpers
└── utils.ts               # CSS utility (cn function)
```

**New File: `stripe.ts` (36 lines)**
- Stripe API initialization
- PLANS constant (Free vs Pro limits)
- Helper: `canAddClient(count, plan)`
- Helper: `getClientLimit(plan)`

---

### `/src/types/` - TypeScript Definitions

```
types/
└── next-auth.d.ts         # Extends NextAuth to include user.id
```

---

## File-by-File Breakdown

### Configuration Files

| File | Category | Purpose |
|------|----------|---------|
| `package.json` | Config | Dependencies (40 packages) |
| `tsconfig.json` | Config | TypeScript settings |
| `next.config.ts` | Config | Next.js config |
| `tailwind.config.js` | Config | TailwindCSS config |
| `components.json` | Config | Shadcn UI config |
| `prisma.config.ts` | Config | Prisma env vars |
| `.gitignore` | Config | Git ignore rules |
| `.env` | **SECRET** | **Environment variables (NEVER COMMIT!)** |
| `.env.example` | Config | Template for .env |

---

### Core Application Files

#### Authentication & Security

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `src/auth.ts` | Backend | 74 | NextAuth config, credential validation |
| `src/middleware.ts` | Backend | 46 | Route protection, redirects |
| `api/auth/[...nextauth]/route.ts` | Backend | 10 | NextAuth API handler |
| `api/auth/signup/route.ts` | Backend | 80 | User registration with bcrypt |

**Security Flow:**
1. `middleware.ts` runs on EVERY request
2. Checks for valid session cookie
3. Redirects to `/login` if not authenticated
4. `auth.ts` validates email/password via Prisma

---

#### Payment Processing (Stripe)

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `lib/stripe.ts` | Backend | 36 | Stripe config, plan definitions |
| `api/stripe/checkout/route.ts` | Backend | 80 | Create Stripe checkout session |
| `api/stripe/portal/route.ts` | Backend | 40 | Generate billing portal URL |
| `api/stripe/webhook/route.ts` | Backend | 150 | Handle Stripe events |

**Stripe Integration:**
- **Free Plan**: 10 clients max, $0/month
- **Pro Plan**: Unlimited clients, $10/month
- Client limit enforced in `actions/clients.ts:createClient()`
- Subscription status stored in `User` table
- Webhooks update subscription status in real-time

---

#### Database Operations (Server Actions)

| File | Type | Lines | What It Does |
|------|------|-------|--------------|
| `actions/clients.ts` | Backend | 250 | Create, read, update, delete clients (enforces plan limits) |
| `actions/pets.ts` | Backend | 200 | Manage pets linked to clients |
| `actions/appointments.ts` | Backend | 300 | Schedule appointments |
| `actions/services.ts` | Backend | 200 | Manage grooming services |
| `actions/settings.ts` | Backend | 150 | Update business settings |

**Pattern:**
```typescript
export async function createClient(formData: FormData) {
  const session = await auth(); // 1. Check auth
  const user = await prisma.user.findUnique({ ... }); // 2. Get user
  
  // 3. Check plan limits
  if (!canAddClient(user.clientCount, user.plan)) {
    throw new Error("Upgrade to Pro!");
  }
  
  // 4. Create client
  const client = await prisma.client.create({ ... });
  
  revalidatePath("/clients"); // 5. Refresh UI
  return client;
}
```

---

#### Frontend Pages

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `app/page.tsx` | Frontend | 200 | Dashboard with appointments |
| `app/layout.tsx` | Frontend | 80 | Root layout (sidebar) |
| `app/login/page.tsx` | Frontend | 150 | Login form |
| `app/signup/page.tsx` | Frontend | 200 | Registration form |
| `app/clients/page.tsx` | Frontend | 150 | Client list with pagination |
| `app/clients/[id]/page.tsx` | Frontend | 250 | Client detail + pets |
| `app/pets/page.tsx` | Frontend | 150 | Pet list with pagination |
| `app/pets/[id]/page.tsx` | Frontend | 300 | Pet detail + appointments |
| `app/schedule/page.tsx` | Frontend | 200 | Calendar view |
| `app/settings/page.tsx` | Frontend | 250 | Settings + subscription UI |

**Server vs Client Components:**
- `page.tsx` = Server Component (fetches data)
- `*-components.tsx` = Client Component (`"use client"`, interactive)

**Why Split?**
- Server: Fast, SEO-friendly, secure (direct DB access)
- Client: Interactive, stateful, dynamic (forms, buttons)

---

## Code Statistics

### By File Type

| Type | Count | Lines | Purpose |
|------|-------|-------|---------|
| `.tsx` | 35 | ~6,500 | React components |
| `.ts` | 20 | ~2,349 | Backend logic |
| `.json` | 5 | ~200 | Config files |
| `.md` | 6 | ~1,800 | Documentation |

### By Category

| Category | Files | Lines | % |
|----------|-------|-------|---|
| Frontend (UI) | 25 | 4,200 | 47% |
| Backend (API/Actions) | 18 | 3,000 | 34% |
| Database (Prisma) | 1 | 156 | 2% |
| Config | 10 | 350 | 4% |
| Documentation | 6 | 1,143 | 13% |

### Top 10 Largest Files

1. `src/app/pets/[id]/page.tsx` - 300 lines
2. `src/app/actions/appointments.ts` - 300 lines
3. `src/app/actions/clients.ts` - 250 lines
4. `src/app/clients/[id]/page.tsx` - 250 lines
5. `src/app/settings/page.tsx` - 250 lines
6. `src/app/actions/pets.ts` - 200 lines
7. `src/app/schedule/page.tsx` - 200 lines
8. `src/app/signup/page.tsx` - 200 lines
9. `src/app/api/stripe/webhook/route.ts` - 150 lines
10. `src/components/ui/form.tsx` - 200 lines

---

## Understanding the Architecture

### File Naming Patterns

| Pattern | Meaning | Example |
|---------|---------|---------|
| `page.tsx` | URL route | `clients/page.tsx` → `/clients` |
| `layout.tsx` | Wraps child pages | Adds sidebar to all pages |
| `[id]/` | Dynamic route | `/clients/123` → `[id]/page.tsx` |
| `*-components.tsx` | Client component | Interactive UI |
| `route.ts` | API endpoint | `api/*/route.ts` |
| `actions/*.ts` | Server action | Backend function |

### Request Flow Example

**Creating a New Client:**
1. User fills form → `client-components.tsx`
2. Form submits → `createClient()` server action
3. Action checks auth → `auth()`
4. Action checks plan limit → `canAddClient()`
5. Action creates client → `prisma.client.create()`
6. UI refreshes → `revalidatePath()`

---

## Key Takeaways for Beginners

### 1. Separation of Concerns
- **Frontend** (app/*.tsx): What users see
- **Backend** (actions/, api/): Business logic
- **Database** (prisma/): Data storage
- **Components** (components/): Reusable UI

### 2. The Database is Truth
- PostgreSQL stores everything
- Prisma schema defines structure
- Server actions modify data
- Frontend displays data

### 3. Security Layers
1. **Middleware**: Blocks unauthenticated requests
2. **Auth**: Validates credentials
3. **Server Actions**: Check permissions
4. **Env Variables**: Hide secrets

### 4. Modern React Patterns
- **Server Components**: Fetch data server-side
- **Client Components**: Interactive UI (`"use client"`)
- **Server Actions**: Call backend from frontend
- **App Router**: File-based routing

### 5. Subscription Model
- Free tier: 10 clients max
- Pro tier: Unlimited clients, $10/month
- Stripe handles billing
- Client limit enforced in `createClient()`

---

## Next Steps

1. **Trace one feature end-to-end**:
   - "Create Client" from form → database → UI

2. **Understand the database**:
   - Read `prisma/schema.prisma`
   - See how tables relate

3. **Make a small change**:
   - Change button color in `button.tsx`
   - Add field to client form

4. **Read the docs**:
   - Next.js: https://nextjs.org/docs
   - Prisma: https://prisma.io/docs
   - Stripe: https://stripe.com/docs

---

**Remember:** Every expert was once a beginner. Don't try to understand everything at once. Pick ONE piece, understand it deeply, then move to the next. 

Questions to explore:
- What happens when you click "Upgrade to Pro"?
- Where is password hashing done?
- How does the calendar fetch appointments?
- What prevents users from seeing others' data?

Good luck! 🚀
