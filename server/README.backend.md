# Dispatch — Backend API Reference

> Node.js + Express + Prisma + MySQL + Socket.IO  
> Hosted on Railway. Frontend: React/Vite/Capacitor.

---

## Setup

```bash
cd server
cp .env.example .env        # fill in your values
npm install
npm run db:generate          # generate Prisma client
npm run db:push              # push schema to Railway MySQL
npm run db:seed              # seed test accounts (dev only)
npm run dev                  # start with hot reload
```

### Railway deployment

1. Push repo to GitHub
2. Create a new Railway project → **Deploy from GitHub repo**
3. Add a **MySQL** plugin inside the project — Railway auto-sets `DATABASE_URL`
4. Add all `.env` variables in Railway's **Variables** tab
5. Railway runs `npm run db:migrate && npm start` automatically (via `railway.json`)

---

## Base URL

| Environment | URL |
|-------------|-----|
| Local       | `http://localhost:3000` |
| Production  | `https://your-project.up.railway.app` |

All endpoints return JSON. Authenticated routes require:
```
Authorization: Bearer <accessToken>
```

---

## Auth  `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register passenger or driver |
| POST | `/auth/login` | — | Login, get tokens |
| POST | `/auth/refresh` | — | Rotate access + refresh token |
| POST | `/auth/logout` | — | Revoke refresh token |
| POST | `/auth/forgot-password` | — | Send OTP to email |
| POST | `/auth/reset-password` | — | Reset password with OTP |
| GET  | `/auth/me` | ✅ | Get current user profile |

### POST `/auth/register`
```json
{
  "fullName": "Thabo Mokoena",
  "username": "thabo_m",
  "email": "thabo@example.com",
  "phone": "+26657123456",
  "password": "MyPass@123",
  "dob": "1998-05-15",
  "idNumber": "9805155678081",
  "role": "PASSENGER"  // or "DRIVER"
}
```
**Response:** `{ user, accessToken, refreshToken }`  
User ID is auto-generated: `p2026XXXXX` (passenger) or `d2026XXXXX` (driver).

### POST `/auth/login`
```json
{ "identifier": "thabo_m", "password": "MyPass@123" }
```
`identifier` accepts email or username.

### POST `/auth/forgot-password`
```json
{ "email": "thabo@example.com" }
```
Sends a 6-digit OTP. Always responds 200 (prevents email enumeration).

### POST `/auth/reset-password`
```json
{ "email": "thabo@example.com", "otp": "483921", "newPassword": "NewPass@123" }
```

---

## Users  `/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/users/profile` | ✅ | Update name, phone, vehicle info |
| POST  | `/users/avatar` | ✅ | Upload profile picture (multipart) |
| GET   | `/users/:id/reviews` | ✅ | Get reviews for a user |
| GET   | `/users/stats` | ✅ | Personal statistics |

### GET `/users/stats` — Passenger response
```json
{ "totalTrips": 14, "totalSpent": 1820.50, "uniqueDrivers": 8 }
```

### GET `/users/stats` — Driver response
```json
{
  "totalTrips": 47,
  "totalEarned": 8340.00,
  "totalDistanceKm": 621.4,
  "recentReviews": [...]
}
```

---

## Wallet  `/wallet`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET  | `/wallet` | ✅ | Get current balance |
| GET  | `/wallet/transactions` | ✅ | Transaction history (last 50) |
| POST | `/wallet/deposit` | ✅ | Add money (passengers) |
| POST | `/wallet/withdraw` | ✅ | Withdraw earnings (drivers only) |

### POST `/wallet/deposit`
```json
{ "amount": 100, "method": "ECOCASH" }
```
`method`: `CARD` | `ECOCASH` | `MPESA`

> ⚠️ In production, verify payment with a gateway (Flutterwave/Stripe) before crediting. Current implementation trusts the request (demo).

---

## Trips  `/trips`

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | `/trips/estimate` | ✅ | Any | Price estimate before booking |
| POST | `/trips` | ✅ | PASSENGER | Request a ride |
| GET  | `/trips/available` | ✅ | DRIVER | Open trip requests nearby |
| GET  | `/trips` | ✅ | Any | Trip history |
| GET  | `/trips/:id` | ✅ | Any | Single trip details |
| POST | `/trips/:id/accept` | ✅ | DRIVER | Accept a trip request |
| POST | `/trips/:id/arrived` | ✅ | DRIVER | Notify passenger of arrival |
| POST | `/trips/:id/start` | ✅ | DRIVER | Start the trip |
| POST | `/trips/:id/complete` | ✅ | DRIVER | End trip + process payment |
| POST | `/trips/:id/cancel` | ✅ | Any | Cancel trip |
| POST | `/trips/:id/rate` | ✅ | Any | Rate + review the other party |

### Trip status flow
```
REQUESTED → DRIVER_ASSIGNED → DRIVER_ARRIVED → IN_PROGRESS → COMPLETED
                                                           ↘ CANCELLED
```

### POST `/trips` (passenger books a ride)
```json
{
  "pickupAddress": "NUL Main Gate, Roma",
  "pickupLat": -29.4472,
  "pickupLng": 27.6714,
  "dropoffAddress": "Maseru Mall",
  "dropoffLat": -29.3167,
  "dropoffLng": 27.4833,
  "seats": 1
}
```
Returns `409` if passenger balance < trip price.

### POST `/trips/estimate`
```json
{ "pickupLat": -29.4472, "pickupLng": 27.6714, "dropoffLat": -29.3167, "dropoffLng": 27.4833 }
```
**Response:**
```json
{
  "distanceKm": 22.4,
  "durationMin": 35,
  "baseFare": 15,
  "distanceCharge": 179.2,
  "timeCharge": 52.5,
  "totalPrice": 246.70,
  "driverEarning": 197.36,
  "systemCommission": 49.34
}
```

### POST `/trips/:id/rate`
```json
{ "score": 5, "review": "Very smooth ride!" }
```
Score: integer 1–5. `review` is optional.

### Cancellation rules
- **Passenger cancels before driver assigned** → no charge
- **Passenger cancels after driver assigned** → no charge (driver already notified)
- **Driver cancels during trip** → passenger charged 50% of trip price, driver gets 80% of that

---

## Drivers  `/drivers`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/drivers/clock` | ✅ DRIVER | Toggle clock in / clock out |
| PUT  | `/drivers/location` | ✅ DRIVER | Push GPS position |
| POST | `/drivers/documents/:docType` | ✅ DRIVER | Upload a document (multipart) |
| GET  | `/drivers/documents` | ✅ DRIVER | List own documents + status |

`docType`: `LICENSE` | `PERMIT` | `REGISTRATION`

Clock-in is **blocked** until all 3 documents are `VERIFIED` by admin.

### POST `/drivers/documents/LICENSE`
Form data: `file` (image or PDF, max 10MB)

---

## Admin  `/admin`

All admin routes require role `ADMIN`.

| Method | Path | Description |
|--------|------|-------------|
| GET   | `/admin/documents/pending` | All PENDING driver documents |
| PATCH | `/admin/documents/:id` | Verify or reject a document |
| GET   | `/admin/users` | Paginated user list |
| GET   | `/admin/trips` | Recent 50 trips |
| GET   | `/admin/stats` | Platform overview stats |

### PATCH `/admin/documents/:id`
```json
{ "status": "VERIFIED", "reviewNote": "All good" }
```
`status`: `VERIFIED` | `REJECTED`

When all 3 of a driver's documents become VERIFIED, `driverProfile.isVerified` is set to `true` automatically.

---

## Real-time — Socket.IO

Connect with the access token:
```js
import { io } from "socket.io-client";

const socket = io("https://your-project.up.railway.app", {
  auth: { token: accessToken }
});
```

### Client → Server events

| Event | Payload | Who |
|-------|---------|-----|
| `join:trip` | `tripId: string` | Passenger joins trip room for live updates |
| `leave:trip` | `tripId: string` | Leave trip room |
| `driver:location` | `{ lat, lng, tripId? }` | Driver pushes GPS position |

### Server → Client events

| Event | Payload | Who receives |
|-------|---------|-------------|
| `new:trip` | full trip object | All connected drivers (broadcast) |
| `trip:updated` | updated trip object | Passenger's personal room |
| `trip:cancelled` | `{ tripId, by }` | Other party's personal room |
| `driver:location` | `{ lat, lng }` | Everyone in `trip:{id}` room |

### Typical passenger flow (sockets)
```js
// After requesting a trip:
socket.emit("join:trip", tripId);

socket.on("trip:updated", (trip) => {
  // status changes: DRIVER_ASSIGNED → DRIVER_ARRIVED → IN_PROGRESS → COMPLETED
});

socket.on("driver:location", ({ lat, lng }) => {
  // move driver marker on map
});
```

### Typical driver flow (sockets)
```js
socket.on("new:trip", (trip) => {
  // new ride request appeared — show in available trips list
});

// After accepting and starting:
socket.emit("join:trip", tripId);

// Emit position every 3-5 seconds:
navigator.geolocation.watchPosition(({ coords }) => {
  socket.emit("driver:location", {
    lat: coords.latitude,
    lng: coords.longitude,
    tripId
  });
});
```

---

## Pricing formula

```
total = BASE_FARE + (distanceKm × RATE_PER_KM) + (durationMin × RATE_PER_MIN)
driver_earning    = total × 0.80
system_commission = total × 0.20
```

Default values (set in `.env`):

| Variable | Default | Notes |
|----------|---------|-------|
| `BASE_FARE` | 15 | Lesotho Loti |
| `RATE_PER_KM` | 8 | per km |
| `RATE_PER_MIN` | 1.5 | per minute |
| `DRIVER_CUT_PERCENT` | 80 | % of total |

---

## User ID format

| Role | Format | Example |
|------|--------|---------|
| Passenger | `p{year}{5 digits}` | `p202621274` |
| Driver | `d{year}{5 digits}` | `d202654321` |
| Admin | custom | `admin001` |

---

## Test accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dispatch.app | Admin@1234 |
| Passenger | passenger@dispatch.app | Pass@1234 |
| Driver | driver@dispatch.app | Pass@1234 |
