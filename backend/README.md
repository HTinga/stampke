# Tomo Backend

Express + MongoDB REST API — authentication, clients, invoices, jobs, workers.

Structured after **[idurar-erp-crm](https://github.com/idurar/idurar-erp-crm)** patterns:
one file per operation, `createCRUDController` factory, `catchErrors` wrapper,
`removed: false` soft-delete, `{ success, result, message }` responses.

---

## Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| Database | MongoDB Atlas (free M0) |
| Auth | JWT + bcrypt + Google Identity Services |
| Email | Resend (free 3k/month) |
| Deploy | Railway / Render / Fly.io (all free tiers) |

---

## Quick Start

```bash
cd backend
cp .env.example .env          # fill in all values
npm install --legacy-peer-deps
npm run setup                 # creates owner account + seeds settings
npm run dev                   # starts on port 4000
```

---

## Environment Variables

| Variable | Where to get it |
|---|---|
| `MONGODB_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → Connect → Drivers |
| `JWT_SECRET` | Run: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) → Credentials |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `OWNER_EMAIL` | `hempstonetinga@gmail.com` — auto-activates as owner |
| `FRONTEND_URL` | Your Vercel URL e.g. `https://stampke.vercel.app` |

---

## Deploy to Railway (free)

```bash
npm install -g @railway/cli
railway login
cd backend
railway init
railway variables set MONGODB_URI="..." JWT_SECRET="..." GOOGLE_CLIENT_ID="..." RESEND_API_KEY="..." OWNER_EMAIL="hempstonetinga@gmail.com" FRONTEND_URL="https://your-app.vercel.app"
railway up
```

You get a URL like `https://tomo-backend.railway.app`.
Add it to Vercel as `VITE_API_URL`.

---

## API Structure

Follows idurar URL convention: `/{entity}/create`, `/{entity}/list`, etc.

### Auth (public — no token)
```
POST /api/login
POST /api/register          body: { name, email, password, role }
POST /api/google            body: { idToken }
POST /api/forgetpassword    body: { email }
POST /api/resetpassword     body: { password, userId, resetToken }
```

### User (🔒 JWT required)
```
GET    /api/user/me
PATCH  /api/user/profile
POST   /api/logout
GET    /api/user/list                   (owner/admin)
PATCH  /api/user/activate/:id           (owner/admin)
PATCH  /api/user/suspend/:id            (owner/admin)
DELETE /api/user/delete/:id             (owner/admin)
```

### Clients (🔒)
```
POST   /api/client/create
GET    /api/client/list
GET    /api/client/read/:id
PATCH  /api/client/update/:id
DELETE /api/client/delete/:id
GET    /api/client/search?q=&fields=name,email
GET    /api/client/summary
```

### Invoices (🔒)
```
POST   /api/invoice/create
GET    /api/invoice/list
GET    /api/invoice/read/:id
PATCH  /api/invoice/update/:id
DELETE /api/invoice/delete/:id
PATCH  /api/invoice/paid/:id
POST   /api/invoice/remind/:id
GET    /api/invoice/summary
```

### Jobs (🔒)
```
POST   /api/job/create
GET    /api/job/list
GET    /api/job/mine
POST   /api/job/apply/:id
PATCH  /api/job/applicant/:id
```

### Workers (🔒)
```
GET    /api/worker/approved
GET    /api/worker/me
POST   /api/worker/me               (upsert own profile)
GET    /api/worker/admin/list       (owner/admin)
PATCH  /api/worker/admin/approve/:id
PATCH  /api/worker/admin/suspend/:id
PATCH  /api/worker/admin/rate/:id
```

### Health
```
GET /api/health   →  { success: true, result: { status: "ok" } }
```

---

## Activation Flow

```
User signs up (email or Google)
  → status pending (enabled: false)
  → Email sent to hempstonetinga@gmail.com
  → Admin logs in → Admin Panel → Users → Activate
  → User gets "Your account is active" email
  → User can now access the platform

Exception: hempstonetinga@gmail.com auto-activates as 'owner' immediately.
```

---

## Frontend Env Vars (Vercel)

```
VITE_API_URL=https://your-railway-backend.railway.app
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```
