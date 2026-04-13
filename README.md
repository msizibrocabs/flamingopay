# FlamingoPay

A payment processing service built with Node.js.

## Project Structure

```
flamingopay/
├── src/
│   ├── routes/         # API route definitions
│   ├── controllers/    # Request handlers
│   ├── models/         # Data models
│   ├── middleware/      # Express middleware
│   ├── utils/          # Helper functions
│   ├── config/         # Configuration files
│   └── app.js          # Express app setup
├── tests/              # Test files
├── docs/               # Documentation
├── public/             # Static assets
├── .env.example        # Environment variable template
├── .gitignore          # Git ignore rules
├── package.json        # Node.js dependencies
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm

### Installation

```bash
git clone <repo-url>
cd flamingopay
npm install
```

### Running

```bash
# Development
npm run dev

# Production
npm start
```

### Testing

```bash
npm test
```

## License

MIT
