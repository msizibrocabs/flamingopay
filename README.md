# FlamingoPay

A payment processing service with an Express.js backend API and a Next.js frontend, connected via an API proxy.

## Project Structure

```
flamingopay/
├── src/                          # Express backend
│   ├── routes/                   # API route definitions
│   ├── controllers/              # Request handlers
│   ├── models/                   # Data models
│   ├── middleware/               # Express middleware
│   ├── utils/                    # Helper functions
│   ├── config/                   # Configuration files
│   └── app.js                    # Express app entry point
├── flamingo-pay-website/         # Next.js frontend
│   ├── app/                      # App Router pages & layouts
│   │   ├── test/page.tsx         # API proxy test page
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page
│   ├── public/                   # Static assets
│   ├── next.config.ts            # Next.js config (API proxy)
│   └── package.json              # Frontend dependencies
├── tests/                        # Backend test files
├── docs/                         # Documentation
├── .env.example                  # Environment variable template
├── .gitignore                    # Git ignore rules
├── package.json                  # Backend dependencies
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

## Tech Stack

- **Backend:** Node.js, Express
- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Tooling:** ESLint, Turbopack

## License

MIT
