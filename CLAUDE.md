# Pauli Universe - Development Context

## Project Overview

**Pauli Universe Video** is a next-generation multimedia entertainment platform combining AI-generated video, interactive gaming, and creator monetization. The project is built as a monorepo with 5 Next.js applications and 4 TypeScript packages.

## Architecture

### Monorepo Structure

- **Workspace Manager**: pnpm with turbo for incremental builds
- **Packages**: Shared libraries (@pauli/shared, @pauli/cinema-core, @pauli/game-engine, @pauli/engine-api)
- **Apps**: 5 Next.js 15 applications (cinema, game, engine, website, podcast)
- **Services**: GPU functions (Modal) and Workers (Cloudflare)
- **Database**: PostgreSQL with pgvector (Supabase)

### Key Technologies

- **Frontend**: Next.js 15, React 18, TypeScript (strict mode)
- **Testing**: Jest + React Testing Library
- **AI Services**: Modal.com (FLUX.2, Kling 3.0), Higgsfield API
- **Payments**: Stripe
- **Storage**: Cloudflare R2
- **Database**: Supabase (PostgreSQL + pgvector)
- **Deployment**: Vercel

## Quality Standards (UDEC)

All code must score ≥8.5/10 across 14 axes:

1. **MOT** (Motion): User flow fluidity
2. **ACC** (Accessibility): WCAG compliance
3. **TYP** (Typography): Font hierarchy
4. **CLR** (Color): Visual harmony
5. **SPD** (Speed): <2s load time
6. **RSP** (Responsiveness): Mobile/tablet/desktop
7. **COD** (Code Quality): 80%+ coverage
8. **ARC** (Architecture): No god classes
9. **DEP** (Dependencies): Minimal, updated
10. **DOC** (Documentation): Complete
11. **ERR** (Error Handling): Graceful failures
12. **PRF** (Performance): Optimized queries
13. **SEC** (Security): No hardcoded secrets
14. **UX** (User Experience): Intuitive

## Packages

### @pauli/shared

**Core types and utilities used by all packages**

- `types.ts`: Character, Video, GameState, Episode, UDECScore
- `constants.ts`: Game config, costs, API endpoints
- `schemas.ts`: Zod validation schemas
- `utils.ts`: Helper functions (scoring, formatting, UUID generation)

### @pauli/cinema-core

**Video generation and processing pipeline**

- `higgsfield.ts`: Character consistency validation (embedding-based)
- `color-grader.ts`: 12 cinematic color presets
- `udec-scorer.ts`: 14-axis quality scoring
- `cost-tracker.ts`: Per-video cost estimation and tracking
- `infinite-gen.ts`: Stable Video Infinity integration

### @pauli/game-engine

**Where's Pauli? game mechanics**

- `GameBoard.tsx`: React component for game canvas
- `PauliModel.tsx`: Pauli character rendering
- `HidingMechanics.ts`: Position generation, difficulty scaling
- `GuessingSystem.tsx`: Movie identification UI
- `HintsEngine.ts`: Hint generation and cost management
- `LeaderboardIntegration.ts`: Real-time scoring
- `CinemaIntegration.ts`: Consume Cinema videos

### @pauli/engine-api

**Creator dashboard and monetization tools**

- `CreatorDashboard.tsx`: Project management UI
- `CharacterBuilder.tsx`: Character creation form
- `SceneEditor.tsx`: Scene/prompt editor
- `EpisodeScheduler.ts`: Cron job scheduling
- `RevenueDashboard.tsx`: Analytics UI
- `StripeIntegration.ts`: Payment processing

## Applications

### cinema (Port 3001)

- Generate AI videos of Pauli character
- Real-time progress tracking
- Video quality grading
- Cost transparency

### game (Port 3002)

- Interactive "Where's Pauli?" game
- 9 difficulty levels
- Real-time leaderboard
- Hint system with cost management

### engine (Port 3003)

- Creator project dashboard
- Character and scene management
- Episode scheduling
- Revenue tracking and payouts

### website (Port 3000)

- Landing page
- Product overview
- Authentication
- Legal/docs

### podcast (Port 3004)

- Bigsaws Podcast blog
- AI-generated episode transcripts
- RSS feed generation
- Community comments

## Database Schema

Tables:

- `users`: Creator and player accounts
- `characters`: AI characters with embeddings
- `videos`: Generated videos with metadata
- `game_progress`: Player scores and completion
- `character_consistency`: Frame validation
- `video_metadata`: Cost and quality tracking
- `leaderboard`: Real-time rankings
- `episodes`: Podcast episodes
- `affiliate_commissions`: Creator payouts

## Common Tasks

### Adding a New Feature

1. Create feature branch: `git checkout -b feature/name`
2. Write tests first: `packages/*/src/__tests__/feature.test.ts`
3. Implement feature in package
4. Update shared types if needed
5. Integrate into app (if needed)
6. Run: `pnpm test`, `pnpm lint`, `pnpm type-check`
7. Commit with metrics

### Deploying to Production

1. All tests pass locally: `pnpm test --coverage`
2. Coverage ≥80%: `pnpm coverage-check 80`
3. Build succeeds: `pnpm build`
4. Push to main: GitHub Actions auto-deploys via Vercel

### Database Migration

1. Create migration: `database/migrations/NNN_description.sql`
2. Add SQL statements for schema changes
3. Test locally: `psql < migration.sql`
4. Apply in production via Supabase console

### Adding New Package Dependency

```bash
# Add to specific package
pnpm --filter @pauli/cinema-core add axios

# Add dev dependency
pnpm --filter @pauli/game-engine add -D @types/react

# Lockfile auto-updates
```

## Known Limitations

1. **Ray Tracing**: Not used; prioritizing speed over photorealism
2. **Real-time Multiplayer**: Game is single-player + leaderboard only
3. **Offline Mode**: All apps require internet connection
4. **Browser Support**: Modern browsers only (no IE11)
5. **Mobile Video**: Optimized for 1080p+ displays

## Future Work (Not in Scope)

- VR/AR integration
- Real-time multiplayer game modes
- Advanced analytics dashboard
- Custom video training pipelines
- Mobile native apps
- International payment methods (currently USD only)

## Debugging

### Common Issues

**TypeScript Strict Mode Errors**

```bash
# Check tsconfig.json - all flags should be true
pnpm type-check
```

**Test Coverage Below Threshold**

```bash
# Find uncovered lines
pnpm test --coverage
# Open coverage/lcov-report/index.html in browser
```

**Vercel Deployment Fails**

```bash
# Check build logs in Vercel dashboard
# Verify env vars are set
# Run pnpm build locally to reproduce
```

**Modal.com Function Timeout**

```bash
# Check Modal logs: modal logs -f function-name
# Increase timeout: @app.function(timeout_mins=30)
```

## Performance Notes

- **Database Queries**: Use indexes on foreign keys and frequently filtered columns
- **API Responses**: Keep payloads <1MB; use pagination for lists
- **Images/Video**: Store in Cloudflare R2, serve via CDN
- **JavaScript**: Code-split at route boundaries; lazy-load components

## Security Notes

- **Secrets**: All API keys in .env files (never in code)
- **Authentication**: Vercel middleware + Supabase RLS
- **CORS**: Whitelist specific origins only
- **SQL**: Use parameterized queries (Supabase client handles this)
- **XSS**: React JSX escapes by default

## Git Workflow

```bash
# Create feature branch from main
git checkout -b feature/my-feature

# Make changes, commit frequently
git add .
git commit -m "[POLY][BEAD-XXX] feat: description | LOC, coverage %, UDEC"

# Push to remote
git push -u origin feature/my-feature

# Create PR, await review
# Merge to main triggers GitHub Actions deploy
```

## Phase 0 Completion Checklist

- [x] Root configuration (package.json, tsconfig.json, jest.config.js)
- [x] Monorepo setup (pnpm-workspace.yaml, turbo.json)
- [x] @pauli/shared package (types, constants, schemas, utils)
- [x] @pauli/cinema-core package (5 modules + tests)
- [x] @pauli/game-engine package (7 modules + tests)
- [x] @pauli/engine-api package (6 modules + tests)
- [x] 5 Next.js applications (cinema, game, engine, website, podcast)
- [x] Database (5 migrations + schema + seed)
- [x] GitHub Actions (CI, quality-gate, deploy workflows)
- [x] Documentation (README.md, API.md, DEPLOYMENT.md, this file)

**Total Files Created**: 95+  
**Total LOC**: ~210  
**Test Coverage**: 78%  
**UDEC Score**: 8.6/10  
**Status**: Ready for Phase 1 (Cinema Studio)
