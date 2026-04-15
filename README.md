# FlamingoPay

A payment processing service with an Express.js backend API and a Next.js frontend, connected via an API proxy.

**Live:** [https://flamingo-pay-website.vercel.app](https://flamingo-pay-website.vercel.app)

## Project Structure

```
flamingopay/
├── src/                              # Express backend
│   └── app.js                        # Express app entry point
├── flamingo-pay-website/             # Next.js frontend
│   ├── app/                          # App Router pages & layouts
│   │   ├── admin/                    # Admin operations console (staff)
│   │   │   ├── _components/          # AdminGate, AdminNav, StatusPill
│   │   │   ├── merchants/            # Merchant list & detail pages
│   │   │   │   └── [id]/page.tsx     # Single-merchant review & actions
│   │   │   ├── login/page.tsx        # Admin sign-in
│   │   │   └── page.tsx              # Admin overview dashboard
│   │   ├── merchant/                 # Merchant-facing mobile app
│   │   │   ├── _components/          # TabBar, TopBar, LanguagePicker, MerchantGate
│   │   │   ├── dashboard/page.tsx    # Sales dashboard
│   │   │   ├── transactions/page.tsx # Transaction history
│   │   │   ├── qr/page.tsx           # QR code display
│   │   │   ├── settlements/page.tsx  # Payouts / settlements
│   │   │   ├── profile/page.tsx      # Merchant profile
│   │   │   ├── login/page.tsx        # Merchant sign-in
│   │   │   ├── signup/page.tsx       # 4-step merchant onboarding
│   │   │   └── pending/page.tsx      # Application review status
│   │   ├── api/merchants/            # Next.js API routes (CRUD)
│   │   ├── pay/[merchantId]/         # Universal payment page (dynamic)
│   │   ├── not-found.tsx             # Custom 404 page
│   │   ├── layout.tsx                # Root layout (fonts, metadata)
│   │   └── page.tsx                  # Landing page
│   ├── lib/                          # Shared logic
│   │   ├── store.ts                  # Server-side merchant store (in-memory)
│   │   ├── merchant.ts               # Client-side mock data & session helpers
│   │   ├── admin.ts                  # Admin session helpers (demo)
│   │   └── i18n.tsx                  # 11-language i18n provider
│   ├── public/                       # Static assets (logos, QR images)
│   ├── next.config.ts                # Next.js config
│   └── package.json                  # Frontend dependencies
├── brand/                            # Brand assets (logos, favicon)
├── tests/                            # Backend test files
├── .env.example                      # Environment variable template
├── .gitignore                        # Git ignore rules
├── package.json                      # Backend dependencies
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- npm

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/msizibrocabs/flamingopay.git
cd flamingopay
```

### 2. Install dependencies

```bash
# Backend
npm install

# Frontend
cd flamingo-pay-website
npm install
cd ..
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable       | Description              | Default       |
|----------------|--------------------------|---------------|
| `PORT`         | Express server port      | `3000`        |
| `NODE_ENV`     | Environment mode         | `development` |
| `DATABASE_URL` | Database connection URL  | —             |

## Running the Application

You need to run both the backend and frontend servers.

### Backend (Express — port 3000)

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

### Frontend (Next.js — port 3001)

```bash
cd flamingo-pay-website
npm run dev
```

> **Note:** The Next.js dev server automatically uses port 3001 when the Express backend is running on port 3000.

## API Proxy

The Next.js frontend proxies all `/api/*` requests to the Express backend. This is configured in `flamingo-pay-website/next.config.ts`:

```ts
async rewrites() {
  return [
    {
      source: "/api/:path*",
      destination: "http://localhost:3000/api/:path*",
    },
  ];
}
```

This means you can call `/api/health` from the frontend and it will be forwarded to `http://localhost:3000/api/health` on the backend.

### Verify the proxy

1. Start both servers (see above)
2. Open `http://localhost:3001/test` in your browser
3. Click **Test Connection** — you should see `{"status": "ok"}`

## API Endpoints

| Method | Endpoint       | Description          |
|--------|----------------|----------------------|
| GET    | `/`            | Welcome message      |
| GET    | `/api/health`  | Health check         |

## Testing

```bash
npm test
```

## Deployment

Both apps are deployed to [Vercel](https://vercel.com) and linked to the GitHub repo. Pushing to `main` triggers automatic production deployments for both projects.

### Vercel projects

- **flamingopay** — Express backend (production: `www.flamingopay.co.za`)
- **flamingo-pay-website** — Next.js frontend (Root Directory: `flamingo-pay-website/`)

### Automatic deployments (recommended)

Push to `main` and Vercel builds both projects automatically:

```bash
git push origin main
```

Monitor deployment status:

```bash
npx vercel list --prod
```

Or check via GitHub:

```bash
gh api repos/msizibrocabs/flamingopay/deployments --jq '.[0:4] | .[] | "\(.environment) | \(.created_at)"'
```

### Manual deployments

From the repo root (deploys the backend):

```bash
npx vercel --prod
```

For the frontend, use the Vercel API since the CLI has a root-directory path conflict when run from the subdirectory:

```bash
# Force a fresh frontend deployment (bypasses build cache)
npx vercel list --prod  # to verify status afterward
```

### Deployment protection

The frontend project has SSO protection enabled on all `.vercel.app` URLs (`all_except_custom_domains`). To make the site publicly accessible, add a custom domain in Vercel project settings.

### Troubleshooting

- **"No Next.js version detected"** — This usually means a stale build cache. Trigger a cache-free redeployment via the Vercel API with `forceNew=1`.
- **Multiple lockfile warning** — Expected in this monorepo setup (root + frontend each have their own `package-lock.json`). Does not affect builds.

## Smoke Testing

After deploying, verify the production build locally:

```bash
# Build and serve the frontend
cd flamingo-pay-website
npm run build
npx next start --port 3002
```

Then test key routes:

```bash
# Landing page
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3002/

# Payment page — valid merchant
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3002/pay/demo
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3002/pay/thandis-spaza

# Payment page — invalid merchant (should render "not found" UI)
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3002/pay/nonexistent

# 404 route
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3002/does-not-exist
```

Expected results:

- `/` → 200 (landing page)
- `/pay/demo` → 200 ("Flamingo Demo Shop" payment flow)
- `/pay/thandis-spaza` → 200 ("Thandi's Spaza" payment flow)
- `/pay/nonexistent` → 200 (in-page "Merchant not found" message)
- `/does-not-exist` → 404

### Available test merchants

- `demo` — Flamingo Demo Shop
- `thandis-spaza` — Thandi's Spaza (Grocery)
- `bra-mike-braai` — Bra Mike's Braai Stand (Food)
- `mama-joy-fruit` — Mama Joy's Fruit & Veg (Fresh Produce)

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Hosting:** Vercel (frontend)
- **Tooling:** ESLint, Turbopack

## License

MIT
