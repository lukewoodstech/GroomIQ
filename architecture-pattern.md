# Architecture Pattern Analysis - GroomIQ

## 1. What Architectural Pattern Does GroomIQ Use?

GroomIQ uses a **Modern Full-Stack Monolith** architecture with characteristics of both **Client-Server** and **Serverless** patterns, built on Next.js 16 App Router.

Let's break this down in simple terms:

### Primary Pattern: Full-Stack Monolith

**What it means:** Your entire application (frontend + backend + database logic) lives in one codebase and deploys as a single unit.

**Traditional Monolith Problems:**
- Hard to scale parts independently
- One bug can crash everything
- Difficult to maintain as it grows

**Why GroomIQ's Monolith is Different (Modern):**
- Next.js splits code into routes and components automatically
- Each page can load independently
- Server Actions run separately from UI
- Deploys to serverless functions (Vercel automatically does this)
- Edge middleware runs globally distributed

**Visual:**
```
Traditional Monolith:          GroomIQ Monolith (Next.js):
┌─────────────────┐           ┌──────────────────────┐
│   One Big App   │           │   Next.js App        │
│                 │           │  ┌────────────────┐  │
│  - Frontend     │           │  │ Page Chunks    │  │
│  - Backend      │           │  ├────────────────┤  │
│  - Database     │           │  │ API Routes     │  │
│  - Everything!  │           │  ├────────────────┤  │
│                 │           │  │ Server Actions │  │
└─────────────────┘           │  └────────────────┘  │
One server runs it all        └──────────────────────┘
                               Each part can scale independently
```

---

### Secondary Pattern: Client-Server Architecture

**What it means:** Clear separation between what runs in the browser (client) and what runs on the server.

**Client Side (Browser):**
- React components (UI rendering)
- Form interactions
- Client-side validation
- Navigation/routing
- State management (React hooks)

**Server Side:**
- Authentication (NextAuth.js)
- Database queries (Prisma)
- Business logic (Server Actions)
- Data validation (Zod)
- Payment processing (Stripe)

**Communication:** Server Actions (built into Next.js) - like having a direct phone line between client and server.

**Example:**
```typescript
// CLIENT SIDE (Browser) - /src/app/clients/page.tsx
function ClientsPage() {
  async function handleSubmit(data) {
    await createClient(data);  // Calls server
  }

  return <form onSubmit={handleSubmit}>...</form>
}

// SERVER SIDE (Next.js Server) - /src/app/actions/clients.ts
"use server"
export async function createClient(data) {
  const session = await auth();  // Check authentication
  await prisma.client.create({ data });  // Save to database
}
```

---

### Tertiary Pattern: Serverless-Ready

**What it means:** The code is structured to run on serverless platforms (like Vercel).

**Traditional Server:**
```
One computer runs 24/7 waiting for requests
Costs money even when no one is using it
You manage scaling, security, updates
```

**Serverless (What Vercel Does):**
```
Functions spin up only when needed
Pay only for actual usage
Automatically scales up/down
No server management
```

**GroomIQ is Serverless-Ready Because:**
- Each Server Action can run independently
- Each API route is a separate function
- Prisma manages database connections efficiently
- No long-running background processes
- JWT sessions (no server-side session storage)

---

## 2. How is the Code Organized?

GroomIQ follows **Next.js App Router Convention** with a mix of **Feature-Based** and **Layer-Based** organization.

### Organization Strategy Breakdown

#### Layer-Based Separation
Code is separated by technical responsibility:

```
/src
├── app/           → Presentation Layer (UI + Routing)
│   ├── page.tsx            → Home/calendar page
│   ├── layout.tsx          → Root layout
│   ├── clients/            → Client management pages
│   ├── pets/               → Pet management pages
│   ├── schedule/           → Schedule page
│   ├── settings/           → Settings page
│   ├── login/              → Login page
│   ├── signup/             → Signup page
│   ├── actions/            → Server Actions (business logic)
│   └── api/                → API routes (auth, Stripe)
├── components/    → UI Component Library
│   ├── ui/                 → Reusable primitives (button, dialog, etc)
│   ├── sidebar.tsx         → Navigation sidebar
│   └── conditional-layout.tsx → Layout wrapper
├── lib/           → Utility/Infrastructure Layer
│   ├── prisma.ts           → Database client
│   ├── stripe.ts           → Stripe client + plan config
│   └── utils.ts            → Utility functions
└── auth.ts        → Authentication configuration
```

**Think of it like a burger:**
- **Top Bun** (`/app` pages) - What users see
- **Patty** (`/app/actions`) - The meat of your logic
- **Cheese** (`/components`) - Flavor throughout
- **Bottom Bun** (`/lib`) - Foundation utilities

---

#### Feature-Based Grouping
Within `/app`, code is organized by feature:

```
/app
├── clients/        → Everything related to client management
│   ├── page.tsx         → List clients
│   └── [id]/page.tsx    → View/edit single client
├── pets/           → Everything related to pet management
│   ├── page.tsx         → List pets
│   └── [id]/page.tsx    → View/edit single pet
├── schedule/       → Appointment scheduling
│   └── page.tsx         → Calendar view
├── settings/       → Business configuration
│   └── page.tsx         → Settings page
├── login/          → Authentication
├── signup/         → Registration
└── actions/        → Server Actions (grouped by feature)
    ├── clients.ts       → Client CRUD operations
    ├── pets.ts          → Pet CRUD operations
    ├── appointments.ts  → Appointment CRUD operations
    ├── services.ts      → Service management
    └── settings.ts      → Settings management
```

**Benefit:** If you need to work on "clients", all related code is in one place.

---

### Comparison to Common Patterns

| Pattern | What GroomIQ Uses | Why |
|---------|-------------------|-----|
| **MVC (Model-View-Controller)** | Similar, but adapted | Models = Prisma schemas, Views = React components, Controllers = Server Actions |
| **Three-Tier Architecture** | Yes | Presentation (React) → Logic (Server Actions) → Data (Prisma + PostgreSQL) |
| **Domain-Driven Design** | Partially | Features grouped by domain (Clients, Pets, Appointments) |
| **Microservices** | No | Everything in one codebase (but could be split later) |
| **JAMstack** | Partially | JavaScript + APIs + Markup, but with server-side rendering |

---

## 3. Main Components/Modules and Their Interactions

### Core Modules

#### Module 1: Authentication Module
**Location:** `/src/auth.ts`, `/src/middleware.ts`, `/src/app/api/auth/`

**Responsibilities:**
- User login/logout
- Session management (JWT)
- Password hashing (bcrypt)
- Route protection (middleware)

**Interactions:**
```
┌─────────────┐     checks     ┌──────────────┐
│ Middleware  │ ───────────────→│  auth.ts     │
└─────────────┘                 └──────────────┘
                                        ↓
                                  validates with
                                        ↓
                                ┌──────────────┐
                                │  Database    │
                                │  (Users)     │
                                └──────────────┘
```

**Files:**
- `/src/auth.ts` - NextAuth configuration
- `/src/middleware.ts` - Route protection
- `/src/app/api/auth/[...nextauth]/route.ts` - Auth API endpoint
- `/src/app/api/auth/signup/route.ts` - User registration

---

#### Module 2: Client Management Module
**Location:** `/src/app/clients/`, `/src/app/actions/clients.ts`

**Responsibilities:**
- Display client list with pagination
- Create new clients
- Edit client details
- Delete clients (with cascading appointment deletion)
- **Enforce client limits based on subscription plan**

**Interactions:**
```
┌─────────────────────┐
│  ClientsPage (UI)   │
└─────────────────────┘
          ↓ calls
┌─────────────────────┐
│  createClient()     │ ─────→ Validates with Zod
│  getClients()       │ ─────→ Checks authentication
│  updateClient()     │ ─────→ Checks client limit (Stripe)
│  deleteClient()     │ ─────→ Queries database
└─────────────────────┘
          ↓
┌─────────────────────┐
│  Prisma             │
└─────────────────────┘
          ↓
┌─────────────────────┐
│  PostgreSQL         │
│  Clients table      │
└─────────────────────┘
```

**Stripe Integration:**
- Before creating client, checks user's plan and client count
- Free plan: max 10 clients
- Pro plan: unlimited clients
- Shows upgrade prompt if limit reached

---

#### Module 3: Pet Management Module
**Location:** `/src/app/pets/`, `/src/app/actions/pets.ts`

**Similar structure to Client Management, plus:**
- Links pets to clients (relationship)
- Displays pet details with owner info
- Cascading deletes (client deleted → pets deleted)

---

#### Module 4: Appointment Scheduling Module
**Location:** `/src/app/`, `/src/app/schedule/`, `/src/app/actions/appointments.ts`

**Special Features:**
- Conflict detection (prevents double-booking)
- Time slot validation
- Pet and client relationship tracking
- Status management (scheduled, completed, cancelled)

**Complex Interaction:**
```
User schedules appointment
         ↓
checkAppointmentConflict() ──→ Queries existing appointments
         ↓                      in time range
    No conflict?
         ↓
createAppointment() ────────→ Saves to database
         ↓
Appointment linked to:
  - Pet (who's being groomed)
  - Client (who's paying)
  - User (which groomer)
```

---

#### Module 5: Service Management Module
**Location:** `/src/app/settings/`, `/src/app/actions/services.ts`

**Responsibilities:**
- Define service offerings (per groomer)
- Set duration and pricing
- Enable/disable services
- Order services for display
- Default services created on signup

**Default Services:**
1. Bath & Brush - $45, 60min
2. Full Groom - $85, 120min
3. Haircut - $65, 90min
4. Nail Trim - $15, 15min
5. Ear Cleaning - $10, 10min
6. De-shedding Treatment - $40, 45min

---

#### Module 6: Settings Module
**Location:** `/src/app/settings/`, `/src/app/actions/settings.ts`

**Responsibilities:**
- Business information (name, email, phone)
- Operating hours (open time, close time)
- Days of operation
- Default appointment settings
- **Subscription management (Stripe integration)**

---

#### Module 7: Subscription/Payment Module
**Location:** `/src/app/api/stripe/`, `/src/lib/stripe.ts`

**Responsibilities:**
- Stripe checkout session creation
- Webhook processing (subscription events)
- Billing portal access
- Plan limit enforcement

**Flow:**
```
User clicks "Upgrade to Pro"
         ↓
/api/stripe/checkout → Creates Stripe session
         ↓
User completes payment on Stripe
         ↓
Stripe webhook → /api/stripe/webhook
         ↓
Updates user plan in database
         ↓
Client limit changes: 10 → Unlimited
```

---

#### Module 8: UI Component Library
**Location:** `/src/components/ui/`

**Responsibilities:**
- Reusable UI primitives (built on Radix UI)
- Consistent styling (Tailwind CSS)
- Accessibility features

**Components Used Everywhere:**
- Button, Input, Label
- Dialog, Dropdown, Popover
- Form controls
- Alert dialogs

**Design System:**
- Based on shadcn/ui component library
- Customizable via Tailwind classes
- Accessible by default (keyboard navigation, screen readers)

---

## 4. Responsibility Distribution

### Who Handles What?

| Responsibility | Location | Files |
|----------------|----------|-------|
| **UI Rendering** | Frontend | `/src/app/**/page.tsx`, `/src/components/**/*.tsx` |
| **User Input** | Frontend | Form components with React Hook Form |
| **Client-Side Validation** | Frontend | Zod schemas in forms |
| **Routing** | Frontend | Next.js App Router (file-system based) |
| **Authentication** | Backend | `/src/auth.ts`, `/src/middleware.ts` |
| **Authorization** | Backend | Server Actions (check userId) |
| **Business Logic** | Backend | `/src/app/actions/*.ts` |
| **Data Validation** | Backend | Zod schemas in Server Actions |
| **Database Access** | Backend | Prisma Client in Server Actions |
| **Data Persistence** | Database | PostgreSQL via Prisma |
| **Session Management** | Backend | NextAuth.js (JWT tokens) |
| **Payment Processing** | Backend | Stripe API via `/src/app/api/stripe/` |
| **Subscription Management** | Backend | Stripe webhooks + database updates |

---

### Example: Creating a Client (Full Stack)

```
┌──────────────────────────────────────────────────────┐
│ FRONTEND                                             │
│  - ClientForm component (UI)                         │
│  - React Hook Form (form state)                      │
│  - Zod validation (client-side, quick feedback)      │
│  - Calls createClient() Server Action                │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ BACKEND (Server Action)                              │
│  - Authenticates user                                │
│  - Checks client limit (Stripe plan)                 │
│  - Validates data again (security)                   │
│  - Checks for duplicates                             │
│  - Calls Prisma to save                              │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ DATA LAYER (Prisma)                                  │
│  - Translates to SQL                                 │
│  - Manages database connection                       │
│  - Returns typed JavaScript objects                  │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ DATABASE (PostgreSQL)                                │
│  - Stores data persistently                          │
│  - Enforces constraints (unique email, etc.)         │
│  - Returns confirmation                              │
└──────────────────────────────────────────────────────┘
```

---

## 5. Architectural Anti-Patterns & Code Smells

### What GroomIQ is Doing RIGHT ✅

1. **Separation of Concerns**
   - UI components don't directly access the database
   - Server Actions handle business logic
   - Prisma abstracts database queries
   - Clear boundaries between layers

2. **Authentication on Every Request**
   - Middleware checks auth before page loads
   - Server Actions verify userId
   - No unauthorized data access possible
   - JWT-based sessions for performance

3. **Type Safety**
   - TypeScript catches errors at compile-time
   - Zod validates data at runtime
   - Prisma provides typed database queries
   - No "any" types scattered around

4. **Data Isolation**
   - Every query filters by userId
   - Users can never see each other's data
   - Secure multi-tenancy
   - Foreign key constraints enforced

5. **Security Best Practices**
   - Passwords hashed with bcrypt
   - Stripe webhook signature verification
   - SQL injection prevented (Prisma ORM)
   - CSRF protection (NextAuth built-in)
   - Environment variables for secrets

6. **Monetization Built-In**
   - Subscription limits enforced server-side
   - Real-time plan checking
   - Clear upgrade path
   - Stripe webhooks handle plan changes

---

### Minor Areas for Improvement 🟡

#### 1. **Code Duplication in Forms**

**Current State:**
Form components are sometimes embedded directly in page files.

**Better Approach:**
Extract forms into separate components:
```
/src/components/forms/
  ├── client-form.tsx
  ├── pet-form.tsx
  └── appointment-form.tsx
```

**Why:** Easier to test, reuse, and maintain.

---

#### 2. **Server Actions Co-Located with Pages**

**Current State:**
All Server Actions in `/src/app/actions/*.ts`

**Alternative Approach (for larger apps):**
```
/src/features/
  ├── clients/
  │   ├── components/
  │   ├── actions.ts
  │   └── types.ts
  ├── pets/
  └── appointments/
```

**Why:** Groups all feature code together. Better for large teams.

**Current approach is fine for this app size!**

---

#### 3. **Limited Error Boundary Components**

**Current State:**
Errors bubble up and can crash the page.

**Better Approach:**
Add `/app/error.tsx` and `/app/clients/error.tsx` to catch errors gracefully.

**Example:**
```typescript
// /src/app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

**Why:** Better user experience when things go wrong.

---

#### 4. **Caching Strategy Could Be More Granular**

**Current State:**
`revalidatePath()` invalidates entire sections.

**Better Approach:**
Use Next.js `revalidateTag()` for granular cache control.

**Example:**
```typescript
// Tag data
fetch('/api/clients', { next: { tags: ['clients'] } })

// Revalidate specific tag
revalidateTag('clients')
```

**Why:** Faster page loads, less database queries.

---

#### 5. **No Loading States for Server Actions**

**Current State:**
Forms disable during submission but could show more feedback.

**Better Approach:**
Use React's `useFormStatus` hook for loading states.

**Example:**
```typescript
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending}>
      {pending ? 'Creating...' : 'Create Client'}
    </button>
  )
}
```

**Why:** Better user experience during async operations.

---

### No Major Anti-Patterns! 🎉

GroomIQ's architecture is clean and follows Next.js best practices. The suggested improvements are optimizations, not critical issues. The codebase demonstrates:

- ✅ Proper separation of concerns
- ✅ Security-first approach
- ✅ Type safety throughout
- ✅ Scalable folder structure
- ✅ Efficient data fetching
- ✅ Modern React patterns
- ✅ Proper authentication/authorization
- ✅ Payment integration done right

---

## Summary: GroomIQ's Architecture in Plain English

**Imagine the app as a restaurant:**

1. **Monolith Architecture** = Everything happens in one building
   - Not a food truck (microservices)
   - Not a franchise with locations everywhere (distributed systems)
   - One central kitchen serving multiple dining rooms

2. **Client-Server Pattern** = Clear division of labor
   - Dining room (frontend) = Where customers interact
   - Kitchen (backend) = Where food is prepared
   - Waiters (Server Actions) = Carry orders and food back and forth

3. **Layer-Based Organization** = Vertical separation
   - Floor 1: Customer-facing (UI components)
   - Floor 2: Kitchen (business logic)
   - Floor 3: Storage (database)

4. **Feature-Based Grouping** = Horizontal separation
   - Section 1: Client management
   - Section 2: Pet management
   - Section 3: Scheduling
   - Section 4: Payments (Stripe)

5. **Responsibilities:**
   - UI handles presentation
   - Server Actions handle processing
   - Prisma handles data storage
   - NextAuth handles security
   - Stripe handles payments

**Result:** A well-organized, maintainable application that can scale as the business grows. The architecture supports both free and paid users with proper limit enforcement, making it a viable SaaS product.

### Technology Stack Summary

**Frontend:**
- React 19 (UI library)
- Next.js 16 (framework)
- Tailwind CSS (styling)
- Radix UI (accessible components)
- React Hook Form (forms)
- Zod (validation)

**Backend:**
- Next.js Server Actions (business logic)
- NextAuth.js (authentication)
- Prisma (ORM)
- Stripe (payments)
- bcrypt.js (password hashing)

**Infrastructure:**
- PostgreSQL (database)
- Vercel (hosting, recommended)
- Stripe (payment processing)

**Why This Stack:**
- Fast development (Next.js all-in-one)
- Type-safe end-to-end (TypeScript + Prisma)
- Scalable (serverless architecture)
- Secure (built-in best practices)
- Cost-effective (pay only for usage)
- Modern (latest React patterns)
