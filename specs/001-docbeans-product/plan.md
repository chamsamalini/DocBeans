# Implementation Plan: DocBeans Product

**Repository Branch:** `main` | **Date:** 2026-09-12 | **Spec:** [spec.md](./spec.md)

## Summary

Maintain DocBeans as a document-first web application with a white-background public experience, provider-neutral account entry, adaptive Quick Document flows, a governed Advanced Brief, application-wide AI settings, transparent managed/BYOK billing, quality review, professional document styling, and separate user and admin portals. Deploy one Cloudflare Worker while enforcing separate frontend, backend, and authentication module boundaries.

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
- **Architecture:** Modular monolith with frontend, backend-generation, and replaceable authentication services behind stable contracts

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
services/
├── auth/
│   ├── adapters/supabase/
│   ├── client.ts
│   ├── server.ts
│   ├── config.ts
│   └── contracts.ts
├── backend/
│   └── generation/
│       ├── job-service.ts
│       └── quick-service.ts
└── frontend/
    └── account/
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
13. Deploy one Worker for operational simplicity and same-origin sessions, but keep frontend, backend, and authentication as explicit code ownership boundaries.
14. Allow provider SDK imports only inside `services/auth/adapters/<provider>`; all consumers use the stable auth contracts and facades.
15. Keep `app/api` as thin transport wiring and place generation business logic in `services/backend/generation`.
16. Give Advanced Brief a saved, adjustable output-token budget with document-type defaults; calculate a clear pre-generation cost ceiling from the selected model rates, and expose actual provider usage on failure without charging DocBeans credits. Treat an explicit provider output-limit stop as terminal for that attempt rather than retrying the same request.
17. Treat provider output as an unreliable boundary: assemble all returned text blocks, parse a complete JSON object from permitted wrappers, log only structural diagnostics and completion reasons, and retry malformed structured output no more than once while aggregating usage across attempts.
18. Reserve `DOCBEANS_AUTH_PROVIDER` as the adapter selector; Supabase is active and Auth0 is an extension point rather than a cross-application rewrite.
19. Treat mandatory brief requirements as generation acceptance criteria, with semantic validation for specialised requests such as Q & A rather than trusting provider-authored coverage metadata.
20. Treat uploaded images as knowledge inputs. For visual training output, require newly derived editable diagrams, comparisons, or charts and render each visual form with an instructional layout.
21. Keep the shared model catalogue aligned to exact provider API identifiers and disclose deprecated requested models instead of presenting them as recommended defaults.
22. Validate content semantics beyond schema compliance: require section-level evidence, a complete learning sequence, measurable activities, bounded slide copy and varied knowledge-derived visuals.
23. Treat PowerPoint creation as a checked export pipeline. Write slide citations to notes, repair known dangling slide-master declarations, verify package targets and only then offer the file for download.
24. Keep templates separate from evidence. Extract a safe, serializable Word or PowerPoint profile, let the user choose structure, design or both, guide generation with only that profile and apply detected style cues at export.
25. Treat training quality as an instructional-design contract, not a token-volume problem. Generate each topic against a compact story arc, require facilitator notes and realistic timing, and reject generic filler before assembly.
26. Reduce provider cost through relevance extraction and reuse: submit bounded high-relevance source excerpts per topic, retain completed topics in browser storage and perform assembly-only retries without provider calls.
27. Expand the editable visual vocabulary to timelines, matrices, cycles, architectures and risk maps, and render those plans in both complete-course and per-topic PowerPoint exports.
28. Keep repair local to the smallest failed unit. Preserve valid slides in a topic repair and never regenerate accepted topics for a course-level assembly issue.
29. Treat training timing as delivery metadata. Keep it in the approved course plan, agenda, structured slide data and facilitator notes, but never place it in visible topic subtitles or content-slide headings.
30. Use an executive evidence hierarchy for generated presentations: direct subject or takeaway titles, concise explanatory subtitles, one dominant relationship per slide and a clear implication or decision. Allocate more canvas space to native timelines, architecture layers, comparisons and decision structures instead of defaulting to a bullet list with a small side graphic.
31. Treat quotations as structured commercial records rather than generic prose. Require itemized pricing and explicit commercial metadata, disclose missing fields, preserve supplied tax language without calculation when no rate is provided, and export the structure only to business-document formats.
32. Collect quotation payment timing and remittance instructions as separate required inputs. Preserve both independently in the structured provider contract, preview and exports; never infer or manufacture financial account details.
33. Reuse the bounded Word-template profiler for optional quotation branding. Apply detected typography and palette locally while keeping template text out of the AI brief and clearly disclosing unsupported Word constructs.
34. Treat Quick Document requirements as explicit generation acceptance criteria. Maintain a complete per-type recommendation catalogue, select sensible defaults, allow bounded custom additions and prevent generation when no requirement remains selected.
35. Make local quotation generation deterministic and commercially structured: parse wrapped currency lines, reconcile supplied totals, expose missing tax, infer only non-financial presentation wording from supplied scope and never print internal acceptance criteria in the client document.
36. Preserve real Word quotation templates at package level. Replace only the main sample body with generated quotation XML, retain the template’s section properties and related header, footer and media parts, then verify the resulting DOCX archive before download.
37. Keep quotation generation gates limited to the facts needed to construct the document. Request supplier and payment details, but allow safe omission with visible warnings and explicit missing-value treatment instead of silently disabling generation.
38. Make template use visible before download. Extract bounded Word header/footer text and a small logo asset for the browser preview, and preserve drawing-bearing body elements when merging the generated quotation into the DOCX package.
39. Move proposal completeness upstream. Gather seven decision-critical inputs adaptively for business proposals and proposal presentations, show readiness before generation, reject incomplete API requests before any provider interaction, and validate output with semantic business-language coverage rather than literal headings.

## Delivery

Type-check the service contracts, verify provider-specific imports remain isolated, build the Worker bundle, verify affected routes, commit and push the exact source state, save a Sites version, and privately publish it to the existing DocBeans Site. The detailed topology and provider-swap procedure live in `docs/deployment-architecture.md`.
