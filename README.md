# Pauli Universe Video

The ultimate multimedia entertainment platform combining AI-generated video, interactive gaming, and creator tools.

## What is Pauli Universe?

Pauli Universe is a cutting-edge platform that transforms quantum physics concepts into engaging entertainment:

- **Cinema Studio**: AI-powered video generation featuring character consistency and professional color grading
- **Where's Pauli?**: Interactive hiding game with 9 difficulty levels and real-time leaderboards
- **Creator Engine**: Tools for creators to build and monetize their own Pauli Universe content
- **Bigsaws Podcast**: AI-generated audio discussions exploring quantum mechanics and cinema

## Repository Structure

```
pauli-universe-video/
├── packages/
│   ├── @pauli/shared/           # Shared types, constants, and utilities
│   ├── @pauli/cinema-core/      # Video generation and processing
│   ├── @pauli/game-engine/      # Game mechanics and logic
│   └── @pauli/engine-api/       # Creator dashboard and tools
├── apps/
│   ├── cinema/                  # Cinema Studio Next.js app
│   ├── game/                    # Where's Pauli? game app
│   ├── engine/                  # Creator Engine dashboard
│   ├── website/                 # Main landing page
│   └── podcast/                 # Bigsaws Podcast blog
├── services/
│   ├── gpu/                     # Modal.com GPU functions
│   └── workers/                 # Cloudflare Workers
├── database/
│   ├── migrations/              # SQL migrations (001-005)
│   ├── schema.sql               # Complete database schema
│   └── seed.sql                 # Test data
└── .github/workflows/           # GitHub Actions CI/CD
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (with pgvector extension)
- Stripe account for payments
- Modal.com account for GPU functions
- Supabase account for database

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run tests
pnpm test

# Run linting
pnpm lint

# Build all packages
pnpm build
```

### Development

```bash
# Start all apps and watch for changes
pnpm dev

# Cinema Studio (port 3001)
pnpm --filter app-cinema dev

# Where's Pauli? (port 3002)
pnpm --filter app-game dev

# Creator Engine (port 3003)
pnpm --filter app-engine dev

# Website (port 3000)
pnpm --filter app-website dev

# Podcast (port 3004)
pnpm --filter app-podcast dev
```

## Quality Standards

All code must meet these standards:

- ✅ **UDEC Score**: ≥8.5/10 on all 14 axes
- ✅ **Test Coverage**: ≥80%
- ✅ **Type Safety**: Strict TypeScript with no `any`
- ✅ **No Secrets**: All API keys in .env
- ✅ **No Incomplete Code**: No TODOs, FIXMEs, or stubs
- ✅ **Lint-Free**: ESLint and Prettier enforced
- ✅ **Deployable**: Builds and tests must pass

### Running Quality Checks

```bash
# Full quality check (build + test + lint + type-check)
pnpm build && pnpm test:coverage && pnpm lint && pnpm type-check

# Coverage threshold check
pnpm coverage-check 80

# Security check
grep -r "sk-" packages/ apps/ || echo "✓ No secrets found"
```

## Deployment

Each application deploys to Vercel with automatic GitHub Actions:

- **Cinema Studio**: `cinema.vercel.app`
- **Where's Pauli?**: `game.vercel.app`
- **Creator Engine**: `engine.vercel.app`
- **Website**: `pauli.vercel.app`
- **Podcast**: `podcast.vercel.app`

Manual deployment:

```bash
vercel deploy --prod
```

## API Documentation

See [API.md](./API.md) for complete API specifications.

## Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for infrastructure and deployment details.

## Contributing

All contributions must:

1. Pass CI checks (lint, test, type-check, build)
2. Maintain 80%+ test coverage
3. Follow code style (prettier + eslint)
4. Update documentation if needed

## License

Proprietary © 2026 Pauli Universe

## Support

For issues and questions, visit GitHub Issues or check [CLAUDE.md](./CLAUDE.md) for development context.
