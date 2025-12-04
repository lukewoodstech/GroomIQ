# GroomIQ Architecture Diagram

**Visual architecture diagrams for technical interviews and documentation**

---

## 1. Overall System Architecture

```mermaid
graph TB
    subgraph "Client Layer (Browser)"
        UI[React 19 UI Components]
        Pages[Next.js Pages]
        Forms[Forms & Inputs]
        Calendar[Calendar View]
    end

    subgraph "Application Layer (Next.js 16 on Vercel)"
        subgraph "Frontend (Server Components)"
            HomePage[Dashboard/page.tsx]
            ClientsPage[Clients/page.tsx]
            PetsPage[Pets/page.tsx]
            SchedulePage[Schedule/page.tsx]
            SettingsPage[Settings/page.tsx]
        end
        
        subgraph "Backend (Server Actions)"
            ClientActions[actions/clients.ts]
            PetActions[actions/pets.ts]
            ApptActions[actions/appointments.ts]
            ServiceActions[actions/services.ts]
            SettingsActions[actions/settings.ts]
        end
        
        subgraph "API Routes"
            AuthAPI[api/auth/[...nextauth]]
            SignupAPI[api/auth/signup]
            ProfileAPI[api/user/profile]
            CheckoutAPI[api/stripe/checkout]
            PortalAPI[api/stripe/portal]
            WebhookAPI[api/stripe/webhook]
        end
        
        Middleware[middleware.ts<br/>Auth Guard]
        AuthConfig[auth.ts<br/>NextAuth Config]
    end

    subgraph "Data Layer"
        Prisma[Prisma ORM]
        
        subgraph "Database (PostgreSQL on Supabase)"
            UserTable[(User Table<br/>+Stripe fields)]
            ClientTable[(Client Table)]
            PetTable[(Pet Table)]
            ApptTable[(Appointment Table)]
            ServiceTable[(Service Table)]
            SettingsTable[(Settings Table)]
        end
    end

    subgraph "External Services"
        Stripe[Stripe API<br/>Payment Processing]
        Supabase[Supabase<br/>PostgreSQL Hosting]
        Vercel[Vercel<br/>Deployment Platform]
    end

    %% User Interactions
    UI --> Pages
    Pages --> Middleware
    Middleware -->|Authenticated| HomePage
    Middleware -->|Not Authenticated| AuthAPI
    
    %% Page to Actions
    HomePage --> ApptActions
    ClientsPage --> ClientActions
    PetsPage --> PetActions
    SchedulePage --> ApptActions
    SettingsPage --> SettingsActions
    
    %% Actions to Database
    ClientActions --> Prisma
    PetActions --> Prisma
    ApptActions --> Prisma
    ServiceActions --> Prisma
    SettingsActions --> Prisma
    
    %% API Routes
    Forms --> SignupAPI
    Forms --> CheckoutAPI
    SettingsPage --> PortalAPI
    Stripe --> WebhookAPI
    
    %% Auth Flow
    AuthAPI --> AuthConfig
    AuthConfig --> Prisma
    
    %% Database Connections
    Prisma --> UserTable
    Prisma --> ClientTable
    Prisma --> PetTable
    Prisma --> ApptTable
    Prisma --> ServiceTable
    Prisma --> SettingsTable
    
    %% External Services
    Prisma -.->|Connection Pool| Supabase
    CheckoutAPI --> Stripe
    PortalAPI --> Stripe
    WebhookAPI --> Stripe
    Vercel -.->|Hosts| Middleware
    
    %% Data Relationships
    UserTable ---|1:N| ClientTable
    UserTable ---|1:N| PetTable
    UserTable ---|1:N| ApptTable
    ClientTable ---|1:N| PetTable
    PetTable ---|1:N| ApptTable

    classDef frontend fill:#e1f5ff,stroke:#0288d1,stroke-width:2px
    classDef backend fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef database fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class UI,Pages,Forms,Calendar,HomePage,ClientsPage,PetsPage,SchedulePage,SettingsPage frontend
    class ClientActions,PetActions,ApptActions,ServiceActions,SettingsActions,AuthAPI,SignupAPI,ProfileAPI,CheckoutAPI,PortalAPI,WebhookAPI,Middleware,AuthConfig backend
    class Prisma,UserTable,ClientTable,PetTable,ApptTable,ServiceTable,SettingsTable database
    class Stripe,Supabase,Vercel external
```

---

## 2. Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Middleware
    participant AuthAPI
    participant Auth as auth.ts
    participant Prisma
    participant DB as PostgreSQL
    
    User->>Browser: Navigate to /clients
    Browser->>Middleware: GET /clients
    
    alt No Session Cookie
        Middleware->>Browser: Redirect to /login
        Browser->>User: Show login form
        User->>Browser: Submit email/password
        Browser->>AuthAPI: POST credentials
        AuthAPI->>Auth: authorize(credentials)
        Auth->>Prisma: findUnique(email)
        Prisma->>DB: SELECT * FROM users WHERE email=?
        DB->>Prisma: User record
        Prisma->>Auth: User object
        Auth->>Auth: bcrypt.compare(password, hash)
        
        alt Password Valid
            Auth->>AuthAPI: Return user
            AuthAPI->>Browser: Set session cookie (JWT)
            Browser->>Middleware: GET /clients (with cookie)
            Middleware->>Browser: Allow access
            Browser->>User: Show clients page
        else Password Invalid
            Auth->>AuthAPI: Return null
            AuthAPI->>Browser: 401 Unauthorized
            Browser->>User: Show error
        end
    else Has Valid Session
        Middleware->>Browser: Allow access
        Browser->>User: Show clients page
    end
```

---

## 3. Payment/Subscription Flow

```mermaid
sequenceDiagram
    actor User
    participant Settings as Settings Page
    participant Checkout as /api/stripe/checkout
    participant Stripe as Stripe API
    participant Browser
    participant Webhook as /api/stripe/webhook
    participant Prisma
    participant DB as PostgreSQL
    
    rect rgb(200, 220, 255)
        Note over User,Stripe: Upgrade to Pro Flow
        User->>Settings: Click "Upgrade to Pro"
        Settings->>Checkout: POST /api/stripe/checkout
        Checkout->>Prisma: Get user data
        Prisma->>DB: SELECT * FROM users
        DB->>Prisma: User record
        
        alt User has no Stripe customer
            Checkout->>Stripe: Create customer
            Stripe->>Checkout: customer_id
            Checkout->>Prisma: Update user.stripeCustomerId
            Prisma->>DB: UPDATE users SET stripeCustomerId=?
        end
        
        Checkout->>Stripe: Create checkout session
        Stripe->>Checkout: session URL
        Checkout->>Settings: Return checkout URL
        Settings->>Browser: Redirect to Stripe checkout
        Browser->>User: Show Stripe payment form
    end
    
    rect rgb(255, 240, 200)
        Note over User,DB: User Completes Payment
        User->>Stripe: Submit payment (card: 4242...)
        Stripe->>Stripe: Process payment
        Stripe->>Webhook: POST checkout.session.completed
        
        Webhook->>Webhook: Verify signature
        Webhook->>Prisma: Update subscription status
        Prisma->>DB: UPDATE users SET<br/>plan='pro',<br/>subscriptionStatus='active',<br/>stripeSubscriptionId=?
        DB->>Prisma: Success
        Webhook->>Stripe: 200 OK
        
        Stripe->>Browser: Redirect to success URL
        Browser->>Settings: Navigate to /settings?success=true
        Settings->>Prisma: Fetch updated user
        Prisma->>DB: SELECT * FROM users
        DB->>Settings: User with plan='pro'
        Settings->>User: Show "Pro Plan" badge
    end
```

---

## 4. Client Creation Flow (with Plan Limit Check)

```mermaid
sequenceDiagram
    actor User
    participant UI as Client Form
    participant Action as createClient()
    participant Auth as auth()
    participant Stripe as Stripe Helper
    participant Prisma
    participant DB as PostgreSQL
    
    User->>UI: Fill out client form
    User->>UI: Click "Create Client"
    UI->>Action: Submit form data
    
    Action->>Auth: Get current session
    Auth->>Action: session.user.id
    
    Action->>Prisma: Get user + client count
    Prisma->>DB: SELECT *, COUNT(clients) FROM users
    DB->>Prisma: {plan: 'free', clientCount: 9}
    Prisma->>Action: User data
    
    Action->>Stripe: canAddClient(9, 'free')
    Stripe->>Stripe: Check: 9 < 10 (limit)?
    Stripe->>Action: true ✅
    
    Action->>Prisma: Create client
    Prisma->>DB: INSERT INTO clients VALUES(...)
    DB->>Prisma: New client record
    Prisma->>Action: Client created
    
    Action->>UI: revalidatePath('/clients')
    UI->>User: Show success + updated list
    
    rect rgb(255, 200, 200)
        Note over User,DB: What if user hits limit?
        User->>UI: Try to add 11th client
        UI->>Action: Submit form
        Action->>Prisma: Get user data
        Prisma->>Action: {plan: 'free', clientCount: 10}
        Action->>Stripe: canAddClient(10, 'free')
        Stripe->>Stripe: Check: 10 < 10?
        Stripe->>Action: false ❌
        Action->>UI: throw Error("Upgrade to Pro!")
        UI->>User: Show error message
    end
```

---

## 5. Database Schema (Entity Relationship)

```mermaid
erDiagram
    USER ||--o{ CLIENT : owns
    USER ||--o{ PET : manages
    USER ||--o{ APPOINTMENT : schedules
    USER ||--o{ SERVICE : defines
    USER ||--o| SETTINGS : has
    USER ||--o{ ACCOUNT : "auth providers"
    USER ||--o{ SESSION : "active sessions"
    
    CLIENT ||--o{ PET : owns
    PET ||--o{ APPOINTMENT : "booked for"
    
    USER {
        string id PK
        string email UK
        string password
        string name
        string plan "free|pro"
        string subscriptionStatus "active|past_due|canceled"
        string stripeCustomerId UK
        string stripeSubscriptionId UK
        datetime createdAt
    }
    
    CLIENT {
        string id PK
        string userId FK
        string firstName
        string lastName
        string email
        string phone
        datetime createdAt
    }
    
    PET {
        string id PK
        string userId FK
        string clientId FK
        string name
        string species
        string breed
        int age
        string notes
    }
    
    APPOINTMENT {
        string id PK
        string userId FK
        string petId FK
        datetime date
        int duration
        string service
        string status "scheduled|completed|cancelled"
        string notes
    }
    
    SERVICE {
        string id PK
        string userId FK
        string name
        int duration
        float price
        string description
        boolean isActive
        int sortOrder
    }
    
    SETTINGS {
        string id PK
        string userId FK
        string businessName
        string businessEmail
        string businessPhone
        int defaultDuration
        string openTime
        string closeTime
        string daysOpen
    }
    
    ACCOUNT {
        string id PK
        string userId FK
        string provider "google|github"
        string providerAccountId
        string refresh_token
        string access_token
    }
    
    SESSION {
        string id PK
        string userId FK
        string sessionToken UK
        datetime expires
    }
```

---

## 6. Technology Stack Landscape

```mermaid
graph LR
    subgraph "Frontend Technologies"
        React[React 19<br/>UI Library]
        Next[Next.js 16<br/>Framework]
        Tailwind[TailwindCSS v4<br/>Styling]
        Shadcn[Shadcn UI<br/>Components]
        Lucide[Lucide Icons<br/>Icons]
    end
    
    subgraph "Backend Technologies"
        NextAPI[Next.js API Routes<br/>Serverless Functions]
        NextAuth[NextAuth.js v5<br/>Authentication]
        ServerActions[Server Actions<br/>RPC Layer]
    end
    
    subgraph "Database & ORM"
        Prisma[Prisma ORM<br/>Type-safe DB Client]
        Postgres[PostgreSQL<br/>Relational Database]
    end
    
    subgraph "External APIs"
        StripeSDK[Stripe SDK<br/>Payment Processing]
        StripeAPI[Stripe API<br/>Subscription Webhooks]
    end
    
    subgraph "Development Tools"
        TS[TypeScript 5<br/>Type Safety]
        Zod[Zod<br/>Schema Validation]
        ReactHookForm[React Hook Form<br/>Form Management]
        DateFns[date-fns<br/>Date Utilities]
    end
    
    subgraph "Hosting & Infrastructure"
        Vercel[Vercel<br/>Serverless Deployment]
        Supabase[Supabase<br/>PostgreSQL Hosting]
        StripeInfra[Stripe<br/>Payment Infrastructure]
    end
    
    Next --> React
    Next --> Tailwind
    Shadcn --> Tailwind
    Next --> NextAPI
    Next --> ServerActions
    NextAPI --> NextAuth
    ServerActions --> Prisma
    NextAPI --> Prisma
    Prisma --> Postgres
    NextAPI --> StripeSDK
    StripeSDK --> StripeAPI
    Vercel -.->|Hosts| Next
    Supabase -.->|Hosts| Postgres
    ServerActions --> Zod
    React --> ReactHookForm

    classDef frontend fill:#4fc3f7,stroke:#01579b,stroke-width:2px,color:#000
    classDef backend fill:#ffb74d,stroke:#e65100,stroke-width:2px,color:#000
    classDef database fill:#81c784,stroke:#1b5e20,stroke-width:2px,color:#000
    classDef external fill:#f06292,stroke:#880e4f,stroke-width:2px,color:#fff
    classDef tools fill:#ba68c8,stroke:#4a148c,stroke-width:2px,color:#fff
    classDef infra fill:#90a4ae,stroke:#263238,stroke-width:2px,color:#fff
    
    class React,Next,Tailwind,Shadcn,Lucide frontend
    class NextAPI,NextAuth,ServerActions backend
    class Prisma,Postgres database
    class StripeSDK,StripeAPI external
    class TS,Zod,ReactHookForm,DateFns tools
    class Vercel,Supabase,StripeInfra infra
```

---

## 7. Request/Response Flow (Full Stack)

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant Vercel as Vercel Edge
    participant Middleware
    participant Page as Server Component
    participant Action as Server Action
    participant Prisma
    participant Supabase as Supabase PostgreSQL
    participant Stripe
    
    rect rgb(230, 240, 255)
        Note over User,Supabase: Initial Page Load
        User->>Browser: Navigate to /clients
        Browser->>Vercel: GET /clients
        Vercel->>Middleware: Check authentication
        Middleware->>Middleware: Validate session cookie
        Middleware->>Page: Allowed (authenticated)
        Page->>Prisma: getClients()
        Prisma->>Supabase: SELECT * FROM clients WHERE userId=?
        Supabase->>Prisma: Client records []
        Prisma->>Page: Return clients
        Page->>Vercel: HTML with data
        Vercel->>Browser: Rendered page
        Browser->>User: Display client list
    end
    
    rect rgb(255, 245, 230)
        Note over User,Stripe: User Creates Client
        User->>Browser: Fill form + submit
        Browser->>Action: createClient(formData)
        Action->>Action: auth() - get user
        Action->>Prisma: Get user + count clients
        Prisma->>Supabase: SELECT *, COUNT(clients)
        Supabase->>Prisma: {plan: 'free', count: 5}
        Prisma->>Action: User data
        Action->>Action: Check: canAddClient(5, 'free')
        Action->>Prisma: Create client
        Prisma->>Supabase: INSERT INTO clients
        Supabase->>Prisma: New client
        Prisma->>Action: Client created
        Action->>Page: revalidatePath('/clients')
        Page->>Browser: Refresh with new data
        Browser->>User: Show success + updated list
    end
    
    rect rgb(255, 235, 245)
        Note over User,Stripe: User Upgrades to Pro
        User->>Browser: Click "Upgrade to Pro"
        Browser->>Action: POST /api/stripe/checkout
        Action->>Prisma: Get user
        Prisma->>Supabase: SELECT * FROM users
        Supabase->>Action: User data
        Action->>Stripe: Create checkout session
        Stripe->>Action: checkout URL
        Action->>Browser: Redirect to Stripe
        User->>Stripe: Complete payment
        Stripe->>Action: Webhook: subscription.created
        Action->>Prisma: Update user plan='pro'
        Prisma->>Supabase: UPDATE users SET plan='pro'
        Supabase->>Prisma: Success
        Prisma->>Action: Updated
        Action->>Stripe: 200 OK
        Stripe->>Browser: Redirect to /settings
        Browser->>User: Show Pro badge
    end
```

---

## 8. Deployment Architecture

```mermaid
graph TB
    subgraph "Developer Workflow"
        Dev[Local Development]
        Git[GitHub Repository]
        Dev -->|git push| Git
    end
    
    subgraph "CI/CD Pipeline"
        Git -->|Webhook| VercelCI[Vercel CI/CD]
        VercelCI -->|npm install| Install[Install Dependencies]
        Install -->|prisma generate| PrismaGen[Generate Prisma Client]
        PrismaGen -->|next build| Build[Build Next.js App]
        Build -->|Deploy| Edge[Vercel Edge Network]
    end
    
    subgraph "Production Environment (Vercel)"
        Edge -->|Route| Functions[Serverless Functions]
        Functions --> API[API Routes]
        Functions --> SSR[Server Components]
        Functions --> Actions[Server Actions]
        
        Static[Static Assets<br/>/_next/static/]
        Edge --> Static
    end
    
    subgraph "External Services (Production)"
        API --> SupabaseDB[Supabase PostgreSQL<br/>Connection Pool]
        Actions --> SupabaseDB
        API --> StripeProd[Stripe API<br/>Live Mode]
        StripeProd -->|Webhooks| Functions
    end
    
    subgraph "Monitoring & Logs"
        Functions --> VercelLogs[Vercel Logs]
        StripeProd --> StripeDash[Stripe Dashboard]
        SupabaseDB --> SupabaseLog[Supabase Logs]
    end
    
    Users[End Users] -->|HTTPS| Edge

    classDef dev fill:#e3f2fd,stroke:#1976d2
    classDef build fill:#fff3e0,stroke:#f57c00
    classDef prod fill:#f1f8e9,stroke:#689f38
    classDef external fill:#fce4ec,stroke:#c2185b
    classDef monitor fill:#f3e5f5,stroke:#7b1fa2
    
    class Dev,Git dev
    class VercelCI,Install,PrismaGen,Build build
    class Edge,Functions,API,SSR,Actions,Static prod
    class SupabaseDB,StripeProd external
    class VercelLogs,StripeDash,SupabaseLog monitor
```

---

## Technical Interview Talking Points

### Architecture Decisions

1. **Why Next.js 16 App Router?**
   - Server Components reduce JavaScript sent to browser
   - Server Actions eliminate need for separate API layer for mutations
   - Built-in middleware for authentication
   - Automatic code splitting and optimization
   - Serverless deployment on Vercel

2. **Why Prisma ORM?**
   - Type-safe database queries (TypeScript)
   - Schema migration management
   - Connection pooling out of the box
   - Great developer experience with auto-completion

3. **Why NextAuth.js?**
   - Industry standard for Next.js authentication
   - JWT strategy for stateless auth (scalable)
   - Built-in CSRF protection
   - Easy to add OAuth providers later

4. **Why Stripe for Payments?**
   - Most developer-friendly payment API
   - Built-in subscription management
   - Webhooks for real-time updates
   - PCI compliance handled by Stripe
   - Hosted checkout = no PCI scope for us

5. **Why Supabase for Database?**
   - Managed PostgreSQL (no DevOps)
   - Connection pooling built-in
   - Automatic backups
   - Good free tier for development
   - Easy to scale

### Scalability Considerations

- **Database**: Supabase handles connection pooling, can scale to thousands of connections
- **Application**: Serverless functions auto-scale based on traffic
- **Caching**: Next.js caches server components, reducing database queries
- **Subscription Limits**: Client limits prevent abuse on free tier

### Security Features

- **Authentication**: JWT tokens, bcrypt password hashing (10 rounds)
- **Authorization**: Middleware checks on every request
- **CSRF Protection**: NextAuth built-in protection
- **SQL Injection**: Prisma parameterizes all queries
- **Webhook Verification**: Stripe signature validation
- **Environment Variables**: Secrets never in code, only in Vercel

### Performance Optimizations

- **Server Components**: 40% less JavaScript sent to browser
- **Code Splitting**: Each page loads only what it needs
- **Database Indexes**: Prisma auto-indexes foreign keys
- **Connection Pooling**: Reuses database connections
- **Edge Caching**: Vercel CDN caches static assets globally

---

**Use this diagram to explain GroomIQ's architecture to:**
- Technical interviewers
- New developers joining the project
- Stakeholders wanting to understand the tech stack
- Your future self when you forget how it all works! 😄
