# Feature Specification: DocBeans Product

**Feature ID:** `001-docbeans-product`  
**Created:** 2026-09-12  
**Status:** Implemented beta

## User Scenarios and Testing

### User Story 1 — Create an everyday document quickly (Priority: P1)

As a user, I can select a document type, answer a small set of relevant questions, choose tone and presentation, and generate a professional draft.

**Independent test:** Select Appreciation letter, provide a recipient and contribution, generate, and verify that the result is a complete letter using the selected document style.

**Acceptance scenarios**

1. Given a selected document type, when the form opens, then labels, examples, tone choices, and required fields match that document.
2. Given incomplete required information, when generation is attempted, then the interface explains what is missing.
3. Given a successful generation, when the draft appears, then it remains editable and is not published automatically.

### User Story 2 — Create a governed business document (Priority: P1)

As a business user, I can use Advanced Brief to define a content goal, upload or paste trusted knowledge, set content requirements, and choose the output before generation.

**Independent test:** Complete the four-step brief with source content and mandatory requirements, review the interpreted brief, and develop a traceable draft.

**Acceptance scenarios**

1. A user can upload multiple reference files or paste source content without selecting a writing role.
2. Mandatory requirements receive a visible disposition.
3. Assumptions and missing facts are surfaced rather than silently invented.
4. A user can select the intended document type, target audience, tone, visual requirement, theme, font, colours, and download type; presentation requests must produce a slide-oriented structure rather than training modules.
5. Advanced Brief extracts readable content from supported uploads and sends that content, not only filenames, to the selected AI provider.
6. Download remains unavailable when the provider returns an error, incomplete structure, placeholder instructions, or insufficient developed content.
7. When visuals are requested, presentations contain source-supported editable charts, process diagrams, comparisons, or supplied source images rather than visual placeholders.

### User Story 3 — Choose AI and billing mode (Priority: P1)

As a user, I can configure Anthropic or OpenAI once for the application and choose DocBeans-managed AI or BYOK.

**Independent test:** Generate once with managed AI and once with BYOK, then compare the usage summaries.

**Acceptance scenarios**

1. Managed AI records one DocBeans credit and the configured managed-generation charge after a successful draft.
2. BYOK records returned provider usage but consumes no DocBeans AI credit or managed-generation charge.
3. A BYOK credential exists only for the current browser-tab session and is excluded from logs.
4. If no provider key is available, local rules return a clearly labelled non-AI fallback with zero provider tokens and zero credits.

### User Story 4 — Review and deliver a useful output (Priority: P1)

As a user, I can review quality warnings, edit generated content, apply document styling, and export or copy the result for its intended destination.

**Independent test:** Generate a job description, resolve missing publication details, edit the draft, copy LinkedIn text, and print or save the formatted document as PDF.

**Acceptance scenarios**

1. Job descriptions show structure, repetition, unsupported-claim, and publication-readiness checks.
2. Font and preset theme choices affect the generated document without changing the DocBeans interface.
3. LinkedIn and job-portal copy is clean plain text and is never posted automatically.

### User Story 5 — Understand product access and policy (Priority: P2)

As a prospective customer, I can understand features, pricing, usage billing, taxes, privacy, and product limitations before using DocBeans.

**Independent test:** Navigate through the About landing page, Pricing, Manual, and footer-only Policy and confirm that shared navigation and footer links work.

**Acceptance scenarios**

1. Web access is shown as USD 7 per month.
2. Desktop access is shown as USD 45 one time and clearly labelled coming soon until checkout and installer delivery exist.
3. GST, VAT, or sales tax is described as dependent on billing country and local requirements.
4. Pricing distinguishes the access fee, DocBeans-managed AI usage, and BYOK provider billing.

### User Story 6 — Access account and operational portals (Priority: P1)

As a user, I sign in before creating documents and can review billing, usage, and AI settings from a user portal; authorised operators have a separate admin portal.

**Independent test:** Select Create Document, sign in with Google, Microsoft or a verified work email, open the document workspace, then navigate to the user portal and verify billing, device-level usage and authenticator MFA controls are visible.

**Acceptance scenarios**

1. Public navigation contains only About, Pricing, Manual, and Create Document.
2. Create Document opens a branded account gateway before the protected workspace.
3. The user portal shows the platform plan, billing status, generation usage, and AI settings access.
4. The admin portal distinguishes active services from billing or access controls that still require configuration.
5. Policy navigation appears only in the footer and covers PDPA, GDPR, and data protection.

### User Story 7 — Replace infrastructure without rewriting the product (Priority: P1)

As the product owner, I can replace the authentication provider without changing document screens, generation logic, or public pages.

**Independent test:** Search frontend and backend service code for Supabase SDK imports and verify that every provider-specific import is contained inside `services/auth/adapters/supabase`.

**Acceptance scenarios**

1. Frontend account components call only the browser authentication contract.
2. Protected pages and backend generation services call only the server authentication facade.
3. API route files contain delivery wiring while generation and validation logic remains in the backend service.
4. Adding Auth0 requires a new authentication adapter and factory registration, without changing frontend or generation-service imports.

## Functional Requirements

- **FR-001:** Support the implemented Quick Document catalogue: appreciation, thank-you, recommendation, testimonial, cover letter, job description, quotation, proposal, project brief, executive summary, curriculum, SOP, memo, announcement, meeting agenda, meeting minutes, leave request, and medical leave request.
- **FR-002:** Adapt field labels, help text, tone choices, validation, and output structure to the selected document type.
- **FR-003:** Provide Quick Document and Advanced Brief modes.
- **FR-004:** Advanced Brief must use a four-step, knowledge-led flow: content goal, knowledge, requirements, and output; it must not request a writing role.
- **FR-005:** Provide application-wide provider, model, and credential-mode settings.
- **FR-006:** Support Anthropic and OpenAI through managed credentials or BYOK.
- **FR-007:** Keep BYOK credentials in session storage only and exclude them from logs.
- **FR-008:** Return local-rule fallback drafts when no live provider credential is available.
- **FR-009:** Display generation mode, model, tokens, provider-cost estimate, credits, and DocBeans charge.
- **FR-010:** Charge managed AI only after successful live generation.
- **FR-011:** Consume no DocBeans AI credit or managed-generation charge for BYOK.
- **FR-012:** Preserve user-supplied names, dates, amounts, URLs, requirements, and factual claims.
- **FR-013:** Provide quality checks and missing-information guidance for job descriptions.
- **FR-014:** Allow generated job descriptions to be edited before copying.
- **FR-015:** Provide document font and theme presets independent of interface typography.
- **FR-016:** Support print/save-to-PDF and destination-ready copy for LinkedIn and job portals.
- **FR-017:** Use About as the `/` landing page, include product features and updates within it, provide the protected document workspace at `/create`, and redirect legacy `/about` links to the About section.
- **FR-018:** Display the USD 7 monthly web platform fee and USD 45 one-time desktop price.
- **FR-019:** State that taxes depend on the billing country and applicable local rules.
- **FR-020:** Keep desktop checkout and installer controls inactive and clearly labelled until delivery is implemented.
- **FR-021:** Provide document-level controls for preset theme, font, body colour, header colour, subheader colour, header layout, and subheader treatment.
- **FR-022:** Let users generate genuine PDF, DOCX, PPTX, TXT, and XLSX files from the reviewed document.
- **FR-023:** Use white page backgrounds across public, document, settings, account, user-portal, and admin-portal surfaces.
- **FR-024:** Limit the public header to About, Pricing, Manual, and Create Document; show Policy only in the footer.
- **FR-025:** Route Create Document through a branded Supabase gateway supporting Google, Microsoft and verified email/password accounts; protect `/create`, `/settings`, and generation endpoints server-side.
- **FR-026:** Provide a protected user portal with billing status, AI settings access, device-level generation totals, and TOTP authenticator enrolment.
- **FR-027:** Restrict the admin portal with a server-side email allowlist, require an AAL2 authenticator session, and report provider, billing, and compliance readiness.
- **FR-028:** Cover Singapore PDPA, GDPR, data protection, retention, responsible AI, and terms in the policy page.
- **FR-029:** Separate DocBeans into frontend, backend-generation, and authentication service boundaries within the Worker deployment.
- **FR-030:** Prevent frontend and backend-generation modules from importing Supabase or another identity-provider SDK directly.
- **FR-031:** Define provider-neutral browser and server authentication contracts for identity, sessions, social/email sign-in, password recovery, TOTP MFA, and assurance level.
- **FR-032:** Keep framework API routes thin and delegate generation, validation, provider calls, and usage calculation to the backend service.
- **FR-033:** Present each page with its primary heading directly, without a redundant uppercase descriptor above the page title.
- **FR-034:** Use black primary body text throughout the light interface and apply the DocBeans logo orange to primary, outline, secondary, and link-style action buttons with accessible label contrast.
- **FR-035:** Identify DocBeans as a product of Petreltech in the shared application footer.
- **FR-036:** Allow administrators to use the standard User Portal and switch to the Admin Portal, while retaining administrator allowlist and AAL2 authenticator checks for administrative functions.
- **FR-037:** Support a temporary disabled-authentication mode for an owner-restricted Site, bypassing the DocBeans login and MFA screens while routing Create Document directly to the workspace; require managed authentication to be restored before access is widened.
- **FR-038:** Advanced Brief must offer document-type, audience, tone, and visual-requirement controls and adapt labels and draft structure to the selected document.
- **FR-039:** Advanced Brief must provide the same theme, font, font-colour, header, and subheader controls as Quick Document, plus PDF, DOCX, PPTX, TXT, and XLSX download-type selection.
- **FR-040:** Advanced Brief must extract knowledge from PDF, DOCX, PPTX, XLSX, text, and supported image uploads, send it with the brief to the configured provider, validate a structured document response, reject placeholder content, and unlock download only after successful validation.
- **FR-041:** Presentation export must convert generated sections into substantive slides and requested visuals into source-supported editable charts, diagrams, comparisons, or supplied source images, with layout safeguards against clipped titles and overflowing content.
- **FR-042:** Advanced Brief must offer exactly two grounding modes: Approved sources only, using uploaded documents, pasted notes and explicitly fetched public website URLs; and Approved sources + external websites, which may additionally use the selected provider's web-search tool. Website retrieval must reject non-public targets, extracted web content must be treated as untrusted data, and external URLs used must appear in the source trace.
- **FR-043:** Advanced Brief must accept up to 100 approved sources under one 500 MB combined upload allowance, without a separate application-level per-file cap. Large extracted text must be split into temporary device-local chunks, ranked against the brief and requirements, and reduced to a bounded evidence context before provider submission; uploaded images must be optimised and provider submission must remain bounded.
- **FR-044:** Advanced generation must assemble all provider text blocks, recover a complete JSON object from harmless wrappers such as markdown fences or explanatory text, record the provider completion reason, and make at most one controlled regeneration attempt when the first successful provider response is malformed. If recovery succeeds, usage and estimated provider cost must include both attempts; if it fails, the saved brief must remain available and the error must identify the recoverable next actions without exposing generated content or credentials in logs.
- **FR-045:** Advanced Brief must provide a document-type-specific default output-token budget that the customer may adjust between 4,000 and 24,000 tokens in both the Output step and final review, save that choice with the brief, and recalculate the estimated pre-generation provider-cost ceiling immediately. If a provider explicitly reaches the selected limit, DocBeans must not make a wasteful recovery attempt; it must retain the brief, show the actual provider-reported attempt usage and estimated provider cost, and record zero DocBeans credits and zero managed-AI charge for the failed generation.
- **FR-046:** Advanced generation must apply document-type-specific editorial instructions and reject presentation-like output that is excessively dense, incomplete as learning material, or visually tokenistic. Training material must contain measurable objectives, demonstrated or worked content, learner practice, a knowledge check and practical application; presentation copy must use direct titles, concise summaries and bounded bullets without generation commentary or repeated inline source labels.
- **FR-047:** Advanced generation must treat every mandatory content requirement as an acceptance criterion rather than a coverage label. A mandatory Q & A requirement must produce a visible section containing at least four knowledge-grounded question-and-answer pairs before the document passes validation or download is enabled.
- **FR-048:** When visuals are requested for presentations or training material, Advanced generation must digest the approved knowledge and create at least two new editable charts, processes, or comparisons that teach a supported relationship. Merely embedding an uploaded source image does not satisfy this requirement; source images may appear only as supporting evidence when direct inspection is useful.
- **FR-049:** Application-wide AI settings must expose only the current supported document-capable model catalogue: Claude Fable 5.1, Opus 5, Sonnet 5 and Haiku 4.5 for Anthropic; GPT-6 Astra and GPT-5.6 Sol, Terra and Luna for OpenAI. The catalogue must use exact API identifiers and current token-price estimates, remove deprecated selections, and migrate saved retired choices to a balanced active model.

## Edge Cases

- Provider returns truncated, empty, or invalid structured output.
- BYOK key is missing, expired, or for the wrong provider.
- A document contains sensitive medical, employment, or confidential information.
- A job description lacks organisation, location, application method, or required qualifications.
- A user switches provider after entering a key.
- Currency and tax treatment differ from the customer’s billing country.
- The configured authentication provider is missing, unsupported, or temporarily unavailable.
- A future identity provider represents users, social connections, or MFA assurance differently from Supabase.

## Success Criteria

- **SC-001:** A first-time user can generate an everyday document without entering the Advanced Brief workflow.
- **SC-002:** Every live generation exposes its billing mode and returned usage.
- **SC-003:** BYOK generations show zero DocBeans AI credits and zero managed-generation charge.
- **SC-004:** No generated draft is published automatically.
- **SC-005:** All public product-information pages use consistent DocBeans branding, typography, navigation, and policy links.
- **SC-006:** The production build succeeds and all implemented routes respond without a blocking runtime error.
- **SC-007:** Styling choices remain visible in the generated preview and supported downloaded output.
- **SC-008:** Unauthenticated visitors cannot open the document or settings workspace without starting the platform sign-in flow.
- **SC-009:** Public navigation contains no separate Features, Updates, Settings, Admin, or Policy header links.
- **SC-010:** Provider-specific authentication SDK imports exist only inside the selected authentication adapter.
- **SC-011:** A production build succeeds after the service-boundary refactor with unchanged public routes and user workflows.
- **SC-012:** About, Pricing, Manual, Policy, Login, User Portal, Admin, and password recovery pages do not show a redundant page-description kicker above the main heading.

## Out of Scope for Current Beta

- Payment processing and subscription management.
- Persistent account-wide usage storage and administrator role provisioning.
- A downloadable desktop installer.
- Automatic publishing to LinkedIn or third-party job portals.
- Legal, medical, or financial professional advice.
