# Lumina Market

Premium ecommerce storefront built with React, TypeScript, and Vite.

**Status:** finish project  
**Live:** https://alaa-kh.github.io/Ecommerce-/

Live product catalog from the [Platzi Fake Store API](https://fakeapi.platzi.com/).

## Architecture

```text
UI (pages/components)
  → Application hooks (TanStack Query)
    → Feature API modules
      → Centralized Axios Platzi client
        → https://api.escuelajs.co/api/v1
```

- No custom Express/Nest backend for the catalog
- No local product JSON / mock product arrays
- Env access only via `apps/web/src/app/config/env.ts`
- Redux Toolkit for client UI state (theme / locale / cart / wishlist)
- TanStack Query for server/catalog state
- i18n: English + Arabic with RTL/LTR
- Design tokens + light/dark theme

## Setup

```bash
npm install
cp apps/web/.env.example apps/web/.env
npm run dev
```

Open http://127.0.0.1:5173

## Environment

| Variable | Purpose |
| --- | --- |
| `VITE_APP_NAME` | Brand name |
| `VITE_DEFAULT_LOCALE` | `en` / `ar` |
| `VITE_SUPPORTED_LOCALES` | e.g. `en,ar` |
| `VITE_PLATZI_API_URL` | Default `https://api.escuelajs.co/api/v1` |

Optional managed integrations are documented in `apps/web/.env.example`. Secrets must never use the `VITE_` prefix.

## Scripts

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

## Routes

- `/` — home
- `/products` — catalog filters, sort, pagination
- `/products/:productId` — product details
- `/categories` — categories
- `/categories/:categorySlug` — category products
- `/search` — search
- `/cart` — cart
- `/checkout` — checkout
- `/wishlist` — wishlist
- `/orders` — orders
- `/login` — sign in
- `/account` — account

## External integrations

| Concern | Provider |
| --- | --- |
| Catalog | Platzi Fake Store API |
| Auth / payments / maps / AI | Managed services only when configured |

## Troubleshooting

- **Empty catalog / network errors:** verify `VITE_PLATZI_API_URL` and that `api.escuelajs.co` is reachable.
- **Broken images:** Platzi image hosts can change; the UI still renders placeholders.
- **Workspace install:** root workspaces include `apps/web` only.
