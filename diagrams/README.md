# GroomIQ Architecture Diagrams

## 📊 Main Diagram (Use This!)

### **groomiq-architecture-complete.png** (204 KB)

**The one diagram that shows everything:**
- ✅ Frontend, Backend, Database layers
- ✅ Auth flow (Middleware → NextAuth → JWT)
- ✅ Payment flow (Stripe checkout + webhooks)
- ✅ Database schema (4 main tables + relationships)
- ✅ Tech stack (Next.js, React, Prisma, Stripe)
- ✅ Key features (Free vs Pro plans)

**Use this for:**
- Technical interviews
- Portfolio/resume
- Investor presentations
- Documentation
- README files

---

## 📁 Detailed Diagrams (Optional - For Deep Dives)

These break down specific aspects if you need more detail:

| Diagram | Size | Use When |
|---------|------|----------|
| `01-system-architecture.png` | 181 KB | Need complete system overview |
| `02-authentication-flow.png` | 161 KB | Explaining login/security |
| `03-payment-subscription-flow.png` | 149 KB | Showing Stripe integration |
| `04-client-creation-flow.png` | 117 KB | Demonstrating business logic |
| `05-database-schema.png` | 249 KB | ERD with all 8 tables |
| `06-technology-stack.png` | 150 KB | Full tech stack landscape |
| `07-request-response-flow.png` | 190 KB | Complete request journey |
| `08-deployment-architecture.png` | 121 KB | CI/CD and deployment |

---

## 🎯 Quick Reference

### Interview Question → Which Diagram?

**"Walk me through your architecture"**
→ Use: `groomiq-architecture-complete.png`

**"How do you handle authentication?"**
→ Use: `02-authentication-flow.png`

**"Explain your payment system"**
→ Use: `03-payment-subscription-flow.png`

**"What's your data model?"**
→ Use: `05-database-schema.png`

**"How do you deploy?"**
→ Use: `08-deployment-architecture.png`

**"Trace a request through your app"**
→ Use: `07-request-response-flow.png`

---

## 💡 Pro Tips

1. **For presentations:** Use the complete diagram + 1-2 detailed ones
2. **For README:** Embed the complete diagram
3. **For interviews:** Have the complete diagram open, reference detailed ones as needed
4. **For documentation:** Use all 8 to create comprehensive docs

---

## 🚀 Key Features to Highlight

When presenting these diagrams, emphasize:

✅ **Modern Stack:** Next.js 16 App Router, React 19, TypeScript  
✅ **Type Safety:** Prisma ORM with full TypeScript integration  
✅ **Serverless:** Auto-scaling on Vercel  
✅ **Security:** NextAuth.js with JWT, bcrypt password hashing  
✅ **Payments:** Stripe subscription management  
✅ **Monetization:** Freemium model (10 free clients, $10/mo Pro)  
✅ **Database:** PostgreSQL with proper relationships  
✅ **DevOps:** Automated CI/CD via Vercel  

---

**Files generated:** December 3, 2025  
**Total diagrams:** 9 (1 complete + 8 detailed)  
**Total size:** ~1.5 MB  
**Format:** PNG with transparent backgrounds
