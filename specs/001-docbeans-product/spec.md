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

As a business user, I can use Advanced Brief to define the writing role, purpose, audience, requirements, output, and approved knowledge before generation.

**Independent test:** Complete the five-part brief with a custom role and mandatory requirements, review the interpreted brief, and generate a traceable draft.

**Acceptance scenarios**

1. A user can select a predefined writing role or enter a custom role.
2. Mandatory requirements receive a visible disposition.
3. Assumptions and missing facts are surfaced rather than silently invented.

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

**Independent test:** Navigate through Features, Pricing, Manual, About, and Policy and confirm that shared navigation and footer links work.

**Acceptance scenarios**

1. Web access is shown as USD 7 per month.
2. Desktop access is shown as USD 45 one time and clearly labelled coming soon until checkout and installer delivery exist.
3. GST, VAT, or sales tax is described as dependent on billing country and local requirements.
4. Pricing distinguishes the access fee, DocBeans-managed AI usage, and BYOK provider billing.

## Functional Requirements

- **FR-001:** Support the implemented Quick Document catalogue: appreciation, thank-you, recommendation, testimonial, cover letter, job description, quotation, proposal, project brief, executive summary, curriculum, SOP, memo, announcement, meeting agenda, meeting minutes, leave request, and medical leave request.
- **FR-002:** Adapt field labels, help text, tone choices, validation, and output structure to the selected document type.
- **FR-003:** Provide Quick Document and Advanced Brief modes.
- **FR-004:** Allow predefined and custom writing roles.
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
- **FR-017:** Use Features as the `/` landing page, provide the document workspace at `/create`, and retain Features, Pricing, Manual, About, Settings, and Policy routes.
- **FR-018:** Display the USD 7 monthly web platform fee and USD 45 one-time desktop price.
- **FR-019:** State that taxes depend on the billing country and applicable local rules.
- **FR-020:** Keep desktop checkout and installer controls inactive and clearly labelled until delivery is implemented.
- **FR-021:** Provide document-level controls for preset theme, font, body colour, header colour, subheader colour, header layout, and subheader treatment.
- **FR-022:** Let users generate genuine PDF, DOCX, PPTX, TXT, and XLSX files from the reviewed document.

## Edge Cases

- Provider returns truncated, empty, or invalid structured output.
- BYOK key is missing, expired, or for the wrong provider.
- A document contains sensitive medical, employment, or confidential information.
- A job description lacks organisation, location, application method, or required qualifications.
- A user switches provider after entering a key.
- Currency and tax treatment differ from the customer’s billing country.

## Success Criteria

- **SC-001:** A first-time user can generate an everyday document without entering the Advanced Brief workflow.
- **SC-002:** Every live generation exposes its billing mode and returned usage.
- **SC-003:** BYOK generations show zero DocBeans AI credits and zero managed-generation charge.
- **SC-004:** No generated draft is published automatically.
- **SC-005:** All public product-information pages use consistent DocBeans branding, typography, navigation, and policy links.
- **SC-006:** The production build succeeds and all implemented routes respond without a blocking runtime error.
- **SC-007:** Styling choices remain visible in the generated preview and supported downloaded output.

## Out of Scope for Current Beta

- Payment processing and subscription management.
- A downloadable desktop installer.
- Automatic publishing to LinkedIn or third-party job portals.
- Legal, medical, or financial professional advice.
