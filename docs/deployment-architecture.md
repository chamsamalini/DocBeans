# DocBeans deployment architecture

DocBeans is deployed as one Cloudflare Worker through Sites, while its code is divided into three independently owned service boundaries. Keeping one deployable avoids cross-origin session and network complexity; keeping strict module boundaries allows an authentication provider to be replaced without changing product screens or generation logic.

## Service boundaries

| Boundary | Location | Responsibility | May depend on |
| --- | --- | --- | --- |
| Frontend service | `app/`, `components/`, `services/frontend/` | Pages, forms, account UI and document workspace | Auth contracts/client facade; backend HTTP routes |
| Backend service | `services/backend/`, `app/api/` | Document generation, validation, provider calls and usage responses | Server auth facade; AI-provider runtime variables |
| Authentication service | `services/auth/` | Sessions, social/email sign-in, MFA, user identity and admin assurance | One provider adapter at a time |

`app/api` contains only delivery adapters. Business logic belongs in `services/backend`. UI modules never import Supabase directly. Backend modules never inspect Supabase cookies or SDK objects directly. Both depend on the stable contracts in `services/auth`.

## Authentication replacement rule

Supabase is the active adapter under `services/auth/adapters/supabase`. A future Auth0 migration should add `services/auth/adapters/auth0`, select it in the two auth factories, and map Auth0 users, sessions and MFA responses to the existing `AuthUser`, `BrowserAuthService` and `AssuranceLevel` contracts. No imports in the frontend or generation backend should change.

## Runtime configuration

- `DOCBEANS_AUTH_PROVIDER` selects the authentication adapter. It currently supports `supabase`; `auth0` is reserved.
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are consumed only by the auth service.
- `DOCBEANS_ADMIN_EMAILS` is consumed only by server-side authorization.
- AI-provider keys are consumed only by the backend generation service.
- BYOK credentials remain session-scoped in the browser and are sent only to authenticated generation endpoints.

Secrets and runtime values are configured through Sites environment settings. They are not stored in source control or embedded into deployment archives.

## Deployment checks

1. Type-check all service contracts and adapters.
2. Produce the Worker build and confirm `dist/server/index.js` exists.
3. Package only the build output and hosting manifest.
4. Save and deploy the exact pushed source revision.
5. Preserve the existing Site audience unless an explicit access change is approved.
