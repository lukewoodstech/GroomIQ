# Data Flow Analysis for GroomIQ

This document traces the complete data flows through the GroomIQ application, showing how data moves from user interactions through the system to the database and back.

## Table of Contents
1. [Initial App Load Flow](#initial-app-load-flow)
2. [User Authentication Flow](#user-authentication-flow)
3. [Creating a Client Flow](#creating-a-client-flow)
4. [Stripe Payment Processing Flow](#stripe-payment-processing-flow)
5. [Database Schema Overview](#database-schema-overview)

---

## Initial App Load Flow

**What happens when a user first loads the app:**

### Step 1: Request Reaches Middleware
**File:** `/src/middleware.ts`

When any page is requested, Next.js first executes the middleware:
- Checks if user has a session token in cookies (`authjs.session-token` or `__Secure-authjs.session-token`)
- Determines if the requested path is a public route (login/signup) or protected route
- Makes routing decision based on authentication status

**Decision Tree:**
```
Is user authenticated?
├─ YES
│  └─ Trying to access login/signup?
│     ├─ YES → Redirect to home page "/"
│     └─ NO → Allow request to continue
└─ NO
   └─ Trying to access protected route?
      ├─ YES → Redirect to "/login?callbackUrl={original-path}"
      └─ NO → Allow request to continue (auth pages)
```

### Step 2: Page Component Loads
**File:** `/src/app/page.tsx` (if authenticated)

For the home page (calendar/schedule view):
1. Server component executes three parallel data fetches:
   - `getAppointments()` - fetches all user's appointments from database
   - `getPets()` - fetches all user's pets from database
   - `getActiveServices()` - fetches all user's active services from database

2. Each function:
   - Calls `auth()` from `/src/auth.ts` to get current user session
   - If no session, returns empty data
   - If session exists, queries PostgreSQL via Prisma with user ID filter

3. Data is passed to `CalendarPageContent` client component for rendering

### Step 3: Layout Renders
**File:** `/src/app/layout.tsx` → `/src/components/conditional-layout.tsx`

1. Root layout wraps everything in HTML structure with Inter font
2. `ConditionalLayout` component checks current pathname:
   - If on `/login` or `/signup`: renders children directly (no sidebar)
   - If on any other page: renders `Sidebar` + children in a flex layout

3. Toaster component (from Sonner library) is added for notifications

### Step 4: Session Verification
**File:** `/src/auth.ts`

The `auth()` function:
1. Retrieves JWT from session cookie
2. Decodes JWT to extract user ID
3. Returns session object with user information
4. No database query needed (JWT-based sessions for performance)

**Complete Flow Diagram:**
```
User enters URL
    ↓
middleware.ts checks cookie
    ↓
Has session token? → NO → Redirect to /login
    ↓ YES
page.tsx Server Component
    ↓
Parallel Data Fetches:
├─ getAppointments() → Prisma → PostgreSQL
├─ getPets() → Prisma → PostgreSQL
└─ getActiveServices() → Prisma → PostgreSQL
    ↓
Data returned to page
    ↓
CalendarPageContent renders with data
    ↓
ConditionalLayout adds Sidebar
    ↓
Browser displays complete page
```

---

## User Authentication Flow

### Sign Up Flow

**Files involved:**
- `/src/app/signup/page.tsx` (UI)
- `/src/app/api/auth/signup/route.ts` (API)
- `/src/auth.ts` (NextAuth config)

**Step-by-step process:**

1. **User fills form** (`/src/app/signup/page.tsx`)
   - Name, email, password, confirm password
   - Client-side validation: passwords match, minimum 8 characters

2. **Form submission** (Client → Server)
   - POST request to `/api/auth/signup`
   - Body: `{ name, email, password }`

3. **Server processes signup** (`/src/app/api/auth/signup/route.ts`)
   ```
   Receive POST request
       ↓
   Validate with Zod schema (email format, password length)
       ↓
   Check if email already exists in database
       ↓
   Hash password with bcrypt (10 salt rounds)
       ↓
   Create user in database with default values:
       - plan: "free"
       - subscriptionStatus: "free"
       - stripeCustomerId: null
       - stripeSubscriptionId: null
       ↓
   Create default settings record for user
       ↓
   Create 6 default services for user:
       - Bath & Brush ($45, 60min)
       - Full Groom ($85, 120min)
       - Haircut ($65, 90min)
       - Nail Trim ($15, 15min)
       - Ear Cleaning ($10, 10min)
       - De-shedding Treatment ($40, 45min)
       ↓
   Return success response
   ```

4. **Auto-login after signup**
   - Client calls `signIn("credentials", { email, password, redirect: false })`
   - Triggers NextAuth credential provider

5. **NextAuth processes login** (`/src/auth.ts`)
   ```
   Validate credentials with Zod
       ↓
   Query database for user by email
       ↓
   Compare password with bcrypt
       ↓
   If match: Generate JWT token
       ↓
   Set session cookie
       ↓
   Return user object
   ```

6. **Redirect to home**
   - Router pushes to `/`
   - Middleware sees session token, allows access
   - User starts on FREE plan with 10 client limit

### Login Flow

**Files involved:**
- `/src/app/login/page.tsx` (UI)
- `/src/auth.ts` (NextAuth config)

**Step-by-step process:**

1. **User submits credentials**
   - Email and password entered

2. **Call NextAuth signIn**
   - `signIn("credentials", { email, password, redirect: false })`

3. **Credentials Provider authorize function** (`/src/auth.ts`)
   ```
   Validate input with Zod
       ↓
   Find user in database by email
       ↓
   Check if user exists and has password
       ↓
   Compare passwords with bcrypt
       ↓
   If valid: return user object { id, email, name }
   If invalid: return null
   ```

4. **JWT callback** (`/src/auth.ts`)
   - Adds user ID to JWT token
   - Token stored in cookie

5. **Session callback** (`/src/auth.ts`)
   - Extracts user ID from JWT
   - Adds to session object

6. **Success**
   - Session cookie set
   - User redirected to home or callback URL

### Middleware Authentication Check

**File:** `/src/middleware.ts`

On every request:
```
Extract cookies from request
    ↓
Look for session token:
    - authjs.session-token (development)
    - __Secure-authjs.session-token (production/HTTPS)
    ↓
Token exists?
├─ YES → User is authenticated
└─ NO → User is not authenticated
    ↓
Apply routing rules based on path and auth status
```

**Why this approach:**
- JWT tokens = No database lookup on every request (fast!)
- Middleware runs on Edge runtime (super fast, globally distributed)
- Session validated only when needed in Server Actions

---

## Creating a Client Flow

**What happens when user clicks "Add Client" and submits the form:**

### Complete Flow Diagram

```
User clicks "Add Client" button
    ↓
Modal/Dialog opens with form (Client Component)
    ↓
User fills in:
    - First Name (required)
    - Last Name (required)
    - Email (optional)
    - Phone (optional)
    ↓
User clicks "Save"
    ↓
Form data → FormData object
    ↓
Call createClient(formData) Server Action
    ↓
═══════════════════════════════════════════
SERVER ACTION: /src/app/actions/clients.ts
═══════════════════════════════════════════
    ↓
Step 1: Authentication
    - Call auth() to get session
    - Extract userId from session
    - If no session → throw "Unauthorized" error
    ↓
Step 2: Check Client Limit (STRIPE INTEGRATION)
    - Query database for user's plan and client count
    - Get current client count: user._count.clients
    - Get plan limit from /src/lib/stripe.ts:
      * Free plan: 10 clients max
      * Pro plan: Unlimited (Infinity)
    - Check if canAddClient(currentCount, userPlan)
    - If limit reached → throw error:
      "You've reached the limit of 10 clients on the Free plan.
       Upgrade to Pro for unlimited clients."
    ↓
Step 3: Validate Input
    - Parse FormData with Zod schema:
      * firstName: 1-100 chars
      * lastName: 1-100 chars
      * email: valid email or empty → null
      * phone: valid phone pattern or empty → null
    - If validation fails → throw Zod error
    ↓
Step 4: Check for Duplicates
    - If email or phone provided:
      * Query database for existing client with same email OR phone
      * Scoped to current user's clients only
    - If duplicate found → throw specific error message
    ↓
Step 5: Create Client
    - Insert into PostgreSQL via Prisma:
      prisma.client.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          userId
        }
      })
    - Database assigns:
      * id: auto-generated CUID
      * createdAt: current timestamp
      * updatedAt: current timestamp
    ↓
Step 6: Revalidate Cache
    - Call revalidatePath("/clients", "layout")
    - Next.js invalidates all cached client pages
    - Forces fresh data fetch on next render
    ↓
Step 7: Return Success
    - Return { success: true }
    ↓
═══════════════════════════════════════════
BACK TO CLIENT COMPONENT
═══════════════════════════════════════════
    ↓
Success response received
    ↓
Close modal/dialog
    ↓
Show success toast notification (Sonner)
    ↓
UI automatically updates (revalidation triggered)
    ↓
New client appears in list
```

### Database Transaction Details

**What gets stored in PostgreSQL:**

Table: `clients`
```sql
INSERT INTO clients (
    id,              -- "cljn8..." (CUID - collision-resistant unique ID)
    firstName,       -- "John"
    lastName,        -- "Smith"
    email,           -- "john@example.com" or NULL
    phone,           -- "555-1234" or NULL
    userId,          -- "clk9..." (references users table)
    createdAt,       -- "2025-12-03T10:30:00.000Z"
    updatedAt        -- "2025-12-03T10:30:00.000Z"
) VALUES (...);
```

**Why each field exists:**
- `id`: Unique identifier, used in URLs and relationships
- `firstName/lastName`: Required for display and search
- `email/phone`: Optional contact info, validated for duplicates
- `userId`: Links client to specific user (data isolation)
- `createdAt/updatedAt`: Audit trail, sorting by date added

### Error Handling

The flow includes multiple validation points:

1. **Client-side validation** (UI component)
   - Empty required fields
   - Form constraints

2. **Server-side validation** (Server Action)
   - Zod schema validation
   - **Client limit check (Free: 10 max, Pro: unlimited)**
   - Duplicate email/phone check
   - User ownership verification

3. **Database constraints**
   - Foreign key: userId must exist in users table
   - Unique constraints enforced at DB level
   - Cascade deletes: if user deleted, their clients are too

**If error occurs:**
```
Error thrown in Server Action
    ↓
Caught by try/catch
    ↓
Error message returned to client
    ↓
Toast notification shows error
    ↓
Form stays open with data intact
    ↓
User can correct and retry
```

---

## Stripe Payment Processing Flow

GroomIQ uses Stripe for subscription management with two plans:
- **Free Plan:** 10 clients max, $0/month
- **Pro Plan:** Unlimited clients, $10/month

### Subscription Checkout Flow

**Files involved:**
- `/src/app/settings/page.tsx` (UI trigger)
- `/src/app/api/stripe/checkout/route.ts` (Creates checkout session)
- `/src/lib/stripe.ts` (Stripe client and plan config)

**Step-by-step process:**

```
User clicks "Upgrade to Pro" button in Settings
    ↓
Client sends POST to /api/stripe/checkout
    ↓
═══════════════════════════════════════════════════
CHECKOUT API: /src/app/api/stripe/checkout/route.ts
═══════════════════════════════════════════════════
    ↓
Step 1: Verify Authentication
    - Call auth() to get session
    - Extract user ID
    - If not authenticated → return 401 Unauthorized
    ↓
Step 2: Get User Data
    - Query database for user by ID
    - Check if user already has stripeSubscriptionId
    ↓
Step 3: Handle Existing Subscription
    - If user already subscribed:
      * Create Stripe billing portal session instead
      * Return billing portal URL
      * User redirected to manage subscription
    ↓
Step 4: Create/Get Stripe Customer
    - Check if user has stripeCustomerId
    - If NO:
      * Call stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id }
        })
      * Update user record with stripeCustomerId
    - If YES: use existing customer ID
    ↓
Step 5: Create Checkout Session
    - Call stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{
          price: PLANS.PRO.priceId,  // From env: STRIPE_PRO_PRICE_ID
          quantity: 1
        }],
        success_url: "/settings?success=true",
        cancel_url: "/settings?canceled=true",
        metadata: { userId: user.id }
      })
    ↓
Step 6: Return Checkout URL
    - Return { url: checkoutSession.url }
    ↓
═══════════════════════════════════════════════════
BACK TO CLIENT
═══════════════════════════════════════════════════
    ↓
Client receives checkout URL
    ↓
Browser redirects to Stripe Checkout page
    ↓
User enters payment information on Stripe's secure page
    ↓
User completes payment
    ↓
Stripe redirects back to /settings?success=true
    ↓
Stripe sends webhook to server (parallel process)
```

### Webhook Processing Flow

**File:** `/src/app/api/stripe/webhook/route.ts`

**What happens when Stripe sends a webhook:**

```
Stripe sends POST to /api/stripe/webhook
    ↓
Request contains:
    - Event data (subscription info)
    - Stripe signature header
    ↓
═══════════════════════════════════════════════
WEBHOOK API: /src/app/api/stripe/webhook/route.ts
═══════════════════════════════════════════════
    ↓
Step 1: Verify Signature
    - Extract stripe-signature header
    - Call stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    - If signature invalid → return 400 Bad Request
    - This ensures webhook is from Stripe, not an attacker
    ↓
Step 2: Process Event by Type
    ↓
┌─────────────────────────────────────────────────┐
│ EVENT: checkout.session.completed               │
│ (User just completed payment)                   │
├─────────────────────────────────────────────────┤
│ Extract from session:                           │
│   - userId from metadata                        │
│   - customer (Stripe customer ID)               │
│   - subscription (Stripe subscription ID)       │
│     ↓                                            │
│ Update database:                                │
│   prisma.user.update({                          │
│     where: { id: userId },                      │
│     data: {                                     │
│       stripeCustomerId: session.customer,       │
│       stripeSubscriptionId: session.subscription│
│       subscriptionStatus: "active",             │
│       plan: "pro"                               │
│     }                                           │
│   })                                            │
│     ↓                                            │
│ User now has Pro plan access!                   │
│ Can create unlimited clients!                   │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│ EVENT: customer.subscription.updated            │
│ (Subscription status changed)                   │
├─────────────────────────────────────────────────┤
│ Extract from subscription:                      │
│   - status (active, past_due, canceled, etc)    │
│   - customer (Stripe customer ID)               │
│     ↓                                            │
│ Find user by stripeCustomerId                   │
│     ↓                                            │
│ Update database:                                │
│   - subscriptionStatus = subscription.status    │
│   - plan = "pro" if active, "free" if not       │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│ EVENT: customer.subscription.deleted            │
│ (User canceled subscription)                    │
├─────────────────────────────────────────────────┤
│ Find user by stripeCustomerId                   │
│     ↓                                            │
│ Update database:                                │
│   - subscriptionStatus = "canceled"             │
│   - plan = "free"                               │
│   - stripeSubscriptionId = null                 │
│     ↓                                            │
│ User downgraded to Free plan                    │
│ Client limit reduced to 10                      │
│ Existing clients NOT deleted                    │
│ Can't add new clients if over 10                │
└─────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────┐
│ EVENT: invoice.payment_failed                   │
│ (Payment method declined)                       │
├─────────────────────────────────────────────────┤
│ Find user by stripeCustomerId                   │
│     ↓                                            │
│ Update database:                                │
│   - subscriptionStatus = "past_due"             │
│ (User keeps Pro access temporarily,             │
│  but should update payment)                     │
└─────────────────────────────────────────────────┘
    ↓
Return { received: true } to Stripe
    ↓
Stripe marks webhook as successful
```

### Client Limit Enforcement

**Files involved:**
- `/src/lib/stripe.ts` (Plan definitions)
- `/src/app/actions/clients.ts` (Enforcement in createClient)

**How limits are enforced:**

```
PLAN DEFINITIONS (/src/lib/stripe.ts):

export const PLANS = {
  FREE: {
    name: "Free",
    clientLimit: 10,
    price: 0
  },
  PRO: {
    name: "Pro",
    clientLimit: Infinity,
    price: 10,
    priceId: process.env.STRIPE_PRO_PRICE_ID
  }
} as const;
```

**When user tries to create client:**

```
createClient() Server Action starts
    ↓
Query user with client count:
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        _count: { select: { clients: true } }
      }
    })
    ↓
Extract values:
    - currentClientCount = user._count.clients (e.g., 10)
    - userPlan = user.plan (e.g., "free")
    ↓
Get limit:
    const clientLimit = getClientLimit(userPlan)
    // Returns 10 for "free", Infinity for "pro"
    ↓
Check if can add:
    if (!canAddClient(currentClientCount, userPlan)) {
      throw new Error(
        "You've reached the limit of 10 clients on the Free plan.
         Upgrade to Pro for unlimited clients."
      )
    }
    ↓
If check passes, proceed with creating client
```

**Why this approach:**
- Real-time enforcement (can't bypass)
- Database-backed (accurate count)
- Clear upgrade path (error message includes upsell)

### Billing Portal Flow

**File:** `/src/app/api/stripe/portal/route.ts`

**When user clicks "Manage Subscription":**

```
POST to /api/stripe/portal
    ↓
Verify user is authenticated
    ↓
Get user's stripeCustomerId
    ↓
Create Stripe billing portal session:
    stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: "/settings"
    })
    ↓
Return portal URL
    ↓
User redirected to Stripe portal
    ↓
User can:
    - Update payment method
    - View invoices
    - Cancel subscription
    - Download receipts
    ↓
When done, redirected back to /settings
```

### Subscription Status Flow

**How subscription status affects the app:**

```
User loads any page requiring client count check
    ↓
Server component/action gets user data
    ↓
User record includes:
    {
      plan: "free" | "pro",
      subscriptionStatus: "free" | "active" | "past_due" | "canceled" | "trialing",
      stripeCustomerId: "cus_...",
      stripeSubscriptionId: "sub_..."
    }
    ↓
Status determines:
    - Client limit (10 vs Unlimited)
    - UI display (Free badge vs Pro badge)
    - Available actions (Create client button enabled/disabled)
    ↓
If status = "past_due":
    - User still has Pro access (grace period)
    - Warning shown to update payment
    ↓
If status = "canceled":
    - Downgraded to Free plan
    - Client limit reduced to 10
    - Existing clients not deleted
    - Can't add new clients if over limit
```

---

## Database Schema Overview

**File:** `/prisma/schema.prisma`

### Tables and Their Purpose

#### 1. User Table
**Purpose:** Store user accounts and subscription info

```prisma
model User {
  id                   String   // Unique ID (CUID)
  name                 String?  // Display name
  email                String   @unique  // Login credential
  emailVerified        DateTime?  // For OAuth providers
  image                String?  // Profile picture URL
  password             String?  // Hashed with bcrypt (for credentials auth)

  // Stripe subscription fields
  stripeCustomerId     String?  @unique  // Links to Stripe customer
  stripeSubscriptionId String?  @unique  // Current subscription
  subscriptionStatus   String?  @default("free")  // Status
  plan                 String   @default("free")  // "free" or "pro"

  // Timestamps
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  // Relations
  accounts             Account[]
  sessions             Session[]
  clients              Client[]
  pets                 Pet[]
  appointments         Appointment[]
  services             Service[]
  settings             Settings?
}
```

**Why these fields:**
- `id`: Primary key, used in all relations
- `email`: Unique identifier for login
- `password`: Hashed, null if using OAuth
- `stripeCustomerId`: Links to Stripe for billing
- `stripeSubscriptionId`: Current active subscription
- `subscriptionStatus`: Real-time status from webhooks
- `plan`: Determines client limit (10 vs unlimited)
- Relations: One user has many clients, pets, appointments, etc.

#### 2. Client Table
**Purpose:** Store customer/client contact information

```prisma
model Client {
  id        String   // Unique ID
  firstName String   // Required
  lastName  String   // Required
  email     String?  // Optional contact
  phone     String?  // Optional contact
  userId    String   // Owner (foreign key)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  pets      Pet[]    // One client has many pets
}
```

**Why cascade delete:**
- When user deleted → all their clients deleted
- Prevents orphaned data

**Why email/phone optional:**
- Some clients may not have email
- Flexibility for different contact preferences

#### 3. Pet Table
**Purpose:** Store pet information (pets belong to clients)

```prisma
model Pet {
  id           String   // Unique ID
  name         String   // Pet name
  breed        String?  // Optional
  species      String   // Dog, Cat, etc
  age          Int?     // Optional
  notes        String?  // Medical notes, preferences

  clientId     String   // Parent client (foreign key)
  userId       String   // Owner user (for quick filtering)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  appointments Appointment[]
  client       Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Why userId on Pet:**
- Direct filtering by user without joining through client
- Performance: `WHERE userId = X` is faster than JOIN
- Data isolation: ensures user can only see their pets

**Cascade delete chain:**
- User deleted → Clients deleted → Pets deleted → Appointments deleted

#### 4. Appointment Table
**Purpose:** Schedule grooming appointments

```prisma
model Appointment {
  id        String   // Unique ID
  petId     String   // Which pet (foreign key)
  userId    String   // Owner user

  date      DateTime // When (date + time)
  duration  Int      @default(60)  // Minutes
  service   String?  // Service type
  notes     String?  // Special instructions
  status    String   @default("scheduled")  // scheduled/completed/cancelled

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  pet       Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Why this structure:**
- `date`: Single DateTime field (easier queries than separate date/time)
- `duration`: Flexible appointment lengths
- `status`: Track lifecycle (scheduled → completed/cancelled)
- `userId`: Direct user filtering for performance

#### 5. Service Table
**Purpose:** Store customizable service offerings

```prisma
model Service {
  id          String   // Unique ID
  name        String   // "Full Groom", "Bath & Brush"
  duration    Int      @default(60)  // Default duration
  price       Float?   // Price in dollars
  description String?  // What's included
  isActive    Boolean  @default(true)  // Can hide without deleting
  sortOrder   Int      @default(0)  // Custom ordering
  userId      String   // Owner user

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Why per-user services:**
- Each groomer has different offerings
- Customizable pricing
- Can deactivate (isActive: false) instead of deleting

**Default services created on signup:**
1. Bath & Brush - $45, 60min
2. Full Groom - $85, 120min
3. Haircut - $65, 90min
4. Nail Trim - $15, 15min
5. Ear Cleaning - $10, 10min
6. De-shedding Treatment - $40, 45min

#### 6. Settings Table
**Purpose:** User business settings

```prisma
model Settings {
  id              String   // Unique ID
  userId          String   @unique  // One-to-one with User

  businessName    String   @default("")
  businessEmail   String   @default("")
  businessPhone   String   @default("")

  defaultDuration Int      @default(60)  // Default appointment length
  openTime        String   @default("09:00")
  closeTime       String   @default("17:00")
  daysOpen        String   @default("1,2,3,4,5")  // Mon-Fri

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Why defaults:**
- Sensible starting values (9-5, Mon-Fri)
- User can customize later
- Created automatically on signup

#### 7. NextAuth Tables
**Purpose:** Session management

```prisma
// OAuth accounts (Google, GitHub, etc)
model Account {
  id                String
  userId            String
  type              String  // oauth, credentials
  provider          String  // google, github
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  // ... OAuth tokens
}

// Active sessions
model Session {
  id           String
  sessionToken String   @unique
  userId       String
  expires      DateTime
}

// Email verification tokens
model VerificationToken {
  identifier String  // Email or phone
  token      String  @unique
  expires    DateTime
}
```

**Why these tables:**
- NextAuth adapter requires them
- Supports multiple auth providers
- Handles session management
- Email verification for passwordless login

### Data Relationships

```
User (1) ─────────── (many) Client
  │                      │
  │                      └─────── (many) Pet
  │                                  │
  ├─────────────────────────────────┘
  │                                  │
  └──────────────── (many) Appointment
  │
  ├──────────────── (many) Service
  │
  └──────────────── (1) Settings

User (1) ─────────── (many) Account (OAuth)
User (1) ─────────── (many) Session (Active logins)
```

### Why PostgreSQL

**Chosen over SQLite/MongoDB/MySQL:**
- **ACID compliance**: Critical for payments
- **Relational integrity**: Foreign keys prevent orphaned data
- **Performance**: Excellent for reads with indexes
- **Vercel integration**: Easy deploy with Supabase/Neon
- **JSON support**: Can store structured data if needed
- **Full-text search**: Built-in for future features

### Database Provider: Supabase

**Configuration in schema.prisma:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // Connection pool
  directUrl = env("DIRECT_URL")          // Direct connection
}
```

**Why two URLs:**
- `DATABASE_URL`: For serverless (connection pooling via PgBouncer)
- `DIRECT_URL`: For migrations (direct PostgreSQL connection)

---

## Summary

This document showed five critical data flows:

1. **Initial Load**: Middleware → Auth check → Data fetch → Render
2. **Authentication**: Form → API → Database → JWT → Cookie
3. **Create Client**: Form → Server Action → Validation → Limit Check → DB Insert → Revalidation
4. **Stripe Checkout**: Button → API → Stripe → Webhook → DB Update → Plan Upgrade
5. **Database**: 7 tables storing users, clients, pets, appointments, services, settings, and auth data

Every flow includes:
- Authentication/authorization checks
- Input validation (Zod schemas)
- Database transactions (Prisma)
- Error handling
- Cache revalidation
- User feedback (toasts/redirects)

The architecture prioritizes:
- **Security**: JWT sessions, middleware protection, server-side validation, webhook verification
- **Performance**: Edge middleware, parallel fetches, optimistic updates
- **Reliability**: Webhook verification, database constraints, error boundaries
- **User Experience**: Clear error messages, real-time updates, smooth flows
- **Monetization**: Stripe integration with client limits enforced in real-time
