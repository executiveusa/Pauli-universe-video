# Pauli Cinema Studio: Cinematic Prompt Execution Checklist

This checklist operationalizes the 10-prompt cinematic brief as an executable loop.

## Ralphie Loop

Use the root command below to run all 10 prompts as quality-enforced gates:

```bash
pnpm ralphie:loop
```

The loop performs:

1. Prompt 1-10 sequence handling (single gate per prompt).
2. Lint checks (`pnpm lint`).
3. Type checks (`pnpm type-check`).
4. Test checks (`pnpm test`).
5. Build checks (`pnpm build`).
6. Ralphie repository auto-bootstrap in `skills/ralphy` for rule enforcement.

## Production deployment handoff

After a successful loop run:

```bash
pnpm deploy:production
```

If production credentials are configured (Vercel, Supabase, Modal, Higgsfield), this command can be used for final deploy verification.
