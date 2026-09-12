# Implementation Plan: DocBeans Product

**Repository Branch:** `main` | **Date:** 2026-09-12 | **Spec:** [spec.md](./spec.md)

## Summary

Maintain DocBeans as a document-first web application with a white-background public experience, platform-managed account entry, adaptive Quick Document flows, a governed Advanced Brief, application-wide AI settings, transparent managed/BYOK billing, quality review, professional document styling, and separate user and admin portals.

## Technical Context

- **Language/Version:** TypeScript 5.9, React 19
- **Framework:** Vinext 1 beta with Vite 8
- **UI:** Tailwind CSS 4 and existing Shadcn primitives
- **Runtime:** Cloudflare Worker-compatible server output
- **Storage:** Browser local/session storage for preferences, BYOK session credentials, and device-level usage totals; no durable application database
- **AI providers:** Anthropic Messages API and OpenAI Responses API
- **Testing:** Production build, route verification, visual browser review, and focused generation-accounting checks
- **Target platforms:** Modern desktop/mobile browsers; packaged desktop edition planned
- **Constraints:** No automatic publishing; no BYOK credentials in logs; Cloudflare-compatible fetch APIs; desktop installer and checkout not yet implemented

## Constitution Check

- Document-first workflow: Pass
- Human review and non-invention: Pass
- Transparent AI billing: Pass
- Session-only BYOK: Pass
- Consistent interface and branding: Pass

## Project Structure

```text
app/
├── admin/page.tsx
├── api/generate/route.ts
├── api/generate-document/route.ts
├── auth/callback/route.ts
├── create/layout.tsx
├── create/page.tsx
├── features/page.tsx
├── login/page.tsx
├── pricing/page.tsx
├── manual/page.tsx
├── policy/page.tsx
├── portal/page.tsx
├── portal/usage-panel.tsx
├── settings/layout.tsx
├── settings/page.tsx
└── page.tsx
components/
├── brand-logo.tsx
├── marketing-header.tsx
├── marketing-page.tsx
└── site-footer.tsx
lib/
├── ai-settings.ts
└── job-generation.ts
specs/001-docbeans-product/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/requirements.md
```

## Design Decisions

1. Use About as the public landing page, include product features and current updates within it, and keep Quick Document as the default protected working surface at `/create`.
2. Store provider/model preference locally and BYOK credentials in session storage.
3. Determine BYOK billing from a request that explicitly identifies BYOK and supplies a provider key.
4. Keep provider-cost values as estimates based on returned token usage and configured rates.
5. Treat the desktop edition as planned until a signed installer, update channel, checkout, licensing, and download delivery exist.
6. Use Montserrat for the interface; user-selected fonts apply only to generated documents.
7. Present product capabilities in an executive operating-model layout and keep detailed presentation controls inside the document workflow.
8. Generate genuine PDF, DOCX, PPTX, TXT, and XLSX files in the browser without automatic publishing.
9. Use Supabase Auth for Google, Microsoft and verified email/password accounts; protect product routes and generation endpoints with validated Supabase sessions.
10. Make TOTP authenticator MFA available to every user and mandatory for administrator accounts identified through a server-side allowlist.
11. Keep public navigation focused on About, Pricing, Manual, and Create Document; place compliance policy links only in the footer.
12. Keep billing controls informational until a payment provider and durable account ledger are connected.

## Delivery

Build the Worker bundle, visually verify affected routes, commit and push the exact source state, save a Sites version, and privately publish it to the existing DocBeans Site.
