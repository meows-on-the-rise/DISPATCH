#!/usr/bin/env bash
# Dispatch — first-time setup script
# Run from the repo root: bash setup.sh

set -e

GREEN='\033[0;32m'
TEAL='\033[0;36m'
PURPLE='\033[0;35m'
RESET='\033[0m'
BOLD='\033[1m'

echo ""
echo -e "${PURPLE}${BOLD}  DISPATCH — Ride-hailing platform setup${RESET}"
echo ""

# ── 1. Frontend dependencies ──────────────────────────────────────────────────
echo -e "${TEAL}[1/5] Installing frontend dependencies...${RESET}"
if command -v pnpm &> /dev/null; then
  pnpm install --legacy-peer-deps
else
  npm install --legacy-peer-deps
fi
echo -e "${GREEN}  ✓ Frontend dependencies installed${RESET}"

# ── 2. Backend dependencies ───────────────────────────────────────────────────
echo -e "${TEAL}[2/5] Installing backend dependencies...${RESET}"
cd server && npm install && cd ..
echo -e "${GREEN}  ✓ Backend dependencies installed${RESET}"

# ── 3. Environment files ──────────────────────────────────────────────────────
echo -e "${TEAL}[3/5] Setting up environment files...${RESET}"

# Frontend .env
if [ ! -f ".env" ]; then
  if [ -f ".env.frontend.example" ]; then
    cp .env.frontend.example .env
  else
    echo "VITE_API_URL=http://localhost:3000" > .env
  fi
  echo -e "${GREEN}  ✓ Created .env (frontend)${RESET}"
  echo -e "    → Set VITE_API_URL to your Railway backend URL in production"
else
  echo "  .env already exists, skipping"
fi

# Backend .env
if [ ! -f "server/.env" ]; then
  if [ -f "server/.env.example" ]; then
    cp server/.env.example server/.env
    echo -e "${GREEN}  ✓ Created server/.env${RESET}"
    echo -e "    → Fill in DATABASE_URL, JWT secrets, Cloudinary, SMTP"
  else
    echo -e "  ⚠️  server/.env.example not found — create server/.env manually"
  fi
else
  echo "  server/.env already exists, skipping"
fi

# ── 4. Prisma client ──────────────────────────────────────────────────────────
echo -e "${TEAL}[4/5] Generating Prisma client...${RESET}"
cd server && npm run db:generate && cd ..
echo -e "${GREEN}  ✓ Prisma client generated${RESET}"

# ── 5. Summary ────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}✅ Setup complete!${RESET}"
echo ""
echo -e "${BOLD}Next steps:${RESET}"
echo ""
echo -e "  1. Edit ${PURPLE}server/.env${RESET}"
echo -e "       DATABASE_URL  → Railway MySQL connection string"
echo -e "       JWT_SECRET    → node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
echo -e "       JWT_REFRESH_SECRET → (different value, same command)"
echo -e "       CLOUDINARY_*  → from cloudinary.com free account"
echo -e "       SMTP_*        → Gmail + app password (Google Account → Security → App passwords)"
echo ""
echo -e "  2. Edit ${PURPLE}.env${RESET}"
echo -e "       VITE_API_URL  → your Railway URL (leave blank for local dev)"
echo ""
echo -e "  ${BOLD}Run locally:${RESET}"
echo -e "    Terminal 1: ${TEAL}cd server && npm run db:push && npm run db:seed && npm run dev${RESET}"
echo -e "    Terminal 2: ${TEAL}npm run dev${RESET}   (or: pnpm dev)"
echo ""
echo -e "  ${BOLD}Deploy backend to Railway:${RESET}"
echo -e "    Push repo to GitHub → Railway picks up railway.json automatically"
echo ""
echo -e "  ${BOLD}Build Android APK:${RESET}"
echo -e "    ${TEAL}npm run build && npx cap add android && npx cap sync && npx cap open android${RESET}"
echo ""
