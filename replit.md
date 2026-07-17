# VANTORIS

Enterprise financial operations platform — private banking, wealth management, and fintech services.

## Stack

- **Frontend**: React 18 + Vite 6, Tailwind CSS, Radix UI, shadcn/ui components
- **Backend**: Base44 hosted backend (SDK: `@base44/sdk`, plugin: `@base44/vite-plugin`)
- **Routing**: React Router v6
- **State**: TanStack Query v5

## Running the app

The **Start application** workflow runs `npm run dev` and serves on port 5000.

```
npm run dev
```

## Environment variables

| Variable | Description |
|---|---|
| `VITE_BASE44_APP_ID` | Base44 App ID (required — set in Replit Secrets) |
| `VITE_BASE44_APP_BASE_URL` | Base44 backend URL (optional — only needed for self-hosted backends) |
| `VITE_BASE44_FUNCTIONS_VERSION` | Functions version override (optional) |

## Auth

Authentication is handled by Base44's OAuth flow. Users are redirected to Base44's login, then returned with an `access_token` URL param that the SDK stores in localStorage.

## Project structure

```
src/
  api/          Base44 client setup
  components/   Shared UI components (vantoris/, ui/, admin/)
  hooks/        Custom React hooks
  lib/          Utilities, auth context, query client
  pages/        Route-level pages
    admin/      Admin/operations pages
    operations/ Operations center pages
base44/         Base44 backend functions and connectors
docs/           Architecture documentation
```

## User preferences

- Keep the existing Base44 + Vite stack — do not migrate to another framework
