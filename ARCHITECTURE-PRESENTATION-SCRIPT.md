# GroomIQ Architecture Walkthrough Script

**Duration:** 3-5 minutes  
**Diagram:** `groomiq-architecture-complete.png`  
**Tone:** Professional, confident, technical

---

## Opening (15 seconds)

"Let me walk you through GroomIQ's architecture. GroomIQ is a full-stack SaaS application for pet grooming businesses. It's built as a modern serverless application using Next.js 16, deployed on Vercel, with a freemium business model powered by Stripe subscriptions."

**[Point to the complete diagram]**

---

## Layer 1: Frontend (30 seconds)

"Starting at the top with the **frontend layer**, users interact with the application through a React 19 interface built with Next.js 16's App Router. We're using Server Components wherever possible to reduce the JavaScript bundle size sent to the browser - this gives us about 40% less client-side JavaScript compared to traditional React apps."

"The UI is built with TailwindCSS and Shadcn UI components for consistency and accessibility. Users can manage clients, pets, appointments, and view their schedule on a calendar interface."

**[Gesture to Frontend Layer box]**

---

## Layer 2: Security & Middleware (45 seconds)

"Before any request reaches our application logic, it passes through **middleware** for authentication. This is Next.js middleware that runs on every request."

"Here's the flow: When a user tries to access any protected page, the middleware checks for a valid session cookie. If there's no session, they're immediately redirected to the login page. This happens at the edge, before the page even renders, which is much more efficient than client-side route protection."

"For authentication itself, we're using **NextAuth.js version 5** with a JWT strategy. Passwords are hashed with bcrypt - 10 rounds - and we store minimal data in the JWT to keep it lightweight. The JWT strategy means our auth is stateless and horizontally scalable."

**[Point to Middleware and Auth boxes]**

---

## Layer 3: Business Logic (1 minute)

"In the **backend logic layer**, we have two main components: Server Actions and our Stripe integration."

"**Server Actions** are a Next.js feature that lets us write server-side functions that can be called directly from React components. Think of them as RPC - Remote Procedure Calls. They handle all our CRUD operations for clients, pets, appointments, and services."

"Here's what makes this interesting: before creating a new client, our Server Actions check the user's subscription plan. Free users are limited to 10 clients, while Pro users at $10 per month get unlimited clients. This enforcement happens server-side, so it can't be bypassed."

"For **payment processing**, we integrate with Stripe. When a user clicks 'Upgrade to Pro', we create a Stripe Checkout Session and redirect them to Stripe's hosted checkout page. This keeps us out of PCI compliance scope because we never touch credit card data."

"When a payment completes, Stripe sends a webhook to our `/api/stripe/webhook` endpoint. We verify the webhook signature for security, then update the user's subscription status in our database. The webhook also handles subscription renewals, cancellations, and payment failures."

**[Point to Server Actions and Stripe API boxes]**

---

## Layer 4: Data Layer (45 seconds)

"For the **data layer**, we're using **Prisma ORM** with PostgreSQL hosted on Supabase."

"Prisma gives us full TypeScript type safety - our database schema is defined in a Prisma schema file, and Prisma generates a type-safe client. This means we get autocomplete for all our queries and catch database errors at compile time, not runtime."

"The database has four main tables:"
- **User table** - stores authentication data plus Stripe fields like `stripeCustomerId`, `subscriptionStatus`, and `plan`
- **Client table** - pet owners, linked to users
- **Pet table** - individual pets, linked to both clients and users for multi-tenancy
- **Appointment table** - scheduled grooming sessions

"The relationships follow standard normalization: Users own Clients, Clients own Pets, and Pets have Appointments. Every table has a `userId` foreign key for proper data isolation between different grooming businesses."

**[Point to Database section and trace relationships]**

---

## Layer 5: Infrastructure (30 seconds)

"For **infrastructure**, we're fully serverless on Vercel. When I push to GitHub, Vercel automatically runs our build pipeline: installs dependencies, generates the Prisma client, builds the Next.js app, and deploys it to their edge network."

"Each API route and Server Action becomes its own serverless function that auto-scales based on traffic. Static assets get cached on Vercel's CDN globally."

"For the database, Supabase provides managed PostgreSQL with connection pooling, which is critical for serverless since each function invocation would otherwise create a new database connection."

**[Point to Vercel box]**

---

## Key Technical Decisions (45 seconds)

"Let me highlight a few key architectural decisions we made:"

**1. Next.js App Router over Pages Router**
"We chose the App Router for Server Components, which reduce client-side JavaScript and improve performance. Server Components can directly query the database securely without exposing API endpoints."

**2. JWT over database sessions**
"JWTs make our authentication stateless and scalable. We don't need session storage or sticky sessions."

**3. Stripe Checkout over custom payment forms**
"Using Stripe's hosted checkout keeps us out of PCI compliance scope and gives users a trusted, familiar payment experience."

**4. Prisma over raw SQL**
"Type safety catches bugs at build time. Prisma also handles connection pooling automatically, which is crucial in serverless environments."

**5. Server-side enforcement of plan limits**
"Business logic like subscription limits lives on the server where it can't be bypassed with browser dev tools."

---

## Performance & Scalability (30 seconds)

"From a **performance perspective**:"

- Server Components reduce initial page load by about 40%
- Edge middleware authentication happens in under 10ms
- Database queries use Prisma's connection pooling
- All static assets are CDN-cached globally
- Serverless functions auto-scale to handle traffic spikes

"The architecture is **horizontally scalable** by default because of serverless functions and stateless JWT auth. If we get a sudden spike in traffic, Vercel automatically spins up more function instances."

---

## Security Features (30 seconds)

"On the **security side**:"

- ✅ Authentication on every request via middleware
- ✅ Bcrypt password hashing (10 rounds)
- ✅ JWT tokens with short expiration
- ✅ CSRF protection built into NextAuth
- ✅ SQL injection prevention through Prisma's parameterized queries
- ✅ Stripe webhook signature verification
- ✅ All secrets in environment variables, never in code
- ✅ HTTPS only in production

"Data isolation is enforced through `userId` foreign keys on every query, so users from different grooming businesses can never see each other's data."

---

## Business Model Integration (20 seconds)

"The architecture directly supports our **freemium business model**. Free users can test the product with up to 10 clients. When they hit that limit, they see an error message prompting them to upgrade. One click takes them to Stripe checkout, and after payment, webhooks automatically update their account to Pro with unlimited clients."

---

## Closing (15 seconds)

"So in summary: we have a modern, serverless, full-stack application with strong type safety, good security practices, and a built-in monetization strategy. The entire stack is designed to be developer-friendly while remaining scalable and performant."

**[Pause for questions]**

---

## Common Follow-Up Questions & Answers

### Q: "Why Next.js instead of separate frontend/backend?"

**A:** "Great question. Next.js gives us a single codebase for frontend and backend, which improves developer velocity. Server Components let us fetch data on the server without creating separate API endpoints. We still have API routes where we need them - like Stripe webhooks - but for most operations, Server Actions eliminate the need for a REST API layer. This reduces boilerplate and keeps related code together."

---

### Q: "How do you handle database migrations in production?"

**A:** "Prisma handles this really well. We run `prisma migrate` locally during development, which creates migration files. These migration files are version-controlled in Git. When we deploy to production, the build process runs `prisma migrate deploy` which applies any pending migrations automatically. We also have a separate `DIRECT_URL` environment variable that bypasses Supabase's connection pooler for migrations, which require a direct connection."

---

### Q: "What happens if Stripe is down?"

**A:** "If Stripe's API is down when a user tries to upgrade, they'll get a user-friendly error message and can try again later. Their free plan continues to work normally. If Stripe webhooks are delayed - which happens occasionally - our database might be temporarily out of sync, but Stripe will retry webhooks with exponential backoff. We also have a manual sync option where users can click 'Refresh Subscription Status' which queries Stripe's API directly to get the latest state."

---

### Q: "How do you prevent users from bypassing the 10-client limit?"

**A:** "The limit is enforced server-side in the `createClient` Server Action. Before inserting a new client into the database, we:

1. Query the user's current plan and client count
2. Call a `canAddClient()` helper function that checks if they're under the limit
3. If they're at the limit, we throw an error before the database insert

Since this happens on the server, users can't bypass it with browser dev tools or API manipulation. Even if someone crafted a direct API request, it would still hit the same server-side validation."

---

### Q: "Tell me about your testing strategy."

**A:** "We have a multi-layered testing approach:

- **Type safety**: TypeScript + Prisma catches type errors at compile time
- **Unit tests**: For business logic like the `canAddClient()` function
- **Integration tests**: For Server Actions using a test database
- **End-to-end tests**: Playwright tests for critical user flows like signup and client creation
- **Manual testing**: Stripe has a test mode with test credit cards (4242 4242 4242 4242)

For Stripe specifically, we test webhooks locally using the Stripe CLI's webhook forwarding feature."

---

### Q: "How much does this cost to run?"

**A:** "The infrastructure costs are very low:

- **Development**: $0 (all free tiers)
  - Vercel: Free tier (hobby plan)
  - Supabase: Free tier (500MB database)
  - Stripe: No monthly fee, just transaction fees (2.9% + $0.30)

- **Production** (estimated at 100 users):
  - Vercel Pro: $20/month (for team features + more bandwidth)
  - Supabase Pro: $25/month (better connection pooling + backups)
  - Stripe: 2.9% + $0.30 per transaction
  
**Total**: ~$45-50/month base cost, plus transaction fees. At $10/month per Pro subscriber, we break even at about 5-7 Pro users."

---

### Q: "What would you do differently if you started over?"

**A:** "Honestly, I'm pretty happy with the architecture. If I were to change anything:

1. **Add error boundaries** - Right now we rely on Next.js's default error handling, but custom error boundaries would give users better error messages

2. **Implement caching** - We could add React Query or SWR for client-side caching to reduce database queries

3. **Add observability** - Integrate something like Sentry for error tracking and Vercel Analytics for performance monitoring

4. **Database indexes** - While Prisma auto-indexes foreign keys, we could add custom indexes on commonly queried fields like `Client.email`

But these are optimizations, not fundamental issues. The core architecture is solid."

---

## Tips for Delivery

### Body Language:
- ✅ Stand/sit up straight
- ✅ Make eye contact
- ✅ Use hand gestures to point at diagram sections
- ✅ Smile - show enthusiasm for your work

### Pacing:
- ✅ Speak clearly and not too fast
- ✅ Pause between sections
- ✅ Ask "Does that make sense?" after complex sections
- ✅ Watch for confused looks and slow down if needed

### Energy:
- ✅ Start strong with the opening
- ✅ Show excitement when discussing unique features (freemium model, Stripe integration)
- ✅ Be confident about your technical decisions
- ✅ End strong with the summary

### What NOT to Do:
- ❌ Don't apologize ("This is probably confusing...")
- ❌ Don't say "just" ("It's just a simple app...")
- ❌ Don't rush through complex parts
- ❌ Don't read directly from notes
- ❌ Don't get defensive if questioned

---

## Practice Plan

**Day 1:** Read script out loud 5 times  
**Day 2:** Practice pointing at diagram while speaking  
**Day 3:** Record yourself and watch it back  
**Day 4:** Practice answering follow-up questions  
**Day 5:** Do a full mock interview with a friend  

**Target:** Sound natural, not memorized. Know the content so well you can adapt on the fly.

---

## Interview Day Checklist

Before the interview:
- [ ] Have diagram open on your screen
- [ ] Test screen sharing if virtual
- [ ] Have architecture-diagram.md open as backup
- [ ] Water nearby (stay hydrated!)
- [ ] Take 3 deep breaths

During the walkthrough:
- [ ] Share your screen showing the diagram
- [ ] Ask if they can see it clearly
- [ ] Use a pointer/cursor to highlight sections
- [ ] Pause for questions
- [ ] Gauge their interest level and adjust depth

After the walkthrough:
- [ ] Ask "Are there any parts you'd like me to dive deeper into?"
- [ ] Be ready to show actual code if requested
- [ ] Have your localhost ready to demo the app

---

**You've got this! You built something impressive, and you understand it deeply. Now go show them what you know! 🚀**
