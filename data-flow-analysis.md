# Data Flow Analysis - GroomIQ

## Overview

This document traces how data moves through your application from the moment a user interacts with the UI to when data is stored in the database and displayed back. We'll follow real user actions step-by-step with specific file names and function names.

---

## 1. What Happens When a User First Loads the App?

### Step-by-Step: Initial Page Load at `http://localhost:3000`

**Step 1: Browser Request**
```
User types URL → Browser sends GET request to http://localhost:3000/
```

**Step 2: Middleware Intercepts Request**
- **File:** `/src/middleware.ts`
- **Function:** `auth()` (default export)
- **What happens:**
  ```typescript
  export default auth((req) => {
    const isAuthenticated = !!req.auth;  // Check if user has valid session
    const isAuthPage = req.nextUrl.pathname.startsWith("/login") ||
                       req.nextUrl.pathname.startsWith("/signup");

    // If not authenticated and trying to access protected page → redirect to login
    if (!isAuthenticated && !isAuthPage) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  })
  ```
- **Result:** Unauthenticated users are redirected to `/login`

**Step 3: If User is Authenticated → Render Homepage**
- **File:** `/src/app/page.tsx`
- **Component:** `Home()`
- **What happens:**
  1. Next.js server-side renders the page
  2. Calls `getAppointments()` to fetch appointment data
  3. Calls `getPets()` to fetch pets for the appointment form

**Step 4: Fetch Appointments**
- **File:** `/src/app/actions/appointments.ts`
- **Function:** `getAppointments()`
  ```typescript
  export async function getAppointments() {
    const session = await auth();  // Get current user's session
    if (!session?.user?.id) {
      return [];  // No user = no data
    }

    return await prisma.appointment.findMany({
      where: { userId: session.user.id },  // ONLY this user's appointments
      orderBy: { date: "asc" },
      include: {
        pet: {
          include: { client: true }  // Also get pet and client info
        }
      }
    });
  }
  ```
- **Database Query:** Prisma translates to SQL:
  ```sql
  SELECT * FROM appointments
  WHERE userId = 'current-user-id'
  ORDER BY date ASC
  JOIN pets ON appointments.petId = pets.id
  JOIN clients ON pets.clientId = clients.id
  ```

**Step 5: Render Page with Data**
- **File:** `/src/app/page.tsx`
- **What renders:**
  - `/src/components/sidebar.tsx` - Left navigation
  - Appointment calendar/list with all appointments
  - Forms to create new appointments

**Step 6: Browser Receives HTML + JavaScript**
```
Server → Sends rendered HTML
       → Browser displays page
       → React hydrates (makes page interactive)
```

**Total Time:** ~500-800ms for authenticated users, instant redirect for unauthenticated

---

## 2. What Happens When a User Creates a New Client?

Let's trace the **FULL data flow** when a user clicks "Add Client" and submits the form.

### Step-by-Step: Creating a New Client

**Step 1: User Clicks "Add Client" Button**
- **File:** `/src/app/clients/page.tsx`
- **Component:** `ClientsPage`
- **Action:** Opens a Dialog (modal popup)
  ```typescript
  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
    <DialogContent>
      <ClientForm onSuccess={() => setCreateOpen(false)} />
    </DialogContent>
  </Dialog>
  ```

**Step 2: User Fills Out Form**
- **File:** `/src/app/clients/page.tsx` (ClientForm component inline)
- **Fields:** First Name, Last Name, Email, Phone
- **Form Library:** React Hook Form + Zod validation
  ```typescript
  const form = useForm({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    }
  });
  ```

**Step 3: User Clicks "Create Client"**
- **Trigger:** `onSubmit()` function
  ```typescript
  async function onSubmit(values: z.infer<typeof clientSchema>) {
    try {
      const formData = new FormData();
      formData.append("firstName", values.firstName);
      formData.append("lastName", values.lastName);
      formData.append("email", values.email || "");
      formData.append("phone", values.phone || "");

      await createClient(formData);  // Call Server Action

      toast.success("Client created");
      onSuccess();
    } catch (error) {
      toast.error(error.message);
    }
  }
  ```

**Step 4: Server Action Receives Request**
- **File:** `/src/app/actions/clients.ts`
- **Function:** `createClient(formData: FormData)`
- **Server:** This code runs on the server, NOT in browser
  ```typescript
  export async function createClient(formData: FormData) {
    try {
      // 1. Authenticate
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }
      const userId = session.user.id;

      // 2. Extract form data
      const rawData = {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email") || "",
        phone: formData.get("phone") || "",
      };

      // 3. Validate with Zod
      const validated = clientSchema.parse(rawData);

      // 4. Check for duplicates
      const existing = await prisma.client.findFirst({
        where: {
          userId,
          OR: [
            validated.email ? { email: validated.email } : {},
            validated.phone ? { phone: validated.phone } : {},
          ].filter((condition) => Object.keys(condition).length > 0),
        },
      });

      if (existing) {
        if (existing.email === validated.email && validated.email) {
          throw new Error("A client with this email already exists");
        }
        if (existing.phone === validated.phone && validated.phone) {
          throw new Error("A client with this phone number already exists");
        }
      }

      // 5. Create in database
      await prisma.client.create({
        data: {
          firstName: validated.firstName,
          lastName: validated.lastName,
          email: validated.email,
          phone: validated.phone,
          userId,  // CRITICAL: Associates with current user
        },
      });

      // 6. Revalidate cache
      revalidatePath("/clients", "layout");

      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(error.issues[0].message);
      }
      throw error;
    }
  }
  ```

**Step 5: Prisma Executes Database Query**
- **File:** Prisma Client (auto-generated)
- **SQL Query:**
  ```sql
  INSERT INTO clients (id, firstName, lastName, email, phone, userId, createdAt, updatedAt)
  VALUES (
    'clx123abc456',           -- Auto-generated ID
    'John',                   -- firstName
    'Doe',                    -- lastName
    'john@example.com',       -- email
    '555-1234',               -- phone
    'user-session-id',        -- userId (current logged-in user)
    '2025-11-21T04:00:00Z',  -- createdAt
    '2025-11-21T04:00:00Z'   -- updatedAt
  );
  ```

**Step 6: Database Confirms Insert**
```
PostgreSQL → Returns success
Prisma → Confirms to Server Action
Server Action → Returns { success: true }
```

**Step 7: Frontend Receives Response**
- **File:** `/src/app/clients/page.tsx`
- **What happens:**
  ```typescript
  await createClient(formData);  // Resolves successfully
  toast.success("Client created");  // Show success message
  onSuccess();  // Close dialog
  ```

**Step 8: Page Automatically Refreshes**
- **Trigger:** `revalidatePath("/clients", "layout")`
- **What happens:** Next.js re-fetches `getClients()` in the background
- **File:** `/src/app/actions/clients.ts`
  ```typescript
  export async function getClients(page: number = 1, itemsPerPage: number = 20) {
    const session = await auth();
    if (!session?.user?.id) {
      return { clients: [], total: 0, page, itemsPerPage, totalPages: 0 };
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where: { userId: session.user.id },
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
        orderBy: { createdAt: "desc" },
        include: { pets: true },
      }),
      prisma.client.count({
        where: { userId: session.user.id },
      }),
    ]);

    return { clients, total, page, itemsPerPage, totalPages: Math.ceil(total / itemsPerPage) };
  }
  ```

**Step 9: UI Updates with New Client**
- New client appears in the list
- Total count updates
- Dialog closes

**Total Time:** ~200-500ms from button click to seeing new client

---

## 3. Where Does User Authentication Happen?

### Authentication Flow: Login Process

**Step 1: User Visits `/login`**
- **File:** `/src/app/login/page.tsx`
- **Component:** `LoginPage` (client component)
- **Renders:** Email/password form + demo credentials

**Step 2: User Submits Credentials**
- **File:** `/src/app/login/page.tsx`
- **Function:** `handleSubmit()`
  ```typescript
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,  // Don't auto-redirect, handle manually
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");  // Redirect to home
        router.refresh();  // Refresh to get new session
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  ```

**Step 3: NextAuth Processes Login**
- **File:** `/src/auth.ts`
- **Provider:** Credentials
  ```typescript
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 1. Find user in database
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;  // User doesn't exist
        }

        // 2. Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          return null;  // Wrong password
        }

        // 3. Return user object (creates session)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      }
    })
  ]
  ```

**Step 4: Database Query for User**
```sql
SELECT * FROM users WHERE email = 'demo@groomiq.com' LIMIT 1;
```

**Step 5: Password Verification**
- **Library:** bcryptjs
- **Process:**
  ```javascript
  const isPasswordValid = await bcrypt.compare(
    "demo1234",                        // Plain text password from form
    "$2a$10$xyzHashedPasswordHash"     // Hashed password from database
  );
  // Returns true or false
  ```

**Step 6: Create Session (JWT)**
- **File:** `/src/auth.ts`
- **Callbacks:**
  ```typescript
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;  // Add user ID to JWT token
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;  // Add user ID to session
      }
      return session;
    }
  }
  ```
- **Result:** Encrypted JWT token stored in cookie
  ```
  Set-Cookie: next-auth.session-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...;
  ```

**Step 7: Redirect to Home**
- Middleware sees valid session
- Allows access to `/`
- User is logged in!

---

## 4. Where Does Payment Processing Happen?

**Current Status:** Payment processing (Stripe) is NOT yet implemented in this version.

**Placeholder for Future Implementation:**
- Would add `/src/app/api/stripe/checkout/route.ts` - Create Stripe checkout session
- Would add `/src/app/api/stripe/webhook/route.ts` - Handle payment confirmations
- Would add `subscriptions` table to Prisma schema

---

## 5. What Data is Stored in the Database?

### Database Tables (from `/prisma/schema.prisma`)

**User Table** - Stores groomer accounts
```prisma
model User {
  id       String   @id @default(cuid())
  email    String   @unique
  password String?
  name     String?
  clients  Client[]
  pets     Pet[]
  appointments Appointment[]
  services Service[]
  settings Settings?
  accounts Account[]
  sessions Session[]
}
```
**Why:** One account per groomer. Each groomer sees only their data.

---

**Client Table** - Stores pet owners
```prisma
model Client {
  id        String   @id @default(cuid())
  firstName String
  lastName  String
  email     String?
  phone     String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  pets      Pet[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
**Why:** Track pet owners (customers). Each client belongs to one groomer.

---

**Pet Table** - Stores pets
```prisma
model Pet {
  id        String   @id @default(cuid())
  name      String
  breed     String?
  species   String   // "dog", "cat", "other"
  age       Int?
  notes     String?
  clientId  String
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  appointments Appointment[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
**Why:** Track individual pets. Multiple pets can belong to one client.

---

**Appointment Table** - Stores scheduled grooming appointments
```prisma
model Appointment {
  id       String   @id @default(cuid())
  date     DateTime
  duration Int      @default(60)  // minutes
  service  String?
  notes    String?
  status   String   @default("scheduled")  // "scheduled", "completed", "cancelled"
  petId    String
  pet      Pet      @relation(fields: [petId], references: [id], onDelete: Cascade)
  userId   String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
**Why:** Track when pets are coming in for grooming. Prevents double-booking.

---

**Service Table** - Stores service offerings
```prisma
model Service {
  id          String   @id @default(cuid())
  name        String
  duration    Int      @default(60)  // minutes
  price       Float?
  description String?
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```
**Why:** Define what services are offered (Full Groom, Bath & Brush, etc.)

---

**Settings Table** - Stores business configuration
```prisma
model Settings {
  id            String  @id @default(cuid())
  businessName  String  @default("")
  businessEmail String  @default("")
  businessPhone String  @default("")
  defaultDuration Int   @default(60)
  openTime      String  @default("09:00")
  closeTime     String  @default("17:00")
  daysOpen      String  @default("1,2,3,4,5")  // 0=Sun, 1=Mon, etc.
  userId        String  @unique
  user          User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```
**Why:** Configure business hours, contact info, default appointment length.

---

## Summary: The Complete Data Journey

```
User in Browser
    ↓
[1] Clicks button in UI (/src/app/*/page.tsx)
    ↓
[2] Calls Server Action (/src/app/actions/*.ts)
    ↓
[3] Server Action authenticates user (NextAuth)
    ↓
[4] Server Action validates input (Zod schemas)
    ↓
[5] Server Action queries database (Prisma)
    ↓
[6] Prisma translates to SQL
    ↓
[7] PostgreSQL database executes query
    ↓
[8] Database returns results
    ↓
[9] Prisma converts to JavaScript objects
    ↓
[10] Server Action returns data
    ↓
[11] Next.js revalidates page cache
    ↓
[12] UI automatically updates with new data
    ↓
User sees updated information!
```

**Key Insight:** Every data operation goes through authentication and userId filtering. This ensures complete data isolation - each groomer only sees their own clients, pets, and appointments.
