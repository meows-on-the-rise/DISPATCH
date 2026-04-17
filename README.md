# DISPATCH 🚕

> Database-driven ride-hailing app — Uber for Lesotho.  
> React + TypeScript + Vite · Node/Express · Prisma · MySQL · Socket.IO · Capacitor

---

## What's built

| Layer | Stack | Host |
|-------|-------|------|
| Mobile/Web frontend | React 18, TypeScript, Vite, Tailwind, Zustand, Axios, Socket.IO client, React Leaflet | Vercel / Capacitor (Android + iOS) |
| Backend API | Node.js, Express, Prisma ORM, JWT, bcrypt, Multer, Cloudinary, Nodemailer | Railway |
| Database | MySQL | Railway (plugin) |
| Maps | OpenStreetMap + React Leaflet + OSRM routing | Free, no API key |
| Real-time | Socket.IO | Same Railway service |
| File storage | Cloudinary | Free tier |
| Email OTP | Nodemailer + Gmail SMTP | Free |

---

## Quick start

```bash
# Clone and setup (one command)
git clone https://github.com/boitumelorakoloi-lab/DISPATCH
cd DISPATCH
bash setup.sh
```

Then:
```bash
# Terminal 1 — backend
cd server
# Fill in server/.env first (see Environment Variables section)
npm run db:push    # create tables on Railway MySQL
npm run db:seed    # load test accounts
npm run dev        # starts on :3000

# Terminal 2 — frontend
npm run dev        # starts on :5173
```

Open `http://localhost:5173` — the Vite dev proxy forwards API calls to `:3000` automatically.

---

## Environment variables

### `server/.env`

```env
DATABASE_URL="mysql://user:pass@host:port/dispatch"

JWT_SECRET="<64-byte hex — node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\">"
JWT_REFRESH_SECRET="<different 64-byte hex>"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_gmail@gmail.com"
SMTP_PASS="your_gmail_app_password"
SMTP_FROM="Dispatch <your_gmail@gmail.com>"

BASE_FARE=15
RATE_PER_KM=8
RATE_PER_MIN=1.5
DRIVER_CUT_PERCENT=80
```

### `.env` (frontend)

```env
VITE_API_URL=http://localhost:3000
# In production: VITE_API_URL=https://your-project.up.railway.app
```

---

## Folder structure

```
DISPATCH/
├── setup.sh                    ← one-shot setup
├── railway.json                ← Railway deploy config
├── vite.config.ts              ← Vite + dev proxy
├── tsconfig.json               ← Frontend TypeScript
├── capacitor.config.ts         ← Mobile app config
├── package.json                ← Frontend deps
├── index.html
├── public/
│   └── dispatch-icon.svg       ← App icon source
│
├── src/                        ── FRONTEND ──
│   ├── index.css               ← All design tokens + CSS classes
│   ├── main.tsx
│   ├── App.tsx                 ← Router + auth guards
│   ├── api/
│   │   └── client.ts           ← Axios + all API methods + auto-refresh
│   ├── store/
│   │   ├── authStore.ts        ← Zustand auth (user, tokens, persist)
│   │   └── tripStore.ts        ← Zustand trip state + driver location
│   ├── hooks/
│   │   ├── useSocket.ts        ← Socket.IO singleton
│   │   └── useGeolocation.ts   ← GPS watcher
│   ├── lib/
│   │   └── toast.tsx           ← Global notifications
│   ├── components/
│   │   ├── map/
│   │   │   └── DispatchMap.tsx ← Leaflet + OSRM routing + markers
│   │   └── shared/
│   │       └── index.tsx       ← Avatar, LocationCard, DriverCard…
│   └── pages/
│       ├── auth/               UserSelect, Login, Register, ForgotPassword
│       ├── passenger/          Dashboard, RequestRide, Wallet, Activity, Stats, Profile
│       ├── driver/             Dashboard, FindPassengers, Documents, Wallet, Stats
│       └── admin/              AdminPanel (doc review + platform stats)
│
└── server/                     ── BACKEND ──
    ├── prisma/
    │   ├── schema.prisma       ← 13 models: User, Trip, Wallet, Rating…
    │   └── seed.ts             ← Test accounts
    └── src/
        ├── index.ts            ← Express server + Socket.IO init
        ├── lib/
        │   ├── prisma.ts       ← DB client singleton
        │   ├── pricing.ts      ← Fare calculator + userId generator
        │   ├── cloudinary.ts   ← File upload config
        │   └── mailer.ts       ← OTP + welcome emails
        ├── middleware/
        │   └── auth.ts         ← JWT verify, role guards
        ├── routes/
        │   ├── auth.ts         ← register/login/refresh/OTP reset
        │   ├── users.ts        ← profile, avatar, stats, reviews
        │   ├── wallet.ts       ← balance, deposit, withdraw
        │   ├── trips.ts        ← full trip lifecycle + payments
        │   ├── drivers.ts      ← clock, location, documents
        │   └── admin.ts        ← doc review, user list, stats
        └── socket/
            └── io.ts           ← real-time driver tracking
```

---

## Design system

All tokens live in `src/index.css`. The theme exactly replicates the reference UI:

| Token | Value | Role |
|-------|-------|------|
| `--bg-base` | `#0d1b3e` | Page background — deep indigo |
| `--bg-surface` | `#111f4d` | Cards |
| `--bg-elevated` | `#162258` | Inputs, modals |
| `--purple` | `#7c4fe0` | CTA buttons, active states |
| `--purple-light` | `#9b6ff5` | Accent text, links |
| `--teal` | `#2edbb0` | Route line, dropoff dot, success |
| `--text-primary` | `#f0eeff` | Main text |
| `--text-secondary` | `#9b97c4` | Labels, muted |
| `--font-display` | Syne 800 | Headings, amounts |
| `--font-body` | DM Sans | Body |

---

## App screens

### Auth flow
```
/ (UserSelect) → /register?role=PASSENGER|DRIVER
              → /login → /forgot-password
```

### Passenger flow
```
/passenger (Dashboard)
  ├── /passenger/request   → tap map → estimate → book → track driver → rate
  ├── /passenger/wallet    → balance · deposit (EcoCash/M-Pesa/Card)
  ├── /passenger/activity  → trip logs · payment logs
  ├── /passenger/stats     → money spent · trips · avg spend
  └── /passenger/profile   → edit name · avatar
```

### Driver flow
```
/driver (Dashboard)
  ├── /driver/find         → open trips list → accept → track passenger → end trip → rate
  ├── /driver/documents    → upload license / permit / registration
  ├── /driver/wallet       → earnings · withdraw
  ├── /driver/stats        → earnings · distance · reviews
  ├── /driver/activity     → trip logs
  └── /driver/profile      → edit name · vehicle info · avatar
```

### Admin
```
/admin → pending document review (verify/reject) · platform stats
```

---

## Trip lifecycle

```
[Passenger]  POST /trips            → status: REQUESTED
[Driver]     POST /trips/:id/accept → status: DRIVER_ASSIGNED
[Driver]     POST /trips/:id/arrived→ status: DRIVER_ARRIVED  (notifies passenger)
[Driver]     POST /trips/:id/start  → status: IN_PROGRESS
[Driver]     POST /trips/:id/complete→status: COMPLETED  → payment processed automatically
[Either]     POST /trips/:id/cancel → status: CANCELLED
[Either]     POST /trips/:id/rate   → score + optional review
```

Payment on completion:
- Passenger wallet debited `totalPrice`
- Driver wallet credited `totalPrice × 0.80`
- Dispatch keeps `totalPrice × 0.20`

---

## Fare formula

```
total = BASE_FARE(15) + distanceKm × RATE_PER_KM(8) + durationMin × RATE_PER_MIN(1.5)
driver = total × 0.80
dispatch = total × 0.20
```

All values configurable in `server/.env`.

---

## Real-time (Socket.IO)

```js
// Frontend — connect once (useSocket hook handles this)
const socket = io(API_URL, { auth: { token: accessToken } });

// Join trip room after booking
socket.emit("join:trip", tripId);

// Listen for updates
socket.on("trip:updated",   (trip) => { /* status changed */ });
socket.on("driver:location",({ lat, lng }) => { /* move map marker */ });
socket.on("trip:cancelled", ({ tripId }) => { /* show alert */ });
socket.on("new:trip",       (trip) => { /* driver sees new request */ });

// Driver pushes GPS every ~4s
socket.emit("driver:location", { lat, lng, tripId });
```

---

## Deploy to Railway

1. Push repo to GitHub
2. New Railway project → **Deploy from GitHub**
3. Add **MySQL plugin** → `DATABASE_URL` is injected automatically
4. Add all `server/.env` variables in Railway **Variables** tab
5. Railway reads `railway.json` and runs:
   ```
   cd server && npm run db:migrate && npm start
   ```
6. Set `FRONTEND_URL` to your Vercel URL once frontend is deployed

---

## Build the mobile app

```bash
# 1. Set VITE_API_URL to your Railway backend in .env
# 2. Build web assets
npm run build

# 3. Install Capacitor platforms (first time only)
npx cap add android
npx cap add ios        # Mac + Xcode required

# 4. Generate app icons from public/dispatch-icon.svg
npm install -g @capacitor/assets
# Create assets/icon.png (1024×1024) from the SVG first
npx capacitor-assets generate --iconBackgroundColor "#0d1b3e" --splashBackgroundColor "#0d1b3e"

# 5. Sync and open
npx cap sync
npx cap open android   # opens Android Studio → Run
npx cap open ios       # opens Xcode → Run
```

---

## Test accounts (after `npm run db:seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dispatch.app | Admin@1234 |
| Passenger | passenger@dispatch.app | Pass@1234 |
| Driver | driver@dispatch.app | Pass@1234 |

---

## What's next (step 3 was Capacitor setup — already included above)

| # | Feature | Notes |
|---|---------|-------|
| 4 | Payment gateway | Integrate Flutterwave or Stripe for real deposits |
| 5 | Push notifications | `@capacitor/push-notifications` + Firebase FCM |
| 6 | SMS OTP fallback | Africa's Talking (works in Lesotho) |
| 7 | Address autocomplete | Nominatim (OpenStreetMap, free) |
| 8 | Surge pricing | Multiply `total` by configurable factor at peak times |
| 9 | Multi-stop trips | Extend trip model with waypoints array |
| 10 | Driver earnings dashboard (web) | Separate admin web panel with Recharts |
