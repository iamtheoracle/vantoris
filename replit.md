# VANTORIS

Enterprise financial operations platform — private banking, wealth management, and fintech services.

## Stack

- **Frontend**: React 18 + Vite 6, Tailwind CSS, Radix UI, shadcn/ui components
- **Backend**: Resilient hosted/local data layer (Base44 SDK is optional at runtime)
- **Routing**: React Router v6
- **State**: TanStack Query v5

## Running the app

The **Start application** workflow runs `npm run dev` and serves on port 5000.

```
npm run dev
```

## Runtime modes

The app supports two runtime modes:

- **Hosted mode**: when Base44 app configuration and an access token are available, remote entities can be used.
- **Offline mode**: when Base44 is unavailable, unconfigured, or unreachable, the app automatically uses a local browser-backed entity store. Banking demos, agent conversations, requests, audit entries, and uploads continue to work locally.

Hosted AI is optional. The member advisor and admin development agent use a deterministic local agent first, so they do not require an LLM subscription. A hosted model can be added later as an enhancement without becoming a hard dependency.

## Environment variables

| Variable | Description |
|---|---|
| `VITE_BASE44_APP_ID` | Base44 App ID (optional — only needed for hosted mode) |
| `VITE_BASE44_APP_BASE_URL` | Base44 backend URL (optional — only needed for self-hosted backends) |
| `VITE_BASE44_FUNCTIONS_VERSION` | Functions version override (optional) |
| `VITE_VANTORIS_OFFLINE` | Set to `true` to force local-only mode |
| `VITE_VANTORIS_REMOTE` | Set to `true` to opt into hosted Base44 mode; local mode is the default |

## Auth

Hosted authentication uses Base44's OAuth flow. In offline mode, the app uses a clearly separated local demo member and local data store; no hosted account or subscription is required to exercise the product workflows.

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
