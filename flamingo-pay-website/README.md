# Flamingo Pay

**South Africa's universal QR payment platform for the informal economy.**

One QR, every bank, instant settlement via PayShap through Ozow.

> Flamingo Pay (Pty) Ltd — Registration 2026/276925/07
> A23 10th Ave, Edenburg, Rivonia, Sandton, 2091, Gauteng, South Africa

---

## Overview

Flamingo Pay enables informal merchants (spaza shops, street vendors, market traders) to accept instant bank payments via a single QR code. Buyers scan with any South African banking app, pay via PayShap, and merchants receive funds immediately. Transaction fee: 2.9% + R0.99 — no monthly fees, no hardware.

**Live:** [www.flamingopay.co.za](https://www.flamingopay.co.za)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + custom Flamingo design system |
| Database | Upstash Redis (serverless, AWS eu-west-1) |
| Payments | Ozow (PayShap instant EFT) |
| KYC | VerifyNow / XDS (identity verification) |
| Hosting | Vercel (auto-deploy from GitHub) |
| Error monitoring | Sentry |
| Animations | Framer Motion |
| 3D | Three.js / React Three Fiber (landing page) |
| Auth | HTTP-only session cookies (bcryptjs) |
| Push notifications | Web Push API |
| QR generation | node-qrcode |
| PDF generation | jsPDF |

---

## Project Structure

```
flamingo-pay-website/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── globals.css                 # Flamingo design tokens & utilities
│   ├── pay/[merchantId]/           # Buyer payment flow (scan QR → pay)
│   ├── receipt/[txnId]/            # Transaction receipt page
│   ├── merchant/
│   │   ├── signup/                 # Merchant registration
│   │   ├── login/                  # Merchant PIN login
│   │   ├── dashboard/              # Merchant home (balance, recent txns)
│   │   ├── transactions/           # Transaction history
│   │   ├── settlements/            # Settlement tracking
│   │   ├── statements/             # Monthly statements (PDF)
│   │   ├── qr/                     # QR code display & download
│   │   ├── profile/                # Business profile editor
│   │   ├── complaints/             # Merchant complaint inbox
│   │   ├── forgot-pin/             # PIN reset via OTP
│   │   └── pending/                # KYC pending screen
│   ├── admin/
│   │   ├── page.tsx                # Admin dashboard
│   │   ├── login/                  # Admin staff login
│   │   ├── merchants/              # Merchant management
│   │   ├── merchants/[id]/         # Individual merchant detail
│   │   ├── staff/                  # Staff user management
│   │   ├── complaints/             # Complaint queue
│   │   └── sanctions/              # Sanctions screening dashboard
│   ├── compliance/
│   │   ├── page.tsx                # Compliance dashboard
│   │   ├── login/                  # Compliance officer login
│   │   ├── flags/                  # Compliance flag queue
│   │   ├── flags/[flagId]/         # Individual flag detail
│   │   ├── disputes/               # Dispute resolution queue
│   │   └── dsar/                   # POPIA data request management
│   ├── dispute/
│   │   ├── page.tsx                # Buyer dispute filing form
│   │   └── check/                  # Buyer dispute status lookup
│   ├── dsar/
│   │   ├── page.tsx                # Public POPIA data request form
│   │   └── status/                 # DSAR status lookup
│   ├── developers/                 # Interactive API documentation
│   ├── legal/
│   │   ├── _components/            # LegalShell, LegalSection (shared)
│   │   ├── privacy/                # POPIA Privacy Policy
│   │   ├── terms/                  # Merchant Terms of Service
│   │   ├── cpa/                    # Consumer Protection Act
│   │   ├── dpa/                    # Data Processing Agreements
│   │   └── ecta/                   # ECT Act Compliance
│   └── api/                        # 57 API routes (see below)
├── lib/
│   ├── upstash.ts                  # Redis client
│   ├── merchant.ts                 # Merchant CRUD, transactions, settlements
│   ├── compliance.ts               # Flags, freezes, compliance logic
│   ├── compliance-staff.ts         # Staff roles & permissions
│   ├── disputes.ts                 # Dispute lifecycle management
│   ├── dsar.ts                     # POPIA DSAR + deletion (Section 23/24)
│   ├── sanctions.ts                # UN/OFAC sanctions screening
│   ├── notifications.ts            # Push notification delivery
│   ├── otp.ts                      # OTP generation & verification
│   └── session.ts                  # Session management & auth helpers
├── components/
│   ├── motion/                     # Reveal, AnimatedCounter, etc.
│   └── art/                        # SpazaOwner 3D scene
├── public/
│   ├── openapi.json                # OpenAPI 3.0 specification (v1.1.0)
│   ├── api-docs.md                 # Full API reference (Markdown)
│   └── legal/                      # Downloadable legal documents
│       └── Flamingo-Pay-DPA-Template.docx
└── package.json
```

---

## API Endpoints (57 routes)

Full interactive documentation: [/developers](https://www.flamingopay.co.za/developers)

OpenAPI spec: [/openapi.json](https://www.flamingopay.co.za/openapi.json)

### Authentication (7 endpoints)
- `POST /api/auth/login` — Admin staff login
- `POST /api/auth/merchant-login` — Merchant PIN login
- `POST /api/auth/logout` — End session
- `GET  /api/auth/session` — Verify session
- `POST /api/auth/otp` — Send/verify OTP
- `POST /api/auth/pin-reset` — Reset merchant PIN
- `POST /api/compliance/login` — Compliance officer login

### Merchants (7 endpoints)
- `POST /api/merchants` — Register merchant
- `GET  /api/merchants` — List merchants (admin)
- `GET  /api/merchants/{id}` — Merchant detail
- `PATCH /api/merchants/{id}/status` — Update status
- `PATCH /api/merchants/{id}/update` — Update profile
- `GET  /api/merchants/check-phone` — Phone availability
- `GET  /api/merchants/{id}/documents` — KYC documents

### Transactions (5 endpoints)
- `GET  /api/merchants/{id}/transactions` — Transaction history
- `POST /api/merchants/{id}/transactions/{txnId}/refund` — Process refund
- `GET  /api/merchants/{id}/export` — Export CSV
- `GET  /api/merchants/{id}/statement` — Generate statement PDF
- `GET  /api/receipt/{txnId}` — Get receipt

### Holds & Verification (5 endpoints)
- `GET  /api/merchants/{id}/hold` — Hold status & velocity limits
- `POST /api/merchants/{id}/hold` — Place/lift hold
- `PUT  /api/merchants/{id}/hold` — Update velocity limits
- `GET  /api/merchants/{id}/verify` — KYC status
- `POST /api/merchants/{id}/verify` — Trigger KYC verification

### Disputes (6 endpoints)
- `POST /api/disputes` — File buyer dispute
- `GET  /api/disputes` — List disputes (compliance)
- `GET  /api/disputes/lookup` — Public status lookup
- `POST /api/disputes/search` — Search transactions
- `GET  /api/disputes/{disputeId}` — Dispute detail
- `PATCH /api/disputes/{disputeId}` — Resolve dispute

### DSAR / POPIA (5 endpoints)
- `POST /api/dsar` — Submit access/deletion request
- `GET  /api/dsar/lookup` — Public status lookup
- `POST /api/dsar/lookup` — Mark as downloaded
- `GET  /api/compliance/dsar` — List DSARs (compliance)
- `PATCH /api/compliance/dsar/{dsarId}` — Process DSAR

### Compliance (10 endpoints)
- `GET  /api/compliance/flags` — List flags
- `POST /api/compliance/flags` — Create flag
- `GET  /api/compliance/flags/{flagId}` — Flag detail
- `PATCH /api/compliance/flags/{flagId}` — Update flag
- `POST /api/compliance/flags/rescan` — Rescan transactions
- `POST /api/compliance/freeze` — Freeze/unfreeze merchant
- `GET  /api/compliance/stats` — Dashboard stats
- `GET  /api/compliance/disputes` — Dispute dashboard
- `GET  /api/compliance/risk` — Risk scores
- `GET/POST /api/compliance/strs` — Suspicious Transaction Reports

### Sanctions (4 endpoints)
- `POST /api/sanctions/screen` — Screen individual
- `POST /api/sanctions/batch` — Batch screening
- `POST /api/sanctions/refresh` — Refresh lists
- `GET  /api/sanctions/flags` — Sanctions flags

### Admin (6 endpoints)
- `POST /api/admin/login` — Admin login
- `GET  /api/admin/staff` — List staff
- `POST /api/admin/staff` — Create staff
- `PATCH /api/admin/staff/{id}` — Update staff
- `GET  /api/admin/audit` — Audit log
- `GET  /api/admin/search` — Global search

### Webhooks (2 endpoints)
- `POST /api/webhooks/ozow` — Ozow payment notifications
- `POST /api/webhooks/payshap` — PayShap settlement notifications

### Notifications (2 endpoints)
- `POST /api/push/subscribe` — Subscribe to push
- `POST /api/notifications/test` — Test notification

### Complaints (4 endpoints)
- `POST /api/complaints` — Submit complaint
- `GET  /api/complaints` — List complaints
- `PATCH /api/complaints/{id}` — Update complaint
- `GET  /api/complaints/stats` — Complaint stats

### Documents (2 endpoints)
- `POST /api/upload` — Upload KYC document
- `GET  /api/documents/view` — View document

---

## Pages (37 routes)

| Route | Description |
|-------|------------|
| `/` | Landing page with hero, how-it-works, pricing, trust signals |
| `/pay/[merchantId]` | Buyer payment flow (QR scan → Ozow PayShap) |
| `/receipt/[txnId]` | Transaction receipt with auto-download PNG |
| `/merchant/signup` | Merchant registration + KYC |
| `/merchant/login` | Merchant PIN login |
| `/merchant/dashboard` | Balance, recent transactions, quick stats |
| `/merchant/transactions` | Full transaction history with filters |
| `/merchant/settlements` | Settlement tracking |
| `/merchant/statements` | Monthly PDF statements |
| `/merchant/qr` | QR code display + download |
| `/merchant/profile` | Business profile editor |
| `/merchant/complaints` | Complaint inbox |
| `/merchant/forgot-pin` | PIN reset via OTP |
| `/merchant/pending` | KYC pending status screen |
| `/admin/*` | Admin dashboard, merchants, staff, complaints, sanctions |
| `/compliance/*` | Compliance dashboard, flags, disputes, DSAR queue |
| `/dispute` | Buyer dispute filing form |
| `/dispute/check` | Buyer dispute status lookup |
| `/dsar` | POPIA data access/deletion request form |
| `/dsar/status` | DSAR status lookup + data export download |
| `/developers` | Interactive API documentation |
| `/legal/privacy` | POPIA Privacy Policy |
| `/legal/terms` | Merchant Terms of Service |
| `/legal/cpa` | Consumer Protection Act compliance |
| `/legal/dpa` | Data Processing Agreements |
| `/legal/ecta` | ECT Act compliance |

---

## Regulatory Compliance

Flamingo Pay operates under the following South African regulations:

| Regulation | Coverage |
|-----------|---------|
| **POPIA** (Act 4 of 2013) | Privacy policy, data processing agreements, DSAR handling (Section 23/24), breach notification (Section 22), cross-border transfers (Section 72) |
| **FICA** (Act 38 of 2001) | KYC verification, 5-year record retention (Section 22), suspicious transaction reporting |
| **CPA** (Act 68 of 2008) | Consumer protection, cooling-off rights, refunds, plain language, receipts, complaints |
| **ECTA** (Act 25 of 2002) | Website disclosures (Section 43), automated transactions (Section 20), data messages, cooling-off (Section 44), unsolicited communications (Section 45) |
| **NPS Act** (Act 78 of 1998) | Payment system compliance via Ozow (PASA-regulated) |

**Information Officer:** Shawn Henderson — compliance@flamingopay.co.za
**Compliance Officer:** Siphokazi Gazi — compliance@flamingopay.co.za

---

## Environment Variables

```env
# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Ozow payments
OZOW_SITE_CODE=
OZOW_API_KEY=
OZOW_PRIVATE_KEY=
OZOW_NOTIFY_URL=

# Admin auth
ADMIN_EMAIL=
ADMIN_PASSWORD=

# Compliance auth
COMPLIANCE_OWNER_EMAIL=
COMPLIANCE_OWNER_PASSWORD=

# Sentry
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# Web Push (VAPID keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Vercel Blob (document uploads)
BLOB_READ_WRITE_TOKEN=
```

---

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

Push to `main` branch on GitHub — Vercel auto-deploys.

```bash
git push origin main
```

Production URL: [www.flamingopay.co.za](https://www.flamingopay.co.za)

---

## Key Personnel

| Role | Name | Contact |
|------|------|---------|
| Founder | Msizi | msizi@brocabs.co.za |
| Information Officer | Shawn Henderson | compliance@flamingopay.co.za |
| Compliance Officer | Siphokazi Gazi | compliance@flamingopay.co.za |

---

## License

Proprietary — Flamingo Pay (Pty) Ltd. All rights reserved.
