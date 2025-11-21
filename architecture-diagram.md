# GroomIQ Architecture Diagram

## How to View This Diagram

### Option 1: Mermaid Live Editor (Recommended)
1. Copy the Mermaid code below
2. Go to https://mermaid.live
3. Paste the code in the left panel
4. Click "Download SVG" or "Download PNG" to export

### Option 2: VS Code Extension
1. Install "Markdown Preview Mermaid Support" extension
2. Open this file in VS Code
3. Click "Open Preview" (Cmd+Shift+V on Mac)

### Option 3: GitHub
1. Push this file to GitHub
2. GitHub automatically renders Mermaid diagrams in markdown

---

## Complete System Architecture Diagram

\`\`\`mermaid
graph TB
    subgraph "USER DEVICES"
        Browser[Web Browser]
    end

    subgraph "APPLICATION LAYER - Next.js 16"
        subgraph "Frontend UI - React 19"
            Pages[Pages Components<br/>- Home/Calendar<br/>- Clients List<br/>- Pets List<br/>- Schedule<br/>- Settings<br/>- Login/Signup]
            Components[Reusable Components<br/>- Sidebar<br/>- Forms<br/>- Dialogs<br/>- Buttons/Inputs]
            Styles[Styling<br/>- Tailwind CSS<br/>- Shadcn UI<br/>- Radix UI]
        end

        subgraph "Middleware Layer"
            AuthMiddleware[Middleware<br/>Route Protection<br/>Session Check]
        end

        subgraph "Backend - Server Side"
            ServerActions[Server Actions<br/>- clients.ts<br/>- pets.ts<br/>- appointments.ts<br/>- services.ts<br/>- settings.ts]
            APIRoutes[API Routes<br/>- /api/auth/signup<br/>- /api/auth/callback]
            AuthSystem[NextAuth.js v5<br/>- JWT Sessions<br/>- Credentials Provider<br/>- Password Hashing]
        end
    end

    subgraph "DATA LAYER"
        subgraph "ORM"
            Prisma[Prisma Client<br/>Type-Safe Queries<br/>Connection Pooling<br/>Auto-generated Types]
        end

        subgraph "DATABASE - PostgreSQL"
            DB[(PostgreSQL Database)]

            UserTable[Users Table<br/>- id, email, password<br/>- name]
            ClientTable[Clients Table<br/>- id, firstName, lastName<br/>- email, phone<br/>- userId FK]
            PetTable[Pets Table<br/>- id, name, breed<br/>- species, age<br/>- clientId FK, userId FK]
            ApptTable[Appointments Table<br/>- id, date, duration<br/>- service, status<br/>- petId FK, userId FK]
            ServiceTable[Services Table<br/>- id, name, duration<br/>- price, isActive<br/>- userId FK]
            SettingsTable[Settings Table<br/>- id, businessName<br/>- openTime, closeTime<br/>- userId FK]
            AuthTables[Auth Tables<br/>- Account<br/>- Session<br/>- VerificationToken]
        end
    end

    subgraph "EXTERNAL SERVICES"
        Deployment[Deployment Platform<br/>Vercel/Railway/Render]
        DBProvider[Database Provider<br/>Neon/Supabase/Railway]
    end

    subgraph "DEVELOPMENT TOOLS"
        DevTools[Development<br/>- TypeScript<br/>- ESLint<br/>- Prisma Studio]
    end

    %% User Interactions
    Browser -->|HTTPS Requests| AuthMiddleware

    %% Middleware Flow
    AuthMiddleware -->|Authenticated| Pages
    AuthMiddleware -->|Unauthenticated| Pages
    AuthMiddleware -->|Check Session| AuthSystem

    %% Frontend to Backend
    Pages -->|User Actions| ServerActions
    Pages -->|Form Submissions| APIRoutes
    Pages -.->|Styling| Styles
    Pages -.->|Uses| Components

    %% Backend to Data
    ServerActions -->|CRUD Operations| Prisma
    APIRoutes -->|Auth Operations| AuthSystem
    AuthSystem -->|Store/Verify| Prisma

    %% Data Access
    Prisma -->|SQL Queries| DB
    DB --> UserTable
    DB --> ClientTable
    DB --> PetTable
    DB --> ApptTable
    DB --> ServiceTable
    DB --> SettingsTable
    DB --> AuthTables

    %% Relationships
    UserTable -.->|1:Many| ClientTable
    UserTable -.->|1:Many| PetTable
    UserTable -.->|1:Many| ApptTable
    UserTable -.->|1:Many| ServiceTable
    UserTable -.->|1:1| SettingsTable
    ClientTable -.->|1:Many| PetTable
    PetTable -.->|1:Many| ApptTable
    UserTable -.->|1:Many| AuthTables

    %% External Services
    Deployment -.->|Hosts| Pages
    Deployment -.->|Runs| ServerActions
    DBProvider -.->|Provides| DB

    %% Styling
    classDef frontend fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef backend fill:#10b981,stroke:#047857,color:#fff
    classDef data fill:#f59e0b,stroke:#d97706,color:#fff
    classDef external fill:#8b5cf6,stroke:#6d28d9,color:#fff

    class Pages,Components,Styles frontend
    class ServerActions,APIRoutes,AuthMiddleware,AuthSystem backend
    class Prisma,DB,UserTable,ClientTable,PetTable,ApptTable,ServiceTable,SettingsTable,AuthTables data
    class Deployment,DBProvider,DevTools external
\`\`\`

---

## Data Flow Diagram: Creating a New Client

\`\`\`mermaid
sequenceDiagram
    actor User
    participant Browser
    participant ClientPage as Client Page<br/>(Frontend)
    participant ServerAction as createClient()<br/>(Server Action)
    participant Auth as NextAuth
    participant Prisma as Prisma ORM
    participant DB as PostgreSQL

    User->>Browser: Click "Add Client"
    Browser->>ClientPage: Open Dialog
    User->>ClientPage: Fill Form<br/>(Name, Email, Phone)
    User->>ClientPage: Click "Create"

    ClientPage->>ClientPage: Validate with Zod<br/>(Client-side)

    ClientPage->>ServerAction: Call createClient(formData)

    ServerAction->>Auth: Check Session
    Auth-->>ServerAction: Return userId

    alt User Not Authenticated
        ServerAction-->>ClientPage: Error: Unauthorized
        ClientPage->>User: Show Error Toast
    else User Authenticated
        ServerAction->>ServerAction: Validate with Zod<br/>(Server-side)

        ServerAction->>Prisma: Check for Duplicates<br/>findFirst(email/phone)
        Prisma->>DB: SELECT WHERE email/phone
        DB-->>Prisma: Return existing client (if any)
        Prisma-->>ServerAction: Existing client or null

        alt Duplicate Found
            ServerAction-->>ClientPage: Error: Client Exists
            ClientPage->>User: Show Error Toast
        else No Duplicate
            ServerAction->>Prisma: Create Client<br/>prisma.client.create()
            Prisma->>DB: INSERT INTO clients
            DB-->>Prisma: Confirm Insert
            Prisma-->>ServerAction: Return new client

            ServerAction->>ServerAction: revalidatePath('/clients')
            ServerAction-->>ClientPage: Success

            ClientPage->>ClientPage: Refresh client list
            ClientPage->>User: Show Success Toast<br/>Close Dialog
            User->>Browser: See New Client in List
        end
    end
\`\`\`

---

## Authentication Flow Diagram

\`\`\`mermaid
sequenceDiagram
    actor User
    participant Browser
    participant LoginPage as Login Page
    participant NextAuth as NextAuth.js
    participant Prisma
    participant DB as PostgreSQL<br/>(Users Table)

    User->>Browser: Navigate to app
    Browser->>LoginPage: Middleware redirects to /login

    User->>LoginPage: Enter email & password
    User->>LoginPage: Click "Sign In"

    LoginPage->>NextAuth: signIn("credentials", {email, password})

    NextAuth->>Prisma: findUnique(email)
    Prisma->>DB: SELECT * FROM users WHERE email = ?
    DB-->>Prisma: Return user record
    Prisma-->>NextAuth: User object (with hashed password)

    NextAuth->>NextAuth: bcrypt.compare()<br/>(Compare plain password<br/>with hashed password)

    alt Password Invalid
        NextAuth-->>LoginPage: Error: Invalid credentials
        LoginPage->>User: Show error message
    else Password Valid
        NextAuth->>NextAuth: Generate JWT Token<br/>(Include userId in token)
        NextAuth->>Browser: Set Cookie<br/>(next-auth.session-token)
        NextAuth-->>LoginPage: Success

        LoginPage->>Browser: Redirect to "/"
        Browser->>User: Show Home Page<br/>(User is logged in!)
    end
\`\`\`

---

## Database Schema Relationships

\`\`\`mermaid
erDiagram
    USER ||--o{ CLIENT : "owns"
    USER ||--o{ PET : "manages"
    USER ||--o{ APPOINTMENT : "schedules"
    USER ||--o{ SERVICE : "offers"
    USER ||--|| SETTINGS : "has"
    USER ||--o{ ACCOUNT : "has"
    USER ||--o{ SESSION : "has"

    CLIENT ||--o{ PET : "owns"
    PET ||--o{ APPOINTMENT : "booked for"

    USER {
        string id PK
        string email UK
        string password
        string name
        datetime createdAt
    }

    CLIENT {
        string id PK
        string firstName
        string lastName
        string email
        string phone
        string userId FK
        datetime createdAt
    }

    PET {
        string id PK
        string name
        string breed
        string species
        int age
        string notes
        string clientId FK
        string userId FK
        datetime createdAt
    }

    APPOINTMENT {
        string id PK
        datetime date
        int duration
        string service
        string notes
        string status
        string petId FK
        string userId FK
        datetime createdAt
    }

    SERVICE {
        string id PK
        string name
        int duration
        float price
        string description
        boolean isActive
        int sortOrder
        string userId FK
        datetime createdAt
    }

    SETTINGS {
        string id PK
        string businessName
        string businessEmail
        string businessPhone
        int defaultDuration
        string openTime
        string closeTime
        string daysOpen
        string userId FK
        datetime createdAt
    }

    ACCOUNT {
        string id PK
        string userId FK
        string type
        string provider
        string providerAccountId
    }

    SESSION {
        string id PK
        string sessionToken UK
        string userId FK
        datetime expires
    }
\`\`\`

---

## Technology Stack Overview

\`\`\`mermaid
mindmap
  root((GroomIQ<br/>Tech Stack))
    Frontend
      React 19
      Next.js 16
      TypeScript
      Tailwind CSS
      Shadcn UI
      Radix UI
      Lucide Icons
    Backend
      Next.js Server
      Server Actions
      API Routes
      NextAuth.js v5
      bcryptjs
    Data
      Prisma ORM
      PostgreSQL
      Zod Validation
    Forms
      React Hook Form
      Zod Resolvers
    Utilities
      date-fns
      sonner toasts
      clsx
    Deployment
      Vercel
      Railway
      Render
\`\`\`

---

## Component Hierarchy

\`\`\`mermaid
graph TD
    RootLayout[Root Layout<br/>globals.css, Toaster]

    RootLayout --> Sidebar[Sidebar Component<br/>Navigation + Sign Out]
    RootLayout --> AuthPages[Auth Pages Layout<br/>No Sidebar]
    RootLayout --> AppPages[App Pages Layout<br/>With Sidebar]

    AuthPages --> Login[Login Page<br/>Login Form]
    AuthPages --> Signup[Signup Page<br/>Signup Form]

    AppPages --> Home[Home Page<br/>Calendar + Appointments]
    AppPages --> Clients[Clients Page<br/>Client List + Forms]
    AppPages --> Pets[Pets Page<br/>Pet List + Forms]
    AppPages --> Schedule[Schedule Page<br/>Appointment Calendar]
    AppPages --> Settings[Settings Page<br/>Services + Business Info]

    Clients --> ClientForm[Client Form<br/>Create/Edit Client]
    Clients --> ClientDetail[Client Detail<br/>View Single Client]

    Pets --> PetForm[Pet Form<br/>Create/Edit Pet]
    Pets --> PetDetail[Pet Detail<br/>View Single Pet]

    Home --> AppointmentForm[Appointment Form<br/>Schedule Appointment]

    Settings --> ServiceForm[Service Form<br/>Manage Services]
    Settings --> SettingsForm[Settings Form<br/>Business Config]

    ClientForm -.->|Uses| UIComponents[UI Components<br/>Button, Input<br/>Dialog, Label]
    PetForm -.->|Uses| UIComponents
    AppointmentForm -.->|Uses| UIComponents
    ServiceForm -.->|Uses| UIComponents
\`\`\`

---

## Request/Response Flow: Complete Journey

\`\`\`mermaid
flowchart TD
    Start([User Loads App]) --> Browser[Browser Sends<br/>GET Request]
    Browser --> Middleware{Middleware<br/>Check Auth}

    Middleware -->|No Session| RedirectLogin[Redirect to /login]
    Middleware -->|Has Session| RenderPage[Render Page]

    RedirectLogin --> LoginPage[Show Login Page]
    LoginPage --> UserLogin[User Enters Credentials]
    UserLogin --> AuthCheck{Valid<br/>Credentials?}
    AuthCheck -->|No| ShowError[Show Error]
    AuthCheck -->|Yes| CreateSession[Create JWT Session]
    CreateSession --> RenderPage

    RenderPage --> FetchData[Server Component<br/>Calls Server Actions]
    FetchData --> CheckAuth{User<br/>Authenticated?}
    CheckAuth -->|No| ReturnEmpty[Return Empty Array]
    CheckAuth -->|Yes| QueryDB[Prisma Queries DB<br/>WHERE userId = current_user]

    QueryDB --> ReturnData[Return Data to Page]
    ReturnData --> DisplayUI[Render UI with Data]
    DisplayUI --> UserInteracts[User Sees Page]

    UserInteracts --> UserAction{User Action?}
    UserAction -->|Click Button| OpenForm[Open Form Dialog]
    UserAction -->|Fill Form| ValidateClient[Client-Side Validation<br/>with Zod]
    ValidateClient -->|Invalid| ShowFormError[Show Validation Errors]
    ValidateClient -->|Valid| CallServerAction[Call Server Action]

    CallServerAction --> ValidateServer[Server-Side Validation<br/>with Zod + Auth Check]
    ValidateServer -->|Invalid| ReturnError[Return Error]
    ValidateServer -->|Valid| ExecuteDB[Prisma Executes<br/>INSERT/UPDATE/DELETE]

    ExecuteDB --> Revalidate[revalidatePath<br/>Invalidate Cache]
    Revalidate --> RefreshUI[UI Auto-Refreshes<br/>with New Data]
    RefreshUI --> ShowToast[Show Success Toast]
    ShowToast --> End([User Sees Updated Data])

    ReturnError --> ShowToastError[Show Error Toast]
    ShowFormError --> End
    ReturnEmpty --> DisplayEmpty[Show Empty State]
    DisplayEmpty --> End
\`\`\`

---

## How to Use These Diagrams in Your Video

### For Your 2-3 Minute Walkthrough:

**Introduction (15-20 seconds):**
- Screen share the "Complete System Architecture Diagram"
- Say: "GroomIQ is a pet grooming CRM with a full-stack architecture"

**Architecture Overview (30-40 seconds):**
- Point to the three main layers in the first diagram:
  1. Frontend (blue) - React pages and components
  2. Backend (green) - Server Actions and authentication
  3. Data Layer (orange) - Prisma ORM and PostgreSQL

**Data Flow Example (60-80 seconds):**
- Show the "Creating a New Client" sequence diagram
- Walk through each step:
  1. "User fills out a form in the browser"
  2. "Form calls a Server Action on the backend"
  3. "Server Action authenticates the user with NextAuth"
  4. "Server Action validates the data with Zod"
  5. "Prisma translates the request to SQL"
  6. "PostgreSQL stores the data"
  7. "Page automatically refreshes with the new client"

**Key Insights (20-30 seconds):**
- "Every data operation filters by userId - this ensures data isolation"
- "The middleware protects all routes - unauthenticated users can't access the app"
- "Server Actions keep backend logic separate from UI code"

---

## Exporting the Diagram

To get a PNG/PDF for your video:

1. Go to https://mermaid.live
2. Copy the code from the "Complete System Architecture Diagram" section above
3. Paste it in the editor
4. Click the "Actions" menu → "Download PNG" or "Download SVG"
5. Use the image in your screen recording

**Alternative:** Take a screenshot of the rendered diagram in VS Code or GitHub.
