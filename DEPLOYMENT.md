# Pauli Universe Deployment Guide

## Infrastructure Overview

```
┌─────────────────────────────────────────────────────┐
│                  Vercel (Frontend)                   │
│  cinema.app | game.app | engine.app | podcast.app  │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────▼────┐ ┌──▼──┐ ┌────▼────┐
   │Supabase │ │Modal│ │Stripe   │
   │(DB)     │ │(GPU)│ │(Payment)│
   └─────────┘ └─────┘ └─────────┘
        │
   ┌────▼──────────┐
   │Cloudflare R2  │
   │(Storage)      │
   └───────────────┘
```

## Prerequisites

- GitHub repository with secrets configured
- Vercel account and projects
- Supabase project
- Modal.com account
- Stripe account
- Cloudflare R2 bucket

## Environment Variables

### Required (All environments)

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
MODAL_TOKEN_ID=xxx
MODAL_TOKEN_SECRET=xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_ACCESS_KEY=xxx
CLOUDFLARE_SECRET_KEY=xxx
CLOUDFLARE_R2_BUCKET=pauli-assets
VERCEL_TOKEN=xxx
VERCEL_ORG_ID=xxx
```

### Optional

```
NODE_ENV=production
LOG_LEVEL=info
SENTRY_DSN=xxx
REDIS_URL=xxx
NEO4J_URL=xxx
```

## Deployment Steps

### 1. Database Setup (Supabase)

```bash
# Create Supabase project
# Enable pgvector extension
# Run migrations
pnpm db:migrate

# Seed test data
pnpm db:seed
```

### 2. Storage Setup (Cloudflare R2)

```bash
# Create R2 bucket
# Set CORS policy for video uploads
```

### 3. Vercel Deployment

```bash
# Connect GitHub repository
# Create projects for each app:
vercel link --project=pauli-cinema
vercel link --project=pauli-game
vercel link --project=pauli-engine
vercel link --project=pauli-website
vercel link --project=pauli-podcast

# Add environment variables to each project
# Deploy
pnpm deploy:all
```

### 4. Modal.com Functions

```bash
# Deploy GPU functions
modal deploy services/gpu/functions.py

# Test inference
modal run services/gpu/functions.py
```

### 5. Stripe Webhook Setup

```bash
# Register webhook endpoint
# Endpoint: https://engine.pauli-universe.app/api/webhooks/stripe
# Events: customer.subscription.created, invoice.payment_succeeded
```

## CI/CD Pipeline

GitHub Actions workflows automatically:

1. **On every push**:
   - Run tests, lint, type-check
   - Check code quality (UDEC score, coverage)
   - Security scan (no hardcoded secrets)

2. **On main branch**:
   - Build all apps
   - Run integration tests
   - Deploy to Vercel (auto-generated preview URLs)

3. **On tags (v\*)**:
   - Create release
   - Deploy to production
   - Notify Slack

## Monitoring

### Sentry Error Tracking

```bash
# Configure Sentry DSN in environment
# Errors automatically captured and reported
```

### Vercel Analytics

- Dashboard: vercel.com/dashboard
- Real User Monitoring enabled
- Core Web Vitals tracked

### Custom Metrics

```typescript
// Log custom metrics
fetch('/api/metrics', {
  method: 'POST',
  body: JSON.stringify({
    event: 'video_generated',
    duration: 120,
    cost: 3.1,
  }),
});
```

## Scaling

### Database Scaling

```sql
-- Add read replicas
-- Enable connection pooling
-- Monitor query performance
```

### Function Scaling

```bash
# Modal: Auto-scales based on load
# Set max_concurrent_inputs in function config
```

### CDN Scaling

```bash
# Cloudflare: Automatic cache optimization
# R2: Pay-as-you-go storage
```

## Rollback Procedure

```bash
# Rollback Vercel deployment
vercel --prod --confirm --rm

# Or use git:
git revert <commit>
git push origin main  # Redeploy via GitHub Actions
```

## Disaster Recovery

### Database Backup

```bash
# Supabase: Automated daily backups
# Manual backup:
pg_dump postgresql://... | gzip > backup.sql.gz
```

### Data Recovery

```bash
# Restore from backup
psql postgresql://... < backup.sql
```

## Production Checklist

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Stripe webhooks configured
- [ ] Vercel projects created
- [ ] GitHub Actions passing
- [ ] Error tracking enabled
- [ ] Monitoring dashboards active
- [ ] Backup procedures documented
- [ ] Security audit passed
- [ ] Performance baseline established

## Support

For deployment issues:

1. Check GitHub Actions logs
2. Review Vercel deployment logs
3. Check Supabase logs
4. Contact support: ops@pauli-universe.app
