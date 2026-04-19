# Flamingo Pay API Documentation

**Version:** 1.0.0  
**Base URL:** `https://flamingopay.local/api`  
**Last Updated:** April 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Error Codes](#error-codes)
5. [Authentication Endpoints](#authentication-endpoints)
6. [Merchant Endpoints](#merchant-endpoints)
7. [Admin Endpoints](#admin-endpoints)
8. [Compliance Endpoints](#compliance-endpoints)
9. [Sanctions Endpoints](#sanctions-endpoints)
10. [Complaint Management](#complaint-management)
11. [Webhooks](#webhooks)
12. [Notifications](#notifications)
13. [Document Management](#document-management)

---

## Overview

Flamingo Pay is a payment processing and merchant management platform for South African financial institutions. The API provides endpoints for:

- Merchant registration, onboarding, and account management
- Payment transaction processing and reconciliation
- Compliance monitoring, flagging, and merchant freeze/unfreeze
- Sanctions screening and PEP (Politically Exposed Persons) list checks
- Complaint management and escalation
- Real-time payment notifications via webhooks
- Document/KYC management
- Admin staff management and audit logging

### Key Features

- **Multi-role authentication:** Merchants, admin staff, and compliance officers
- **Real-time payment processing:** Ozow and PayShap payment rails
- **Regulatory compliance:** Sanctions screening, compliance flags, audit trails
- **Merchant lifecycle:** From signup through approval to transactions
- **POPIA compliance:** Right to erasure and data protection

---

## Authentication

Flamingo Pay uses two authentication mechanisms:

### 1. Session-Based Auth (Admin & Compliance)

Admin and compliance staff log in via email/password or passcode. Sessions are stored as **HTTP-only cookies** on the server.

**Cookie Name:** `flamingo_session`  
**Expiry:** Configurable (typically 24 hours)  
**Secure Flag:** Required (HTTPS only)  
**HttpOnly Flag:** Required (JavaScript cannot access)

#### Flow

```
POST /auth/login { email, password } → Session cookie set
GET /auth/session → Returns { authenticated: true, staff: {...} }
POST /auth/logout → Session destroyed
```

### 2. Client-Side Auth (Merchants)

Merchants authenticate by merchantId and PIN. The response includes merchant details; session state is managed client-side (localStorage or similar).

#### Flow

```
POST /auth/merchant-login { phone, pin } → Returns merchant object
POST /merchants/:id/update → Include merchantId in header or path
```

### OTP-Based Authentication

For sensitive operations (PIN reset, 2FA):

```
1. POST /auth/otp { phone, purpose, action: "send" } → OTP sent
2. POST /auth/otp { phone, purpose, action: "verify", code } → Code verified
3. POST /auth/pin-reset { phone, newPin, otpCode } → PIN reset
```

#### Supported OTP Purposes

- `login_2fa` - Two-factor authentication for login
- `pin_reset` - Merchant PIN reset
- `signup` - Account creation

---

## Rate Limiting

Flamingo Pay enforces rate limits to prevent abuse:

| Endpoint Category | Limit | Window |
|---|---|---|
| **General API** | 60 requests | 1 minute |
| **Authentication** | 10 requests | 1 minute |
| **OTP** | 10 requests | 1 minute |
| **File Upload** | 20 requests | 1 minute |

### Response Headers

All rate-limited responses include:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1618500000
```

### When Limit Exceeded

- **Status Code:** `429 Too Many Requests`
- **Retry-After:** Provided in response (seconds)

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 30
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Example |
|---|---|---|
| 200 | OK - Request succeeded | Successful GET, PATCH, POST |
| 201 | Created - Resource created | Merchant created, transaction created |
| 400 | Bad Request - Invalid input | Missing required fields |
| 401 | Unauthorized - Invalid credentials | Wrong PIN, invalid token |
| 403 | Forbidden - Insufficient permissions | Non-owner trying to manage staff |
| 404 | Not Found - Resource doesn't exist | Merchant/transaction not found |
| 409 | Conflict - Resource already exists | Phone already registered |
| 429 | Too Many Requests - Rate limited | See Rate Limiting section |
| 500 | Internal Server Error - Server error | Unexpected error |
| 503 | Service Unavailable - System down | Blob storage not configured |

### Error Response Format

All errors return JSON with an `error` field:

```json
{
  "error": "Invalid PIN",
  "attemptsLeft": 2,
  "lockedUntil": "2026-04-19T14:30:00Z"
}
```

### Common Error Scenarios

#### Invalid Merchant Status

```json
{
  "error": "status must be one of: pending, approved, rejected, suspended"
}
```

#### Merchant Not Approved

```json
{
  "error": "Merchant not approved",
  "merchantStatus": "pending"
}
```

#### Document Validation Failed

```json
{
  "error": "File type not allowed. Use JPEG, PNG, WebP, or PDF."
}
```

---

## Authentication Endpoints

### POST /auth/login

**Purpose:** Authenticate as merchant, admin, or compliance officer.

**Request:**

```bash
curl -X POST https://flamingopay.local/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "role": "merchant",
    "merchantId": "m-abc123",
    "pin": "1234"
  }'
```

**For Admin/Compliance:**

```bash
curl -X POST https://flamingopay.local/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin",
    "passcode": "secret-admin-code",
    "name": "John Admin"
  }'
```

**Response (Merchant):**

```json
{
  "ok": true,
  "merchantId": "m-abc123",
  "name": "Acme Corp",
  "token": "eyJhbGc..."
}
```

**Response (Admin/Compliance):**

```json
{
  "ok": true,
  "name": "John Admin",
  "token": "eyJhbGc..."
}
```

**Errors:**
- `400` - Missing role, merchantId/pin, or passcode
- `401` - Invalid PIN (returns `attemptsLeft`, `lockedUntil`)
- `401` - Invalid passcode

**Rate Limit:** 10 requests/minute

---

### POST /auth/merchant-login

**Purpose:** Merchant login by phone and PIN (alternative to generic login).

**Request:**

```bash
curl -X POST https://flamingopay.local/api/auth/merchant-login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+27821234567",
    "pin": "1234"
  }'
```

**Response:**

```json
{
  "merchant": {
    "id": "m-abc123",
    "phone": "+27821234567",
    "businessName": "Acme Corp",
    "businessType": "retail",
    "ownerName": "John Doe",
    "bank": "Capitec",
    "accountNumber": "1234567890",
    "accountType": "savings",
    "status": "approved",
    "frozen": false,
    "createdAt": "2026-03-01T10:00:00Z",
    "documents": [...]
  }
}
```

**Errors:**
- `400` - Invalid PIN format (must be 4 digits)
- `401` - Invalid phone/PIN (may include `attemptsLeft`, `lockedUntil`)
- `429` - Account locked (too many attempts)

**Rate Limit:** 10 requests/minute

---

### POST /auth/logout

**Purpose:** Destroy current session.

**Request:**

```bash
curl -X POST https://flamingopay.local/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"role": "merchant"}'
```

**Response:**

```json
{
  "ok": true
}
```

---

### GET /auth/session

**Purpose:** Check if current user is authenticated.

**Request:**

```bash
curl -X GET "https://flamingopay.local/api/auth/session?role=merchant"
```

**Response (Authenticated):**

```json
{
  "authenticated": true,
  "role": "merchant",
  "id": "m-abc123",
  "name": "Acme Corp",
  "lastActiveAt": "2026-04-19T12:00:00Z"
}
```

**Response (Not Authenticated):**

```json
{
  "authenticated": false
}
```

---

### POST /auth/otp

**Purpose:** Send or verify OTP code.

**Request (Send):**

```bash
curl -X POST https://flamingopay.local/api/auth/otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+27821234567",
    "purpose": "pin_reset",
    "action": "send"
  }'
```

**Response (Send):**

```json
{
  "sent": true,
  "expiresIn": 900,
  "devOTP": "123456"
}
```

**Request (Verify):**

```bash
curl -X POST https://flamingopay.local/api/auth/otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+27821234567",
    "purpose": "pin_reset",
    "action": "verify",
    "code": "123456"
  }'
```

**Response (Verify):**

```json
{
  "verified": true
}
```

**Errors:**
- `400` - Invalid purpose (must be: login_2fa, pin_reset, signup)
- `429` - Too many attempts, retry after X seconds

---

### POST /auth/pin-reset

**Purpose:** Reset merchant PIN after OTP verification.

**Request:**

```bash
curl -X POST https://flamingopay.local/api/auth/pin-reset \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+27821234567",
    "newPin": "5678",
    "otpCode": "123456"
  }'
```

**Response:**

```json
{
  "reset": true
}
```

**Errors:**
- `400` - PIN must be exactly 4 digits
- `400` - OTP code required

---

## Merchant Endpoints

### POST /merchants

**Purpose:** Create merchant account (onboarding).

**Request:**

```bash
curl -X POST https://flamingopay.local/api/merchants \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+27821234567",
    "businessName": "Acme Corp",
    "businessType": "retail",
    "ownerName": "John Doe",
    "address": "123 Main St, Cape Town",
    "bank": "Capitec",
    "accountNumber": "1234567890",
    "accountType": "savings",
    "expectedMonthlyVolume": 50000
  }'
```

**Response:**

```json
{
  "merchant": {
    "id": "m-abc123",
    "phone": "+27821234567",
    "businessName": "Acme Corp",
    "businessType": "retail",
    "ownerName": "John Doe",
    "address": "123 Main St, Cape Town",
    "bank": "Capitec",
    "accountNumber": "1234567890",
    "accountType": "savings",
    "expectedMonthlyVolume": 50000,
    "status": "pending",
    "frozen": false,
    "createdAt": "2026-04-19T12:00:00Z",
    "documents": [
      {
        "kind": "id",
        "status": "required",
        "fileName": null,
        "blobUrl": null
      },
      ...
    ]
  }
}
```

**Errors:**
- `400` - Missing required fields
- `409` - Phone already registered

---

### GET /merchants

**Purpose:** List all merchants.

**Request:**

```bash
curl -X GET https://flamingopay.local/api/merchants
```

**Response:**

```json
{
  "merchants": [
    { "id": "m-abc123", "businessName": "Acme Corp", ... },
    { "id": "m-xyz789", "businessName": "Tech Ltd", ... }
  ]
}
```

---

### GET /merchants/{id}

**Purpose:** Get merchant details by ID.

**Request:**

```bash
curl -X GET https://flamingopay.local/api/merchants/m-abc123
```

**Response:**

```json
{
  "merchant": {
    "id": "m-abc123",
    "phone": "+27821234567",
    "businessName": "Acme Corp",
    ...
  }
}
```

**Errors:**
- `404` - Merchant not found

---

### PATCH /merchants/{id}/status

**Purpose:** Update merchant approval status (admin only).

**Authorization:** Admin session required

**Request:**

```bash
curl -X PATCH https://flamingopay.local/api/merchants/m-abc123/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved"
  }'
```

**With Rejection Reason:**

```bash
curl -X PATCH https://flamingopay.local/api/merchants/m-abc123/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "reason": "Documents incomplete"
  }'
```

**Response:**

```json
{
  "merchant": {
    "id": "m-abc123",
    "status": "approved",
    ...
  }
}
```

**Status Transitions:**
- `pending` → `approved` (accept merchant)
- `pending` → `rejected` (reject with reason required)
- `approved` → `suspended` (freeze merchant for violations)
- `suspended` → `pending` (unsuspend merchant)

---

### GET /merchants/{id}/transactions

**Purpose:** List merchant transactions with stats.

**Request:**

```bash
curl -X GET https://flamingopay.local/api/merchants/m-abc123/transactions
```

**Response:**

```json
{
  "transactions": [
    {
      "id": "txn-123",
      "merchantId": "m-abc123",
      "amount": 5000,
      "rail": "eft",
      "buyerBank": "Capitec",
      "reference": "INV-001",
      "status": "completed",
      "timestamp": "2026-04-19T10:30:00Z"
    }
  ],
  "stats": {
    "total": 250000,
    "count": 15,
    "pending": 2,
    "completed": 13
  }
}
```

---

### POST /merchants/{id}/transactions

**Purpose:** Create transaction (for approved merchants).

**Request:**

```bash
curl -X POST https://flamingopay.local/api/merchants/m-abc123/transactions \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "amount": 5000,
    "rail": "eft",
    "buyerBank": "FNB"
  }'
```

**Response:**

```json
{
  "transaction": {
    "id": "txn-abc123",
    "merchantId": "m-abc123",
    "amount": 5000,
    "rail": "eft",
    "buyerBank": "FNB",
    "status": "pending",
    "timestamp": "2026-04-19T12:00:00Z"
  }
}
```

**Errors:**
- `403` - Merchant not approved
- `404` - Merchant not found

**Optional Headers:**
- `Idempotency-Key` - Prevents duplicate transactions

---

### POST /merchants/{id}/transactions/{txnId}/refund

**Purpose:** Refund transaction (full or partial).

**Request:**

```bash
curl -X POST https://flamingopay.local/api/merchants/m-abc123/transactions/txn-123/refund \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2500,
    "reason": "Customer requested partial refund"
  }'
```

**Response:**

```json
{
  "txn": {
    "id": "txn-123",
    "status": "refunded",
    "refundedAmount": 2500
  }
}
```

**Full Refund (no body needed):**

```bash
curl -X POST https://flamingopay.local/api/merchants/m-abc123/transactions/txn-123/refund
```

---

### GET /merchants/{id}/documents

**Purpose:** Get merchant KYC documents.

**Request:**

```bash
curl -X GET https://flamingopay.local/api/merchants/m-abc123/documents
```

**Response:**

```json
{
  "documents": [
    {
      "kind": "id",
      "status": "submitted",
      "fileName": "id-john-doe.jpg",
      "blobUrl": "https://...blob.vercel-storage.com/...",
      "uploadedAt": "2026-04-19T10:00:00Z"
    },
    {
      "kind": "selfie",
      "status": "required",
      "fileName": null
    }
  ]
}
```

---

### PATCH /merchants/{id}/documents

**Purpose:** Update document status (admin only).

**Authorization:** Admin session required

**Request:**

```bash
curl -X PATCH https://flamingopay.local/api/merchants/m-abc123/documents \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "id",
    "status": "verified",
    "note": "Document verified by officer"
  }'
```

**Response:**

```json
{
  "merchant": {
    "id": "m-abc123",
    "documents": [...]
  }
}
```

**Document Kinds:**
- `id` - Government ID (national ID, passport)
- `selfie` - Merchant selfie with ID
- `affidavit` - Signed affidavit
- `company_reg` - Company registration document
- `proof_of_address` - Utility bill or lease
- `bank_letter` - Bank authorization letter

**Document Statuses:**
- `required` - Document needed
- `submitted` - Awaiting review
- `verified` - Approved
- `rejected` - Not accepted, resubmit needed

---

### GET /merchants/{id}/export

**Purpose:** Export transactions as CSV.

**Request:**

```bash
curl -X GET https://flamingopay.local/api/merchants/m-abc123/export \
  -o transactions.csv
```

**Response:** CSV file

```
Date,Reference,Amount (ZAR),Rail,Buyer Bank,Status
2026-04-19 10:30,INV-001,5000.00,EFT,Capitec,completed
2026-04-18 15:45,INV-002,3500.00,PAYSHAP,FNB,completed
```

---

### GET /merchants/{id}/statement

**Purpose:** Generate transaction statement PDF.

**Query Parameters:**

- `month=YYYY-MM` - Calendar month (e.g., 2026-03)
- `from=YYYY-MM-DD` & `to=YYYY-MM-DD` - Custom date range

**Request (Calendar Month):**

```bash
curl -X GET "https://flamingopay.local/api/merchants/m-abc123/statement?month=2026-03" \
  -o statement.pdf
```

**Request (Custom Range):**

```bash
curl -X GET "https://flamingopay.local/api/merchants/m-abc123/statement?from=2026-03-01&to=2026-03-31" \
  -o statement.pdf
```

**Response:** PDF file with statement

---

### PATCH /merchants/{id}/update

**Purpose:** Update merchant profile.

**Authorization:** Merchant or admin session required  
**Restriction:** Merchants can only update their own profile

**Request:**

```bash
curl -X PATCH https://flamingopay.local/api/merchants/m-abc123/update \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Acme Corp (Updated)",
    "address": "456 New St, Cape Town",
    "bank": "FNB"
  }'
```

**Response:**

```json
{
  "merchant": { ... },
  "changed": true
}
```

**Editable Fields:**
- `businessName`
- `address`
- `ownerName`
- `bank`
- `accountType`

---

### DELETE /merchants/{id}/update

**Purpose:** Delete merchant account (POPIA erasure right).

**Authorization:** Merchant session required  
**Restriction:** Can only delete own account

**Request:**

```bash
curl -X DELETE https://flamingopay.local/api/merchants/m-abc123/update
```

**Response:**

```json
{
  "deleted": true
}
```

---

### GET /merchants/check-phone

**Purpose:** Check if phone is already registered.

**Request:**

```bash
curl -X GET "https://flamingopay.local/api/merchants/check-phone?phone=%2B27821234567"
```

**Response:**

```json
{
  "exists": false
}
```

---

## Admin Endpoints

### POST /admin/login

**Purpose:** Admin staff login (email + password).

**Request:**

```bash
curl -X POST https://flamingopay.local/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@flamingopay.local",
    "password": "secure-password"
  }'
```

**Response:**

```json
{
  "ok": true,
  "staff": {
    "id": "staff-123",
    "name": "John Admin",
    "email": "admin@flamingopay.local",
    "role": "manager"
  }
}
```

**Session Cookie:** `flamingo_session` (HTTP-only)

---

### GET /admin/session

**Purpose:** Check current admin session.

**Authorization:** Session cookie required

**Request:**

```bash
curl -X GET https://flamingopay.local/api/admin/session \
  -H "Cookie: flamingo_session=..."
```

**Response:**

```json
{
  "authenticated": true,
  "staff": {
    "id": "staff-123",
    "name": "John Admin",
    "email": "admin@flamingopay.local",
    "role": "manager"
  }
}
```

---

### DELETE /admin/session

**Purpose:** Logout.

**Request:**

```bash
curl -X DELETE https://flamingopay.local/api/admin/session
```

**Response:**

```json
{
  "ok": true
}
```

---

### GET /admin/staff

**Purpose:** List all staff members (owner only).

**Authorization:** Admin session required (owner role)

**Request:**

```bash
curl -X GET https://flamingopay.local/api/admin/staff \
  -H "Cookie: flamingo_session=..."
```

**Response:**

```json
{
  "staff": [
    {
      "id": "staff-123",
      "email": "admin@flamingopay.local",
      "name": "John Admin",
      "role": "manager",
      "active": true,
      "createdAt": "2026-03-01T10:00:00Z",
      "lastLoginAt": "2026-04-19T12:00:00Z"
    }
  ]
}
```

---

### POST /admin/staff

**Purpose:** Create staff member (owner only).

**Request:**

```bash
curl -X POST https://flamingopay.local/api/admin/staff \
  -H "Content-Type: application/json" \
  -H "Cookie: flamingo_session=..." \
  -d '{
    "email": "newstaff@flamingopay.local",
    "name": "Jane Manager",
    "role": "manager",
    "password": "initial-password-123"
  }'
```

**Response:**

```json
{
  "ok": true,
  "staff": {
    "id": "staff-456",
    "email": "newstaff@flamingopay.local",
    "name": "Jane Manager",
    "role": "manager",
    "active": true,
    "createdAt": "2026-04-19T12:00:00Z"
  }
}
```

**Roles:**
- `owner` - Full system access
- `manager` - Can manage staff and merchants
- `staff` - Limited access (view-only)

---

### PATCH /admin/staff/{id}

**Purpose:** Update staff member (owner only).

**Request:**

```bash
curl -X PATCH https://flamingopay.local/api/admin/staff/staff-456 \
  -H "Content-Type: application/json" \
  -H "Cookie: flamingo_session=..." \
  -d '{
    "role": "staff",
    "active": false
  }'
```

**Response:**

```json
{
  "ok": true,
  "staff": {
    "id": "staff-456",
    "role": "staff",
    "active": false
  }
}
```

**Updatable Fields:**
- `name`
- `role`
- `password`
- `active`

---

### DELETE /admin/staff/{id}

**Purpose:** Remove staff member (owner only).

**Request:**

```bash
curl -X DELETE https://flamingopay.local/api/admin/staff/staff-456 \
  -H "Cookie: flamingo_session=..."
```

**Response:**

```json
{
  "ok": true,
  "deleted": "staff-456"
}
```

---

### GET /admin/audit

**Purpose:** Query audit log.

**Authorization:** Admin session required

**Query Parameters:**

- `action` - Filter by action (e.g., "login", "merchant_approved")
- `role` - Filter by actor role
- `actorId` - Filter by actor ID
- `targetId` - Filter by target ID
- `limit` - Number of entries (default: 200)

**Request:**

```bash
curl -X GET "https://flamingopay.local/api/admin/audit?role=merchant&targetType=transaction&limit=50" \
  -H "Cookie: flamingo_session=..."
```

**Response:**

```json
{
  "entries": [
    {
      "id": "log-123",
      "timestamp": "2026-04-19T12:00:00Z",
      "action": "transaction_created",
      "role": "merchant",
      "actorId": "m-abc123",
      "actorName": "Acme Corp",
      "targetId": "txn-123",
      "targetType": "transaction",
      "detail": "Payment confirmed: R5000.00 via Ozow",
      "ip": "192.168.1.1"
    }
  ],
  "total": 42
}
```

---

### GET /admin/search

**Purpose:** Search merchants and transactions.

**Authorization:** Admin session required

**Query Parameters:**

- `q` - Search query (searches name, phone, business name)
- `limit` - Max results (1-50, default: 20)

**Request:**

```bash
curl -X GET "https://flamingopay.local/api/admin/search?q=acme&limit=10" \
  -H "Cookie: flamingo_session=..."
```

**Response:**

```json
{
  "q": "acme",
  "hits": [
    { "type": "merchant", "id": "m-abc123", "name": "Acme Corp", ... },
    { "type": "transaction", "id": "txn-456", "merchantId": "m-abc123", ... }
  ]
}
```

---

### POST /admin/cleanup-merchants

**Purpose:** Find and remove corrupted merchant records.

**Query Parameters:**

- `dry=true` (default) - Dry-run: list corrupted records without deleting
- `dry=false` - Actually delete corrupted records

**Request (Dry Run):**

```bash
curl -X POST "https://flamingopay.local/api/admin/cleanup-merchants?dry=true" \
  -H "x-admin-key: flamingo2026"
```

**Response:**

```json
{
  "mode": "dry_run",
  "totalRecords": 45,
  "healthyCount": 43,
  "corruptedCount": 2,
  "corrupted": [
    { "id": "m-corrupt1", "error": "Decrypt/parse failed: ..." }
  ],
  "hint": "Add ?dry=false to actually delete corrupted records"
}
```

---

## Compliance Endpoints

### GET /compliance/flags

**Purpose:** List compliance flags.

**Authorization:** Compliance or admin session required

**Query Parameters:**

- `status` - Filter by status (open, investigating, cleared, confirmed)
- `merchantId` - Filter by merchant

**Request:**

```bash
curl -X GET "https://flamingopay.local/api/compliance/flags?status=open" \
  -H "Cookie: flamingo_session=..."
```

**Response:**

```json
{
  "flags": [
    {
      "id": "flag-123",
      "merchantId": "m-abc123",
      "txnId": "txn-456",
      "reason": "Suspicious transaction pattern",
      "status": "open",
      "createdAt": "2026-04-19T10:00:00Z"
    }
  ]
}
```

---

### POST /compliance/flags

**Purpose:** Create manual compliance flag.

**Request:**

```bash
curl -X POST https://flamingopay.local/api/compliance/flags \
  -H "Content-Type: application/json" \
  -H "Cookie: flamingo_session=..." \
  -d '{
    "merchantId": "m-abc123",
    "txnId": "txn-456",
    "note": "Multiple rapid transactions detected",
    "officerName": "Jane Compliance"
  }'
```

**Response:**

```json
{
  "flag": {
    "id": "flag-123",
    "merchantId": "m-abc123",
    "txnId": "txn-456",
    "reason": "Multiple rapid transactions detected",
    "status": "open",
    "createdAt": "2026-04-19T12:00:00Z"
  }
}
```

---

### GET /compliance/flags/{flagId}

**Purpose:** Get flag details.

**Request:**

```bash
curl -X GET https://flamingopay.local/api/compliance/flags/flag-123
```

**Response:**

```json
{
  "flag": {
    "id": "flag-123",
    "merchantId": "m-abc123",
    "txnId": "txn-456",
    "status": "investigating",
    "officerNote": "Under review",
    "resolvedAt": null
  }
}
```

---

### PATCH /compliance/flags/{flagId}

**Purpose:** Update flag status.

**Request:**

```bash
curl -X PATCH https://flamingopay.local/api/compliance/flags/flag-123 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "cleared",
    "officerNote": "No suspicious activity confirmed",
    "resolvedBy": "Jane Compliance"
  }'
```

**Response:**

```json
{
  "flag": {
    "id": "flag-123",
    "status": "cleared",
    "resolvedAt": "2026-04-19T12:00:00Z"
  }
}
```

---

### POST /compliance/freeze

**Purpose:** Freeze or unfreeze merchant account.

**Request (Freeze):**

```bash
curl -X POST https://flamingopay.local/api/compliance/freeze \
  -H "Content-Type: application/json" \
  -H "Cookie: flamingo_session=..." \
  -d '{
    "merchantId": "m-abc123",
    "action": "freeze",
    "reason": "Sanctions match detected"
  }'
```

**Request (Unfreeze):**

```bash
curl -X POST https://flamingopay.local/api/compliance/freeze \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "m-abc123",
    "action": "unfreeze"
  }'
```

**Response:**

```json
{
  "merchant": { ... },
  "action": "frozen"
}
```

---

### GET /compliance/stats

**Purpose:** Get compliance statistics.

**Request:**

```bash
curl -X GET https://flamingopay.local/api/compliance/stats \
  -H "Cookie: flamingo_session=..."
```

**Response:**

```json
{
  "totalMerchants": 250,
  "approvedMerchants": 180,
  "pendingMerchants": 40,
  "suspendedMerchants": 15,
  "frozenMerchants": 15,
  "flaggedMerchants": 8,
  "openFlags": 5,
  "investigatingFlags": 2,
  "clearedFlags": 18,
  "confirmedFlags": 1
}
```

---

## Sanctions Endpoints

### POST /sanctions/batch

**Purpose:** Batch re-screen all merchants (owner/manager only).

**Authorization:** Admin session (owner/manager) required

**Request:**

```bash
curl -X POST https://flamingopay.local/api/sanctions/batch \
  -H "Cookie: flamingo_session=..."
```

**Response:**

```json
{
  "ok": true,
  "screened": 250,
  "flagged": 2,
  "cleared": 248
}
```

**Note:** This is a long-running operation (max 120 seconds).

---

### POST /sanctions/refresh

**Purpose:** Refresh sanctions and PEP lists from OpenSanctions (owner/manager only).

**Request:**

```bash
curl -X POST https://flamingopay.local/api/sanctions/refresh \
  -H "Cookie: flamingo_session=..."
```

**Response:**

```json
{
  "ok": true,
  "meta": {
    "source": "OpenSanctions",
    "version": "2026-04-19",
    "count": 45000,
    "lastUpdated": "2026-04-19T12:00:00Z"
  },
  "pepMeta": {
    "source": "OpenSanctions PEP",
    "count": 12000,
    "lastUpdated": "2026-04-19T12:00:00Z"
  }
}
```

---

### GET /sanctions/flags

**Purpose:** List sanctions flags.

**Authorization:** Admin session required

**Request:**

```bash
curl -X GET https://flamingopay.local/api/sanctions/flags \
  -H "Cookie: flamingo_session=..."
```

**Response:**

```json
{
  "flags": [
    {
      "merchantId": "m-xyz789",
      "businessName": "Suspicious Corp",
      "sanctionsMatches": ["Vladimir Popov"],
      "pepMatches": [],
      "status": "pending"
    }
  ],
  "meta": { ... },
  "pepMeta": { ... },
  "pepProvider": "OpenSanctions"
}
```

---

### POST /sanctions/flags

**Purpose:** Resolve sanctions flag (owner/manager only).

**Request:**

```bash
curl -X POST https://flamingopay.local/api/sanctions/flags \
  -H "Content-Type: application/json" \
  -H "Cookie: flamingo_session=..." \
  -d '{
    "merchantId": "m-xyz789",
    "status": "cleared",
    "note": "False positive - different person"
  }'
```

**Response:**

```json
{
  "ok": true,
  "flag": {
    "merchantId": "m-xyz789",
    "status": "cleared",
    "resolvedAt": "2026-04-19T12:00:00Z"
  }
}
```

**Status Options:**
- `cleared` - False positive, no action needed
- `blocked` - Merchant blocked and status set to "rejected"

---

### POST /sanctions/screen

**Purpose:** Screen name or merchant against sanctions lists.

**Authorization:** Admin session required

**Request (Single Name):**

```bash
curl -X POST https://flamingopay.local/api/sanctions/screen \
  -H "Content-Type: application/json" \
  -H "Cookie: flamingo_session=..." \
  -d '{
    "name": "Vladimir Putin"
  }'
```

**Request (Full Merchant):**

```bash
curl -X POST https://flamingopay.local/api/sanctions/screen \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Acme Trading Corp",
    "ownerName": "John Doe",
    "merchantId": "m-abc123"
  }'
```

**Response:**

```json
{
  "matched": true,
  "score": 87,
  "matchType": "fuzzy",
  "matchedName": "Vladimir Putin",
  "sanctionsMatched": true,
  "pepMatched": false,
  "entries": [
    {
      "name": "Vladimir Vladimirovich Putin",
      "list": "OFAC Specially Designated Nationals",
      "score": 87
    }
  ]
}
```

---

## Complaint Management

### GET /complaints

**Purpose:** List complaints.

**Query Parameters:**

- `merchantId` - Filter by merchant
- `status` - Filter by status
- `category` - Filter by category

**Request:**

```bash
curl -X GET "https://flamingopay.local/api/complaints?status=open&limit=20"
```

**Response:**

```json
{
  "complaints": [
    {
      "id": "complaint-123",
      "merchantId": "m-abc123",
      "merchantName": "Acme Corp",
      "complainantName": "John Customer",
      "complainantEmail": "john@example.com",
      "category": "quality",
      "subject": "Defective product",
      "description": "Product arrived broken",
      "status": "open",
      "level": "level_1",
      "createdAt": "2026-04-19T10:00:00Z"
    }
  ]
}
```

---

### POST /complaints

**Purpose:** Create complaint.

**Request:**

```bash
curl -X POST https://flamingopay.local/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "m-abc123",
    "complainantName": "John Customer",
    "complainantEmail": "john@example.com",
    "complainantPhone": "+27871234567",
    "category": "refund",
    "subject": "Refund not received",
    "description": "Ordered item on 2026-04-15, still no refund",
    "relatedTxnId": "txn-456"
  }'
```

**Response:**

```json
{
  "ok": true,
  "complaint": {
    "id": "complaint-456",
    "merchantId": "m-abc123",
    "status": "open",
    "level": "level_1",
    "createdAt": "2026-04-19T12:00:00Z"
  }
}
```

**Categories:**
- `fraud` - Suspected fraudulent activity
- `quality` - Poor product/service quality
- `delivery` - Late or non-delivery
- `refund` - Refund issues
- `other` - Other complaints

---

### GET /complaints/{id}

**Purpose:** Get complaint details.

**Request:**

```bash
curl -X GET https://flamingopay.local/api/complaints/complaint-123
```

---

### PATCH /complaints/{id}

**Purpose:** Update complaint (admin only).

**Request:**

```bash
curl -X PATCH https://flamingopay.local/api/complaints/complaint-123 \
  -H "Content-Type: application/json" \
  -H "Cookie: flamingo_session=..." \
  -d '{
    "status": "in_progress",
    "handler": "jane@flamingopay.local",
    "level": "level_2"
  }'
```

**Response:**

```json
{
  "ok": true,
  "complaint": { ... }
}
```

---

### GET /complaints/stats

**Purpose:** Get complaint statistics (admin only).

**Request:**

```bash
curl -X GET https://flamingopay.local/api/complaints/stats \
  -H "Cookie: flamingo_session=..."
```

**Response:**

```json
{
  "total": 127,
  "byStatus": {
    "open": 23,
    "in_progress": 45,
    "resolved": 55,
    "escalated": 4
  },
  "byCategory": {
    "fraud": 12,
    "quality": 45,
    "delivery": 35,
    "refund": 28,
    "other": 7
  },
  "avgResolutionTime": 4.2
}
```

---

## Webhooks

### POST /webhooks/ozow

**Purpose:** Receive payment notifications from Ozow payment gateway.

**Headers:**

- `X-Ozow-Signature` - HMAC-SHA256 signature (verified by API)

**Payload Example:**

```json
{
  "TransactionId": "ozow-txn-123",
  "TransactionReference": "FP-m-abc123-001",
  "Status": "Complete",
  "Amount": "5000.00",
  "Optional1": "m-abc123"
}
```

**Processing:**

1. API verifies Ozow signature
2. Extracts merchant ID from Optional1 field
3. Creates/updates internal transaction record
4. Logs to audit trail

**Response:**

```json
{
  "received": true,
  "transactionId": "txn-123"
}
```

---

### POST /webhooks/payshap

**Purpose:** Receive payment notifications from PayShap real-time payment rail.

**Headers:**

- `X-PayShap-Signature` - HMAC-SHA256 signature (verified by API)

**Payload Example (Payment Completed):**

```json
{
  "eventType": "payment.completed",
  "paymentId": "payshap-123",
  "merchantReference": "FP-m-abc123-001",
  "amount": 5000,
  "buyerBank": "Capitec",
  "status": "success"
}
```

**Event Types:**

- `payment.completed` - Payment successful
- `payment.refunded` - Refund processed
- `payment.failed` - Payment failed
- `settlement.completed` - Settlement paid to merchant

**Response:**

```json
{
  "received": true,
  "status": "settlement_logged"
}
```

---

## Notifications

### POST /push/subscribe

**Purpose:** Register push notification subscription.

**Request:**

```bash
curl -X POST https://flamingopay.local/api/push/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "m-abc123",
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/...",
      "keys": {
        "p256dh": "base64-encoded-key",
        "auth": "base64-encoded-auth"
      }
    }
  }'
```

**Response:**

```json
{
  "ok": true
}
```

---

### DELETE /push/subscribe

**Purpose:** Unsubscribe from push notifications.

**Request:**

```bash
curl -X DELETE https://flamingopay.local/api/push/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "m-abc123",
    "endpoint": "https://fcm.googleapis.com/..."
  }'
```

---

### POST /notifications/test

**Purpose:** Send test payment notification (admin only).

**Request:**

```bash
curl -X POST https://flamingopay.local/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Cookie: flamingo_session=..." \
  -d '{
    "merchantId": "m-abc123"
  }'
```

**Alternative (direct phone):**

```bash
curl -X POST https://flamingopay.local/api/notifications/test \
  -d '{
    "phone": "+27821234567",
    "merchantName": "Test Merchant"
  }'
```

**Response:**

```json
{
  "whatsappSent": true,
  "smsSent": false,
  "config": {
    "whatsappConfigured": true,
    "smsConfigured": false
  },
  "phoneSent": "+27821234567"
}
```

---

## Document Management

### POST /upload

**Purpose:** Upload KYC documents (ID, selfie, affidavit, etc.).

**Request:**

```bash
curl -X POST https://flamingopay.local/api/upload \
  -F "file=@/path/to/document.jpg" \
  -F "merchantId=m-abc123" \
  -F "kind=id"
```

**Response:**

```json
{
  "url": "https://...blob.vercel-storage.com/kyc/m-abc123/id-...",
  "kind": "id",
  "merchantId": "m-abc123",
  "fileName": "document.jpg"
}
```

**Allowed File Types:**
- JPEG (image/jpeg)
- PNG (image/png)
- WebP (image/webp)
- PDF (application/pdf)

**Max File Size:** 5 MB

**Rate Limit:** 20 requests/minute

---

### GET /documents/view

**Purpose:** View stored KYC document.

**Query Parameters:**

- `url` - Document blob URL

**Request:**

```bash
curl -X GET "https://flamingopay.local/api/documents/view?url=https%3A%2F%2F...blob.vercel-storage.com%2F..."
```

**Response:** Document file (JPEG, PNG, PDF, etc.)

---

### GET /receipt/{txnId}

**Purpose:** Get transaction receipt details.

**Request:**

```bash
curl -X GET https://flamingopay.local/api/receipt/txn-123
```

**Response:**

```json
{
  "txn": {
    "id": "txn-123",
    "amount": 5000,
    "reference": "INV-001",
    "status": "completed",
    "timestamp": "2026-04-19T10:30:00Z"
  },
  "merchantName": "Acme Corp",
  "merchantId": "m-abc123"
}
```

---

## Examples & Integration Guide

### Complete Merchant Onboarding Flow

```bash
# 1. Check if phone exists
curl -X GET "https://flamingopay.local/api/merchants/check-phone?phone=%2B27821234567"
# Response: { "exists": false }

# 2. Create merchant account
curl -X POST https://flamingopay.local/api/merchants \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+27821234567",
    "businessName": "Acme Corp",
    "businessType": "retail",
    "ownerName": "John Doe",
    "address": "123 Main St",
    "bank": "Capitec",
    "accountNumber": "123456789",
    "accountType": "savings",
    "expectedMonthlyVolume": 50000
  }'
# Response: { "merchant": { "id": "m-abc123", ... } }

# 3. Upload documents
curl -X POST https://flamingopay.local/api/upload \
  -F "file=@id.jpg" \
  -F "merchantId=m-abc123" \
  -F "kind=id"

# 4. Admin approves merchant
curl -X PATCH https://flamingopay.local/api/merchants/m-abc123/status \
  -H "Content-Type: application/json" \
  -H "Cookie: flamingo_session=..." \
  -d '{"status": "approved"}'

# 5. Merchant can now login and create transactions
curl -X POST https://flamingopay.local/api/auth/merchant-login \
  -H "Content-Type: application/json" \
  -d '{"phone": "+27821234567", "pin": "1234"}'
```

### Handling Sanctions Match

```bash
# Admin screens merchant
curl -X POST https://flamingopay.local/api/sanctions/screen \
  -d '{"businessName": "Acme Trading", "ownerName": "John Doe"}'
# Response: { "matched": true, "score": 75, ... }

# Resolve the flag
curl -X POST https://flamingopay.local/api/sanctions/flags \
  -H "Cookie: flamingo_session=..." \
  -d '{"merchantId": "m-abc123", "status": "cleared", "note": "False positive"}'
```

---

## API Versioning & Deprecation

- **Current Version:** 1.0.0
- **Deprecation Policy:** 6-month notice before breaking changes
- **URL:** Versioning via URL path (future: `/api/v2/...`)

---

## Support & Contact

For API support, bank partnerships, or technical questions:

- **Email:** support@flamingopay.local
- **Slack:** #flamingo-pay-integrations
- **Hours:** Monday-Friday, 08:00-17:00 SAST

---

## Changelog

### Version 1.0.0 (April 2026)

- Initial API release
- Full merchant lifecycle (signup → approval → transactions)
- Compliance & sanctions screening
- Webhook support (Ozow, PayShap)
- Admin staff management
- Complaint handling system
- Document/KYC management
