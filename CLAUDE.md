# CLAUDE.md — Lumina Market Coding Rules

This file is the source of truth for agent and human contributors.

## Core Principles

1. Prefer **production** implementations over demos/mocks.
2. Never hardcode secrets. Use environment variables.
3. **Do not build a custom backend** (no Express/NestJS/custom Node API) for this app.
4. Product catalog source of truth: **Platzi Fake Store API** (`https://api.escuelajs.co/api/v1`).
5. Advanced features (auth, payments, maps, realtime, AI, storage) use **managed services** only when configured.
6. Never pretend an integration works when credentials are missing — show a clear “not configured” state.
7. Never invent Platzi endpoints. Use only documented API capabilities; otherwise implement client-side over fetched data.

## TypeScript

- Strict TypeScript everywhere.
- Prefer explicit types at module boundaries.
- Avoid `any`. Use `unknown` + narrowing.
- Separate Domain models from DTOs / API contracts (mapper layer).

## Frontend Architecture

Feature-first under `apps/web/src/features/*`.

```text
UI → Application (hooks) → Domain → Infrastructure (HTTP / managed SDKs)
```

Rules:

- Never call Axios/`fetch` from React components.
- Use centralized HTTP clients under `shared/services`.
- Access env only via `app/config/env.ts` — never scatter `import.meta.env`.
- TanStack Query for server state (products, categories, search).
- Redux Toolkit only for cart / wishlist / theme / locale / UI client state.
- React Hook Form + Zod for forms.
- All user-facing text via i18n keys (`en`/`ar`) with RTL/LTR support.
- Design tokens only — no random hex colors in components.
- Every screen supports Loading / Empty / Success / Error.
- Typed error system (`AppError`).

## Product Catalog (Platzi)

- Base URL configurable via `VITE_PLATZI_API_URL`.
- Supported filters: `title`, `price`, `price_min`, `price_max`, `categoryId`, `categorySlug`, `limit`, `offset`.
- Sorting not provided by Platzi → safe **client-side** sort/pagination over the fetched dataset.
- No local product JSON. No hardcoded product arrays.

## Security

- No secrets in `VITE_*` variables.
- Never store passwords manually.
- Never render unsanitized HTML.

## Testing

- Critical business rules must have tests (mappers, filters, cart math, etc.).
- Bug fixes require regression tests.

## Quality Gate

- [ ] TypeScript passes
- [ ] ESLint passes
- [ ] Tests pass
- [ ] Build passes
- [ ] Real Platzi API calls work
- [ ] No mock product data
- [ ] Loading / Empty / Error states
- [ ] Responsive + accessible + RTL + dark mode
