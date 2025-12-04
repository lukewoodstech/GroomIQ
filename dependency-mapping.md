# Dependency Mapping - GroomIQ

## Overview

This document maps every external dependency the GroomIQ application relies on - from cloud services to npm packages to API endpoints. For each, we'll explain WHY it's needed and WHAT would break if it failed.

---

## 1. External Services (Cloud Infrastructure)

### Service 1: Vercel (Deployment Platform)

**What it does:**
- Hosts the Next.js application
- Automatically deploys when you push to GitHub
- Provides serverless functions for API routes
- Global CDN for fast page loads worldwide
- Automatic HTTPS/SSL certificates
- Environment variable management
- Preview deployments for branches

**Why you need it:**
Without Vercel (or similar platform like Railway, Render, AWS):
- App wouldn't be accessible on the internet
- No automatic deployments
- You'd need to manage servers yourself
- No built-in SSL certificates
- Manual scaling required

**What breaks if it fails:**
- ❌ Entire website goes down
- ❌ Users can't access the app
- ❌ API routes stop working
- ❌ Database connections fail
- ❌ Stripe webhooks can't reach your server

**Alternative platforms:**
- Railway ($5-20/month)
- Render ($7-25/month)
- AWS Amplify (pay as you go)
- Netlify (with limitations for Server Actions)

**Current Status:** Recommended platform for Next.js apps

---

### Service 2: PostgreSQL Database (via Supabase/Neon/Railway)

**What it does:**
- Stores all application data permanently
- Manages relationships between tables
- Ensures data consistency (ACID compliance)
- Handles concurrent access
- Provides connection pooling for serverless

**Your Database URL Format:**
```
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/database"
```

**Tables Stored:**
- Users (groomer accounts + Stripe data)
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
- No subscription tracking

**What breaks if it fails:**
- ❌ Can't create/read/update/delete any data
- ❌ Authentication fails (can't verify users)
- ❌ Existing users can't log in
- ❌ All app features become non-functional
- ❌ Stripe webhooks can't update subscription status

**Recommended Providers:**
- **Supabase** (Free tier: 500MB, $25/month: 8GB) - Best for beginners
- **Neon** (Free tier: 0.5GB, $19/month: 10GB) - Serverless Postgres
- **Railway** ($5/month minimum) - Simple setup

**Backup Strategy:**
- Supabase: Daily automatic backups (paid plans)
- Neon: Point-in-time recovery (paid plans)
- **Should implement:** Weekly exports to cloud storage

---

### Service 3: Stripe (Payment Processing)

**What it does:**
- Processes credit card payments
- Manages subscriptions ($10/month Pro plan)
- Sends webhooks for payment events
- Provides customer billing portal
- Handles failed payments and retries
- Generates invoices

**Configuration Required:**
```env
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Why you need it:**
- Monetization (Free: 10 clients, Pro: unlimited)
- PCI-compliant payment processing
- Automatic billing management
- Customer portal for subscription management

**What breaks if it fails:**
- ❌ Can't upgrade to Pro plan
- ❌ Can't process payments
- ❌ Existing subscribers can't manage billing
- ❌ Webhook updates don't process (plan status stale)
- ✅ Existing Pro users keep access (database has status)

**Webhook Events Handled:**
- `checkout.session.completed` - User completes payment
- `customer.subscription.updated` - Subscription status changes
- `customer.subscription.deleted` - User cancels
- `invoice.payment_failed` - Payment method declined

**Alternative:**
- Paddle (simpler, but higher fees)
- Lemon Squeezy (merchant of record)
- PayPal/Braintree (older tech)

**Current Integration:** Production-ready

---

### Service 4: NextAuth.js Session Storage

**What it does:**
- Stores user sessions (who's logged in)
- Uses JWT tokens (stored in cookies)
- No database queries on every request
- Handles session expiration

**Current Configuration:** JWT strategy (serverless-friendly)

**Session Cookie Names:**
- Development: `authjs.session-token`
- Production: `__Secure-authjs.session-token`

**Why you need it:**
- User authentication state
- Fast session validation
- Secure, httpOnly cookies

**What breaks if it fails:**
- ❌ Users get logged out randomly
- ❌ Can't maintain login state
- ❌ Have to log in on every page navigation
- ❌ Middleware can't protect routes

---

## 2. Major Libraries & Packages

### Framework Layer

#### Next.js 16.0.3
**Package:** `next`

**What:** Full-stack React framework

**Why:**
- File-based routing (no react-router needed)
- Server-side rendering for SEO
- API routes in same codebase
- Server Actions for backend functions
- Built-in optimization (images, fonts, code splitting)

**What breaks:**
- ❌ Everything. Entire app is built on Next.js.
- ❌ No routing
- ❌ No server-side rendering
- ❌ No API endpoints
- ❌ No Server Actions

**Key Features Used:**
- App Router (file-based routing)
- Server Actions (backend functions)
- API Routes (`/app/api/`)
- Middleware (`/middleware.ts`)
- Server Components (default)
- Client Components (`"use client"`)
- Image optimization
- TypeScript support

**Migration Effort if Removed:** Impossible - would need complete rewrite

---

#### React 19.2.0
**Packages:** `react`, `react-dom`

**What:** UI library for building interactive interfaces

**Why:**
- Component-based architecture
- Virtual DOM for performance
- Hooks for state management
- Large ecosystem

**What breaks:**
- ❌ All UI stops working
- ❌ Components won't render
- ❌ No interactivity

**Features Used:**
- Functional components
- Hooks (useState, useEffect, useTransition)
- Server components (React 19 feature)
- Forms (built-in form handling)

---

### Backend/Data Layer

#### Prisma 6.19.0
**Packages:** `prisma`, `@prisma/client`

**What:** ORM (Object-Relational Mapper) - JavaScript interface to database

**Why:**
- Type-safe database queries
- Automatic migrations
- Schema management
- Connection pooling for serverless
- Auto-completion in VS Code

**What it replaces:** Writing raw SQL queries

**What breaks if it fails:**
- ❌ Can't query database
- ❌ All CRUD operations fail
- ❌ No type safety for database operations
- ❌ Server Actions can't access data

**Commands You Use:**
```bash
npx prisma generate    # Generate Prisma Client
npx prisma migrate dev # Create new migration
npx prisma db push     # Push schema changes (dev)
npx prisma studio      # Visual database browser
```

**Schema File:** `/prisma/schema.prisma`

**Migration Effort:** High (2-3 weeks to switch to TypeORM or raw SQL)

---

#### @auth/prisma-adapter 2.11.1

**What:** Connects NextAuth.js to Prisma/database

**Why:** Stores user accounts, sessions in PostgreSQL

**What breaks:**
- ❌ Can't authenticate users
- ❌ Sessions won't persist
- ❌ Auth tables not created

**Tables It Manages:**
- Account (OAuth providers)
- Session (active sessions)
- User (user accounts)
- VerificationToken (email verification)

---

#### NextAuth.js 5.0.0-beta.30
**Package:** `next-auth`

**What:** Authentication library for Next.js

**Why:**
- Handles login, logout, sessions
- Password hashing
- OAuth providers (Google, GitHub, etc.)
- CSRF protection built-in

**What breaks:**
- ❌ Can't log in or sign up
- ❌ No session management
- ❌ No protected routes
- ❌ Middleware can't check auth

**Providers You Use:**
- Credentials (email/password)

**Could Add:**
- Google OAuth
- GitHub OAuth
- Email magic links

**Configuration:** `/src/auth.ts`

---

#### bcryptjs 3.0.3

**What:** Password hashing library

**Why:** Securely stores passwords (never store plain text!)

**What breaks:**
- ❌ Can't hash passwords
- ❌ Major security vulnerability if removed
- ❌ Login verification fails

**Example:**
```javascript
// Hashing (signup)
const hashed = await bcrypt.hash("password123", 10);
// Stores: "$2a$10$N9qo8uLO..."

// Comparing (login)
const match = await bcrypt.compare("password123", hashed);
```

**Salt Rounds:** 10 (good balance of security vs speed)

---

#### Stripe SDK 20.0.0
**Package:** `stripe`, `@stripe/stripe-js`

**What:** Stripe API client for Node.js and browser

**Why:**
- Create checkout sessions
- Process webhooks
- Manage subscriptions
- Customer portal access

**What breaks:**
- ❌ Can't create checkout sessions
- ❌ Can't process webhook events
- ❌ Can't access billing portal
- ❌ Plan upgrades fail

**Files Using It:**
- `/src/lib/stripe.ts` - Server-side client
- `/src/app/api/stripe/checkout/route.ts` - Checkout
- `/src/app/api/stripe/webhook/route.ts` - Webhooks
- `/src/app/api/stripe/portal/route.ts` - Billing portal

**Configuration:**
```typescript
export const PLANS = {
  FREE: {
    name: "Free",
    clientLimit: 10,
    price: 0,
  },
  PRO: {
    name: "Pro",
    clientLimit: Infinity,
    price: 10,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
  },
}
```

---

### Validation Layer

#### Zod 4.1.12

**What:** TypeScript-first schema validation library

**Why:**
- Validates form inputs
- Validates API requests
- Ensures data integrity
- Runtime type checking

**What breaks:**
- ❌ No input validation
- ❌ Bad data could reach database
- ❌ Security vulnerabilities
- ❌ No type inference from schemas

**Example Usage:**
```typescript
const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Invalid email"),
});

clientSchema.parse(formData); // Throws error if invalid
```

**Used In:**
- All Server Actions (validation)
- Form components (client-side validation)
- API routes (request validation)

**Alternative:** Yup, Joi (less TypeScript integration)

---

### UI/Form Layer

#### React Hook Form 7.66.0
**Package:** `react-hook-form`

**What:** Form state management library

**Why:**
- Handles form inputs efficiently
- Less re-renders than controlled inputs
- Built-in validation
- TypeScript support

**What breaks:**
- ❌ Forms become harder to manage
- ❌ More code needed for validation
- ❌ Performance issues with large forms

**Example:**
```typescript
const form = useForm({
  resolver: zodResolver(clientSchema),
  defaultValues: { firstName: "", lastName: "" }
});
```

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
- `@radix-ui/react-dialog` - Modal popups
- `@radix-ui/react-dropdown-menu` - Dropdowns
- `@radix-ui/react-label` - Form labels
- `@radix-ui/react-popover` - Popovers
- `@radix-ui/react-slot` - Component composition
- `@radix-ui/react-separator` - Dividers
- `@radix-ui/react-navigation-menu` - Navigation
- `@radix-ui/react-alert-dialog` - Confirmation dialogs

**Why:**
- Accessibility built-in (ARIA, keyboard navigation)
- Screen reader support
- Unstyled (customize with Tailwind)
- Headless architecture

**What breaks:**
- ❌ UI components lose accessibility features
- ❌ Keyboard navigation breaks
- ❌ Screen readers can't use app

**Alternative:** HeadlessUI, Ark UI

---

#### Lucide React 0.553.0
**Package:** `lucide-react`

**What:** Icon library (open source)

**Why:**
- Provides all icons (Calendar, Users, Settings, etc.)
- Tree-shakeable (only imports icons you use)
- Consistent design
- TypeScript support

**What breaks:**
- ❌ No icons display
- ❌ UI looks plain
- ❌ Navigation harder to understand

**Icons Used:**
```typescript
import {
  Calendar, Users, PawPrint, Settings,
  LogOut, Plus, Edit, Trash, Check, X
} from "lucide-react"
```

**Alternative:** Heroicons, Feather Icons, FontAwesome

---

### Styling Layer

#### Tailwind CSS 4.0
**Packages:** `tailwindcss`, `@tailwindcss/postcss`

**What:** Utility-first CSS framework

**Why:**
- Fast styling without writing custom CSS
- Consistent design system
- Responsive design built-in
- Dark mode support
- Tree-shaking (removes unused styles)

**What breaks:**
- ❌ App looks unstyled (just raw HTML)
- ❌ Layout breaks
- ❌ Responsive design breaks

**Example:**
```tsx
<button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
  Click Me
</button>
```

**Config:** `/tailwind.config.ts`

---

#### class-variance-authority 0.7.1
**Package:** `class-variance-authority`

**What:** Utility for managing component variants

**Why:** Makes it easy to create button variants (primary, secondary, danger)

**Example:**
```typescript
const buttonVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "bg-primary",
      destructive: "bg-red-500",
      outline: "border border-input",
    }
  }
});
```

**What breaks:** Have to manually manage CSS classes for variants

---

#### tailwind-merge 3.4.0
**Package:** `tailwind-merge`

**What:** Merges Tailwind classes intelligently

**Why:** Prevents conflicts when combining classes

**Example:**
```typescript
cn("px-4", "px-2") // Results in: "px-2" (last one wins)
```

**What breaks:** CSS conflicts when classes override each other

---

#### clsx 2.1.1
**Package:** `clsx`

**What:** Utility for conditionally combining class names

**Why:** Makes dynamic class names cleaner

**Example:**
```typescript
clsx("base", isActive && "active", { error: hasError })
```

**What breaks:** More verbose conditional class logic needed

---

### Utility Libraries

#### date-fns 4.1.0
**Package:** `date-fns`

**What:** Date/time manipulation library

**Why:**
- Formats dates
- Calculates time differences
- Parses date strings
- Lightweight (tree-shakeable)

**What breaks:**
- ❌ Date formatting becomes manual
- ❌ Have to write date logic yourself

**Example:**
```javascript
import { format, addDays } from "date-fns"
format(new Date(), "MMM dd, yyyy") // "Dec 03, 2025"
addDays(new Date(), 7) // One week from now
```

**Used For:**
- Appointment date formatting
- Calendar calculations
- Timestamp display

**Alternative:** Day.js, Luxon, moment.js (deprecated)

---

#### sonner 2.0.7
**Package:** `sonner`

**What:** Toast notification library

**Why:** Shows success/error messages to users

**What breaks:**
- ❌ No user feedback on actions
- ❌ Silent failures/successes
- ❌ Worse UX

**Example:**
```javascript
import { toast } from "sonner"
toast.success("Client created!")
toast.error("Something went wrong")
toast.loading("Saving...")
```

**Config:** `<Toaster />` in root layout

**Alternative:** react-hot-toast, react-toastify

---

#### cmdk 1.1.1
**Package:** `cmdk`

**What:** Command menu component (Command + K style)

**Why:** Could enable keyboard shortcuts for power users

**What breaks:** No command palette functionality (if implemented)

**Status:** Installed but not currently used (future feature)

---

## 3. API Endpoints in Your Backend

### Authentication Endpoints

#### POST /api/auth/signup
**File:** `/src/app/api/auth/signup/route.ts`

**Purpose:** Create new user account

**Input:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Output:**
```json
{
  "message": "User created successfully",
  "userId": "clx123..."
}
```

**What it does:**
1. Validates input (Zod)
2. Checks if email exists
3. Hashes password (bcrypt)
4. Creates user in database (plan: "free")
5. Creates default settings
6. Creates 6 default services

**What breaks if removed:**
- ❌ Users can't sign up
- ❌ No new accounts

---

#### GET/POST /api/auth/[...nextauth]
**File:** `/src/app/api/auth/[...nextauth]/route.ts`

**Purpose:** NextAuth.js authentication endpoints

**Handles:**
- `/api/auth/signin` - Login page
- `/api/auth/signout` - Logout
- `/api/auth/session` - Get current session
- `/api/auth/providers` - List auth providers
- `/api/auth/callback/credentials` - Handle login

**Powered by:** NextAuth.js handlers

---

### Stripe Endpoints

#### POST /api/stripe/checkout
**File:** `/src/app/api/stripe/checkout/route.ts`

**Purpose:** Create Stripe checkout session for Pro plan

**Process:**
1. Verify user authentication
2. Check if user already has subscription (redirect to portal if yes)
3. Create/get Stripe customer
4. Create checkout session ($10/month)
5. Return checkout URL

**Output:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

---

#### POST /api/stripe/webhook
**File:** `/src/app/api/stripe/webhook/route.ts`

**Purpose:** Handle Stripe webhook events

**Events Handled:**
- `checkout.session.completed` - Update user to Pro plan
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Downgrade to Free plan
- `invoice.payment_failed` - Mark as past_due

**Security:** Verifies Stripe signature

**What breaks if removed:**
- ❌ Subscriptions don't update in database
- ❌ Users stay on old plan status
- ❌ Plan changes not reflected

---

#### POST /api/stripe/portal
**File:** `/src/app/api/stripe/portal/route.ts`

**Purpose:** Create Stripe billing portal session

**Output:**
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

**User Can:**
- Update payment method
- View invoices
- Cancel subscription
- Download receipts

---

### User Profile Endpoints

#### GET/PATCH /api/user/profile
**File:** `/src/app/api/user/profile/route.ts`

**Purpose:** Get/update user profile (name, email)

---

#### PATCH /api/user/password
**File:** `/src/app/api/user/password/route.ts`

**Purpose:** Change user password

**Process:**
1. Verify current password
2. Hash new password
3. Update database

---

### Server Actions (Not REST APIs)

These are Next.js Server Actions - RPC-style functions called directly from React components.

**Client Management:**
- `getClients(page, itemsPerPage)` - List clients with pagination
- `getClient(id)` - Get single client
- `createClient(formData)` - Create new client (checks limit!)
- `updateClient(id, formData)` - Update client
- `deleteClient(id)` - Delete client

**Pet Management:**
- `getPets(page, itemsPerPage)` - List pets
- `getPet(id)` - Get single pet
- `createPet(formData)` - Create pet
- `updatePet(id, formData)` - Update pet
- `deletePet(id)` - Delete pet

**Appointment Management:**
- `getAppointments()` - List all appointments
- `createAppointment(formData)` - Create appointment (checks conflicts)
- `updateAppointment(id, formData)` - Update appointment
- `updateAppointmentStatus(id, status)` - Change status
- `deleteAppointment(id)` - Delete appointment

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

### Entity Relationship Diagram

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

Stripe Integration:
User.stripeCustomerId → Stripe Customer
User.stripeSubscriptionId → Stripe Subscription
User.plan → "free" or "pro" (determines client limit)
```

### Critical Tables

#### Users
**Purpose:** Groomer accounts + Stripe subscription data

**Critical Fields:**
- `email` - Login credential
- `password` - Hashed password
- `plan` - "free" or "pro"
- `subscriptionStatus` - "free", "active", "past_due", "canceled"
- `stripeCustomerId` - Links to Stripe
- `stripeSubscriptionId` - Current subscription

**If Lost:** All user data, subscriptions, authentication

---

#### Clients
**Purpose:** Pet owners

**Critical Fields:**
- `firstName`, `lastName` - Display name
- `email`, `phone` - Contact info
- `userId` - Owner (foreign key)

**Cascade:** User deleted → Clients deleted

**If Lost:** All customer records

---

#### Appointments
**Purpose:** Scheduled grooming appointments

**Critical Fields:**
- `date` - When appointment is scheduled
- `petId` - Which pet
- `userId` - Which groomer
- `status` - "scheduled", "completed", "cancelled"

**If Lost:** All scheduling data

---

## 5. Third-Party Integrations

### Current Integrations ✅

1. **PostgreSQL Database** (via Supabase/Neon/Railway)
   - Critical: Yes
   - Failure Impact: Total app failure

2. **NextAuth.js** (authentication)
   - Critical: Yes
   - Failure Impact: Can't log in

3. **Prisma** (ORM)
   - Critical: Yes
   - Failure Impact: Can't access database

4. **Stripe** (payment processing)
   - Critical: For monetization
   - Failure Impact: Can't upgrade, existing Pro users unaffected

---

### Future Integrations (Not Implemented) 🔮

1. **SendGrid/Resend** - Email notifications
   - Appointment reminders
   - Confirmation emails
   - Password reset emails

2. **Twilio** - SMS notifications
   - Text reminders
   - Confirmation texts

3. **Google Calendar** - Calendar sync
   - Sync appointments
   - Two-way sync

4. **Cloudinary** - Image uploads
   - Pet photos
   - Before/after photos

---

## Critical Dependency Chain

### What Your App CANNOT Function Without:

1. **PostgreSQL Database**
   - Impact: 100% failure
   - No data = no app functionality

2. **Next.js Runtime**
   - Impact: 100% failure
   - Framework that powers everything

3. **React**
   - Impact: 100% failure
   - UI rendering

4. **Prisma**
   - Impact: 100% failure
   - Database access

5. **NextAuth.js**
   - Impact: 95% failure
   - User authentication

6. **Stripe** (for paid features)
   - Impact: Monetization broken
   - Free plan still works

---

### What Would Degrade Gracefully:

1. **Sonner (Toasts)**
   - App works, but no user feedback

2. **Lucide Icons**
   - App works, but looks plain

3. **Tailwind CSS**
   - App works, but unstyled

4. **date-fns**
   - Dates display as ISO strings

5. **Stripe**
   - Free plan continues working
   - Can't upgrade or process payments

---

## Summary: Dependency Health Check

### ✅ Production-Ready Dependencies
- Next.js 16 - Latest stable
- React 19 - Latest stable
- Prisma 6 - Mature ORM
- Tailwind CSS 4 - Latest
- Zod 4 - Growing rapidly
- Stripe SDK - Production-grade

### 🟡 Worth Monitoring
- NextAuth v5 (still in beta) - Stable enough for production
- React 19 (just released) - Cutting edge

### ❌ Missing But Recommended
- Error tracking (Sentry, LogRocket)
- Performance monitoring (Vercel Analytics)
- Database backups (automated)
- Email service (for password reset)
- Logging service (Better Stack, Datadog)

---

## What to Do If Dependencies Fail

| Dependency | Backup Plan | Migration Effort |
|------------|-------------|------------------|
| Vercel | Deploy to Railway/Render | Medium (1-2 days) |
| PostgreSQL | Switch provider (Neon→Supabase) | Easy (1-2 hours) |
| NextAuth | Implement custom auth | Hard (1-2 weeks) |
| Prisma | Raw SQL or TypeORM | Hard (2-3 weeks) |
| Tailwind | CSS Modules or Styled Components | Medium (3-5 days) |
| Radix UI | HeadlessUI or Chakra UI | Medium (1 week) |
| Stripe | Paddle or LemonSqueezy | Medium (3-5 days) |

**Key Insight:** Most critical dependencies (Next.js, React, Prisma, Stripe) are all industry-standard choices with large communities and long-term support.

---

## Environment Variables Required

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..." # Generate with: openssl rand -base64 32

# Stripe
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STRIPE_SECRET_KEY="sk_test_..." # or sk_live_...
STRIPE_PRO_PRICE_ID="price_..." # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET="whsec_..." # From Stripe webhook settings
```

**What breaks if missing:**
- No `DATABASE_URL` → Can't connect to database
- No `NEXTAUTH_SECRET` → Sessions don't work
- No `STRIPE_SECRET_KEY` → Can't process payments
- No `STRIPE_WEBHOOK_SECRET` → Webhooks fail verification

---

## Cost Breakdown (Monthly)

### Free Tier (Development):
- Vercel: $0 (hobby plan)
- Supabase: $0 (free tier)
- Stripe: $0 (pay per transaction)
- **Total: $0/month**

### Production (Small Scale):
- Vercel: $20/month (Pro plan)
- Supabase: $25/month (Pro plan with backups)
- Stripe: 2.9% + 30¢ per transaction
- Domain: $12/year
- **Total: ~$45-50/month + transaction fees**

### Production (Growing):
- Vercel: $20/month
- Neon: $19/month (10GB database)
- Stripe: 2.9% + 30¢ per transaction
- Sentry: $26/month (error tracking)
- **Total: ~$65-70/month + transaction fees**

**Revenue Needed to Break Even:** 7 Pro subscribers ($70/month at $10 each)
