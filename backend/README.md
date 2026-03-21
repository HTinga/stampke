# Tomo Backend

Express + MongoDB REST API for Tomo — authentication, client CRM, invoicing, jobs/workers.

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database | MongoDB Atlas (free M0 tier works) |
| Auth | JWT + bcrypt + Google Identity Services |
| Email | Resend (free 3k emails/month) |
| Deployment | Railway / Render / Fly.io (all free tiers) |

---

## Quick Start (local)

```bash
cd backend
cp .env.example .env      # fill in your values
npm install
npm run dev               # starts on port 4000
```

---

## Environment Variables

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → Connect → Drivers |
| `JWT_SECRET` | Any long random string (e.g. `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) → APIs → Credentials → OAuth 2.0 Client |
| `GOOGLE_CLIENT_SECRET` | Same as above |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `ADMIN_EMAIL` | `hempstonetinga@gmail.com` (auto-activated as admin on first signup) |
| `FRONTEND_URL` | Your Vercel URL e.g. `https://stampke.vercel.app` |

---

## MongoDB Atlas Setup (5 minutes)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Create free account
2. Create a **free M0 cluster** (512MB, plenty for Tomo)
3. Database Access → Add user (username + password)
4. Network Access → Allow `0.0.0.0/0` (all IPs) for deployment
5. Connect → Drivers → copy the connection string into `MONGODB_URI`

---

## Google OAuth Setup (10 minutes)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID → Web application
4. Authorised JavaScript origins: `https://your-vercel-url.vercel.app`
5. Authorised redirect URIs: `https://your-vercel-url.vercel.app`
6. Copy Client ID → `VITE_GOOGLE_CLIENT_ID` in frontend `.env`
7. Copy Client ID + Secret → backend `.env`

---

## Deploy to Railway (recommended, free)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login and init
railway login
cd backend
railway init

# 3. Set environment variables
railway variables set MONGODB_URI="..." JWT_SECRET="..." GOOGLE_CLIENT_ID="..." ...

# 4. Deploy
railway up
```

Railway gives you a URL like `https://tomo-backend.railway.app`.
Put that in your Vercel frontend env as `VITE_API_URL`.

---

## Frontend Environment Variables (Vercel)

Add these in Vercel → Project Settings → Environment Variables:

```
VITE_API_URL=https://your-railway-backend.railway.app
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## API Endpoints

### Auth
```
POST /api/auth/register        body: { name, email, password, role }
POST /api/auth/login           body: { email, password }
POST /api/auth/google          body: { idToken }  ← from Google Identity Services
GET  /api/auth/me              🔒 Bearer token
PATCH /api/auth/me             🔒 Bearer token
```

### Admin (🔒 admin role required)
```
GET    /api/admin/users
PATCH  /api/admin/users/:id/activate
PATCH  /api/admin/users/:id/suspend
DELETE /api/admin/users/:id
GET    /api/admin/workers
PATCH  /api/admin/workers/:id/approve
PATCH  /api/admin/workers/:id/suspend
PATCH  /api/admin/workers/:id/rate
```

### Clients (🔒 active users)
```
GET    /api/clients            ?search= &status= &source= &page= &limit=
POST   /api/clients
GET    /api/clients/:id
PATCH  /api/clients/:id
DELETE /api/clients/:id
GET    /api/clients/summary
```

### Invoices (🔒 active users)
```
GET    /api/invoices           ?status= &search= &page=
POST   /api/invoices
GET    /api/invoices/:id
PATCH  /api/invoices/:id
PATCH  /api/invoices/:id/paid
POST   /api/invoices/:id/remind
DELETE /api/invoices/:id
GET    /api/invoices/summary
```

### Workers
```
GET  /api/workers              ?category= &jobType= &shortNotice= &search=
GET  /api/workers/me           🔒
POST /api/workers/me           🔒 (create/update own profile)
```

### Jobs (🔒 active users)
```
GET    /api/jobs               ?category= &type= &search=
GET    /api/jobs/mine          🔒
POST   /api/jobs               🔒
GET    /api/jobs/:id
PATCH  /api/jobs/:id           🔒
DELETE /api/jobs/:id           🔒
POST   /api/jobs/:id/apply     🔒
PATCH  /api/jobs/:id/applicant 🔒 body: { applicantId, status }
```

---

## Activation Flow

```
User signs up (Google or email)
    ↓
Status = "pending"
    ↓
Email sent to hempstonetinga@gmail.com
    ↓
Admin logs in → Settings → Admin Panel → Users tab → Activate
    ↓
User gets email: "Your account is now active"
    ↓
User can now fully use the platform
```

**Exception:** `hempstonetinga@gmail.com` auto-activates as admin on first signup.
Demo accounts (`admin@tomo.ke`, `recruiter@demo.ke`, `worker@demo.ke`) always work offline.

---

## Health Check

```
GET /api/health
→ { "status": "ok", "ts": "2026-03-21T..." }
```
