# FlamingoPay

A QR-based instant payment platform for South Africa's informal economy. Merchants (spaza shops, street vendors, taxi ranks) get a QR code that customers scan to pay via PayShap or EFT — no card terminal needed.

**Live:** [https://www.flamingopay.co.za](https://www.flamingopay.co.za)

## How It Works

1. A merchant signs up, uploads KYC documents, and gets approved by an admin.
2. The merchant receives a unique QR code linked to `/pay/{merchantId}`.
3. A buyer scans the QR, enters an amount, and pays via their banking app (PayShap or EFT).
4. The merchant sees the payment in real time on their dashboard.
5. Flamingo settles funds to the merchant's bank account daily, minus fees.

## Fee Structure

- **Transaction fee:** 2.9% + R0.99 per completed transaction
- **Payout fee:** R3.00 flat per daily settlement (Ozow)
- Fees are deducted automatically before settlement. The merchant dashboard, transaction detail, and settlement pages all show the breakdown transparently.

## Project Structure

```
flamingopay/
├── flamingo-pay-website/             # Next.js 16 frontend (App Router)
│   ├── app/
│   │   ├── page.tsx                  # Landing page (3D hero, CTAs)
│   │   ├── layout.tsx                # Root layout (fonts, metadata, PWA)
│   │   ├── not-found.tsx             # Custom 404
│   │   │
│   │   ├── pay/[merchantId]/         # Buyer payment page (scan QR → pay)
│   │   │
│   │   ├── merchant/                 # Merchant-facing mobile app
│   │   │   ├── login/                # PIN-based login with lockout
│   │   │   ├── signup/               # 4-step onboarding with doc uploads
│   │   │   ├── pending/              # Application status + re-upload rejected docs
│   │   │   ├── dashboard/            # Sales dashboard (today/week stats)
│   │   │   ├── transactions/         # Transaction history with detail sheet
│   │   │   ├── settlements/          # Daily payouts with fee breakdown
│   │   │   ├── qr/                   # QR code display + share
│   │   │   ├── profile/              # Edit profile, export CSV, delete account
│   │   │   └── _components/          # TabBar, TopBar, LanguagePicker, MerchantGate
│   │   │
│   │   ├── admin/                    # Admin operations console
│   │   │   ├── page.tsx              # Overview dashboard
│   │   │   ├── login/                # Admin sign-in
│   │   │   └── merchants/            # Merchant list + detail (approve/reject/flag)
│   │   │       └── [id]/             # Single merchant: KYC docs, compliance, actions
│   │   │
│   │   └── api/                      # Next.js API routes
│   │       ├── merchants/            # CRUD + merchant signup
│   │       ├── auth/                 # Admin login/logout/session + merchant PIN login
│   │       ├── compliance/           # Flags, freeze, stats
│   │       ├── documents/view/       # Private blob proxy for KYC doc viewing
│   │       ├── upload/               # KYC document upload to Vercel Blob
│   │       ├── receipt/              # Buyer payment receipt
│   │       └── admin/                # Audit log, global search
│   │
│   ├── lib/                          # Shared logic
│   │   ├── store.ts                  # Redis-backed data layer (merchants, txns, compliance)
│   │   ├── merchant.ts               # Client-side helpers (mock data, session, formatting)
│   │   ├── admin.ts                  # Admin session helpers
│   │   ├── api-auth.ts               # API auth middleware + rate limiting
│   │   ├── audit.ts                  # Audit trail logging
│   │   ├── compliance.ts             # Compliance rule evaluation
│   │   ├── i18n.tsx                  # 11-language i18n provider
│   │   ├── useMerchant.ts            # React hook: current merchant data
│   │   ├── useMerchantTxns.ts        # React hook: merchant transactions
│   │   └── useSessionTimeout.ts      # React hook: auto-logout on inactivity
│   │
│   ├── public/                       # Static assets (logos, QR images, icons)
│   ├── next.config.ts                # Next.js config
│   └── package.json
│
├── src/app.js                        # Express backend (legacy)
├── brand/                            # Brand assets (logos, favicon)
├── .env.example                      # Environment variable template
├── .github/workflows/ci.yml          # GitHub Actions CI pipeline
└── CHANGELOG.md                      # Release history
```

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4, Framer Motion
- **Database:** Upstash Redis (REST API)
- **File Storage:** Vercel Blob (private store for KYC documents)
- **Auth:** SHA-256 PIN hashing, Redis-backed rate limiting
- **3D:** Three.js / React Three Fiber (landing page hero)
- **Hosting:** Vercel
- **CI:** GitHub Actions (TypeScript check + build)

## Prerequisites

- Node.js >= 18
- npm
- An [Upstash](https://upstash.com) Redis database
- A [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store (for KYC uploads)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/msizibrocabs/flamingopay.git
cd flamingopay/flamingo-pay-website
npm install
```

### 2. Configure environment variables

Create a `.env.local` in `flamingo-pay-website/`:

```env
# Upstash Redis (required)
KV_REST_API_URL=https://your-redis.upstash.io
KV_REST_API_TOKEN=AX...

# Vercel Blob (required for KYC uploads)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Admin credentials (for demo)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password
```

### 3. Run the development server

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## Key Features

### Merchant Onboarding

The 4-step signup flow collects business details, owner information, banking details, and KYC documents. Documents are uploaded to Vercel Blob (private store) and linked to the merchant record. The required documents depend on the business type and expected monthly volume (tiered KYC).

### PIN Authentication

Merchants log in with their phone number and a 4-digit PIN. PINs are hashed with SHA-256 (salted) before storage — the plain PIN is never persisted. Login is rate-limited to 3 attempts per phone number, after which the account is locked for 15 minutes. The lockout countdown is shown in real time.

### Compliance Monitoring

The admin compliance portal auto-flags suspicious activity based on configurable rules. Rules are business-type-aware: a taxi-rank spaza doing 50 small transactions per hour won't be flagged, but a boutique doing the same volume will. Each business type has its own velocity limits, amount thresholds, unusual-hours definitions, and anomaly multipliers.

### KYC Document Management

Admins can view, approve, or reject individual KYC documents. Rejected documents show the rejection reason on the merchant's pending page, along with a re-upload button. Missing required documents are also surfaced with upload prompts. Documents are served through a server-side proxy (`/api/documents/view`) that authenticates against the private Blob store.

### Transaction Fees

Every transaction detail shows the fee breakdown (2.9% + R0.99) and the net amount the merchant receives. Settlement pages show per-settlement totals for transaction fees and the R3 payout fee separately, so merchants can see exactly what they're paying.

### Buyer Payment Flow

Buyers scan a merchant's QR code, land on `/pay/{merchantId}`, enter an amount, and get directed to their banking app. After payment, a confirmation/receipt page is shown. The checkout page displays the actual merchant name and details (not demo data).

### Internationalisation

The merchant app supports 11 South African languages via a client-side i18n provider with a language picker.

### PWA Support

The app includes a web manifest, service worker, and app icons so merchants can install it on their home screen.

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/merchants` | Create a new merchant (signup) |
| GET | `/api/merchants` | List all merchants (admin) |
| GET | `/api/merchants/[id]` | Get single merchant |
| PATCH | `/api/merchants/[id]` | Update merchant (approve/reject/edit) |
| POST | `/api/auth/merchant-login` | Merchant PIN login (rate-limited) |
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/logout` | Admin logout |
| GET | `/api/auth/session` | Check admin session |
| POST | `/api/upload` | Upload KYC document to Blob |
| GET | `/api/documents/view` | Stream private Blob file |
| GET | `/api/receipt/[txnId]` | Get payment receipt |
| GET | `/api/compliance/flags` | List compliance flags |
| POST | `/api/compliance/freeze` | Freeze/unfreeze merchant |
| GET | `/api/compliance/stats` | Compliance statistics |
| GET | `/api/admin/audit` | Audit trail log |
| GET | `/api/admin/search` | Global search (merchants, txns) |

## Demo Merchants

Six demo merchants are seeded on first load (when the Redis `seeded` key is absent):

| ID | Name | Type | PIN |
|----|------|------|-----|
| `demo` | Flamingo Demo Shop | General | 1234 |
| `thandis-spaza` | Thandi's Spaza | Grocery | 1234 |
| `bra-mike-braai` | Bra Mike's Braai Stand | Food | 1234 |
| `mama-joy-fruit` | Mama Joy's Fruit & Veg | Fresh Produce | 1234 |
| `siphos-tech` | Sipho's Tech Hub | Electronics | 1234 |
| `naledi-fashion` | Naledi Fashion | Clothing | 1234 |

To re-seed (e.g. after schema changes), delete the `seeded` key from your Upstash Redis dashboard.

## Deployment

The app is deployed to Vercel. Pushing to `main` triggers automatic production deployment.

```bash
git push origin main
```

### Required Vercel environment variables

Set these in your Vercel project settings:

- `KV_REST_API_URL` — Upstash Redis REST URL
- `KV_REST_API_TOKEN` — Upstash Redis REST token
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob read/write token

### Deployment protection

SSO protection is enabled on `.vercel.app` URLs. The site is publicly accessible via the custom domain `www.flamingopay.co.za`.

## Smoke Testing

```bash
cd flamingo-pay-website
npm run build
npx next start --port 3002
```

Test key routes:

- `http://localhost:3002/` — Landing page (200)
- `http://localhost:3002/pay/thandis-spaza` — Payment page (200)
- `http://localhost:3002/merchant/login` — Merchant login (200)
- `http://localhost:3002/admin` — Admin dashboard (redirects to login)
- `http://localhost:3002/pay/nonexistent` — "Merchant not found" (200)
- `http://localhost:3002/does-not-exist` — 404

## Changelog

See [`CHANGELOG.md`](./CHANGELOG.md) for the full release history.

## License

MIT
