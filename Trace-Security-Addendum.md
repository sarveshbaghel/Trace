# Trace — Security Addendum

### Supplement to Trace Production Technical Specification (v1.0)

**Document type:** Security Review & Hardening Addendum
**Status:** Draft — for engineering review before Phase 4 (Production Hardening)
**Last updated:** August 2026

---

## Purpose

This addendum expands on §12 (Security & Compliance) of the main spec with concrete, actionable hardening items across each system layer. It should be reviewed alongside the main spec and closed out (or explicitly deferred with rationale) before public launch.

---

## 1. Authentication & Session Security

- **Refresh token reuse detection** — if a revoked/already-used refresh token is presented again, treat it as a stolen-token signal and revoke the entire token family for that user, not just the one token.
- **JWT signing algorithm** — use RS256/ES256 (asymmetric) rather than HS256, so the AI service and workers can verify tokens without holding the signing secret.
- **OTP security** — 6-digit OTP, max 5 attempts, 5–10 min expiry, and a cooldown between requests (not just rate limiting) to stop SMS-pumping abuse. Rate limit by phone number *and* IP — attackers commonly rotate one but not both.
- **Password policy** — enforce via a breached-password check (e.g. HaveIBeenPwned k-anonymity API), not just length/complexity rules.
- **Session invalidation** — logout, password change, and role change should all invalidate existing refresh tokens immediately.
- **Admin/moderator MFA** — mandatory TOTP-based MFA for `moderator`, `department_admin`, and `super_admin` roles. A compromised moderator account is a direct path to defamatory or fake public posts under the Trace name.

## 2. Authorization

- **IDOR is the top risk class for this data model.** `GET /api/v1/complaints/:id` and `/status` must verify the requester owns the complaint or holds an admin role scoped to that city — enforced at the query/repository layer, not just route middleware.
- **City-scoped RBAC** — a `department_admin` for City A must be blocked from City B's queue, analytics, and authority records at the data-access layer, so a missed check on a new endpoint can't leak cross-city data.
- **Internal endpoints** (`/internal/ai/analyze`, `/internal/social/post/:id`, `/internal/notifications/dispatch`) — must be unreachable from the public internet: private network/VPC-only, plus mTLS or signed service tokens between services. Not documented publicly is not sufficient.

## 3. Upload & Media Pipeline

*(Highest-risk surface in the system — untrusted binary data from anonymous devices, feeding an AI pipeline and a public-posting pipeline.)*

- **Server-side file validation** on actual file bytes/magic numbers, not MIME header or extension.
- **Malware/virus scanning** before the file lands in a bucket any worker or AI service can read.
- **Image-parsing library CVEs** — pin versions of OpenCV/Pillow/etc., keep dependency scanning active, and run image processing in an isolated worker with no outbound network access.
- **EXIF handling** — GPS stripping must happen server-side on the public-post variant only; the raw original (with EXIF) must never be reachable via a guessable or public/CDN path.
- **Signed URL scope** — narrow to a single object, short expiry, correct HTTP method; never reused across requests.
- **Face/plate blur as a hard gate** — if the blur model fails or returns low confidence, route to manual moderator review rather than auto-posting. This is the main legal-exposure mitigation in the whole system; treat failures as blocking, not advisory.
- **GPS spoofing** — mock-location apps and rooted/jailbroken devices can fake GPS. Consider device attestation (Play Integrity API / Apple DeviceCheck) as an additional trust signal feeding severity scoring and duplicate detection, since both depend on location integrity.

## 4. API & Infrastructure

- **Rate limiting** — per-IP *and* per-account, stricter on write endpoints (`POST /complaints`, `/auth/*`) than reads.
- **Input validation** — enforce Zod schemas at the edge for every endpoint, including internal ones, with strict/no-passthrough schemas to prevent mass-assignment bugs.
- **SSRF prevention** — allowlist destination hosts for any outbound URL fetch (reverse geocoding, Mapbox, X API), especially where user input could influence the target.
- **Secrets rotation** — rotate X API OAuth tokens and DB credentials on a schedule, not just store them securely once.
- **Raw SQL audit** — Prisma parameterizes by default, but hand-written PostGIS spatial queries (common for performance) should be specifically audited for injection risk.
- **CORS** — lock down to actual mobile/admin origins; the admin console must not be reachable from arbitrary origins.

## 5. Third-Party Integration Security

- **X posting worker isolation** — its own service identity/IAM role with minimal other permissions. If compromised, an attacker can post anything to the public Trace account. Log every post attempt with the triggering complaint ID for audit.
- **Webhook/callback signature validation** — verify signatures on every inbound webhook (X, FCM).
- **OAuth token storage** — encrypted at rest, access scoped to the posting worker only.

## 6. AI Pipeline Specific Risks

- **Adversarial inputs** — forensics models can be fooled by adversarial perturbations designed to fake an "authentic" score. Since AI is advisory-only (per spec §10), track how often moderators override AI verdicts as an ongoing QA metric — don't let high-authenticity scores become a rubber stamp.
- **Service isolation** — the FastAPI AI service processes untrusted images; run it in its own network segment with no direct DB access beyond what it strictly needs, limiting blast radius if a parsing-library exploit lands.

## 7. Data Protection & Privacy (DPDP Act, 2023)

- **Consent** — granular, logged consent at signup, separate from generic ToS acceptance, with timestamp and version of the consent text shown.
- **Data minimization** — review whether phone *and* email should both be mandatory, or whether one suffices.
- **Deletion flow** — anonymize rather than hard-delete: nullify PII on the user record while preserving `status_history` for accountability integrity. Document this distinction explicitly for compliance review.
- **Data localization** — confirm cloud region (DB, S3/GCS) meets DPDP data-localization expectations; document the hosting region decision.
- **Breach notification** — DPDP requires notifying the Data Protection Board and affected users on breach. Have a named incident-response owner and runbook in place before launch, not drafted reactively.

## 8. Abuse & Trust Layer

- **SIM-swap risk** — phone-OTP-only accounts are vulnerable; consider email confirmation as a secondary factor for sensitive actions (password reset, account recovery).
- **Bulk fake-account creation** — CAPTCHA on registration, not just on repeated failed logins, since duplicate-report gaming often starts with many fresh low-trust accounts.
- **PII access audit trail** — log admin *views* of unblurred/sensitive images (who, when), in addition to the existing approve/reject audit log, for accountability if misuse is ever alleged.

## 9. Mobile App Client-Side

- **Certificate pinning** on the React Native app's API calls to reduce MITM risk on public wifi.
- **Root/jailbreak detection** — flag (not necessarily block) submissions from compromised devices for extra review, given the GPS-spoofing risk above.
- **Secure token storage** — auth tokens in Keychain/Keystore via a secure storage library, never plain AsyncStorage.

## 10. Testing & Ongoing Assurance

In addition to the dependency scanning and pre-launch pen test already in the main spec (§15):

- **Pen test scoped specifically to IDOR and cross-city authorization** — the most likely real-world vulnerability class for this data model.
- **Abuse-simulation load testing** — beyond raw performance load, simulate a burst of fake/duplicate submissions to confirm rate limiting and duplicate detection hold up together under adversarial conditions, not just normal traffic.

---

## Closure Checklist

Before Phase 4 sign-off, each item above should be marked one of: **Implemented**, **Deferred (with owner + target phase)**, or **Not applicable (with rationale)**. A security review is not complete until every row has a disposition, not just the ones that were easy to fix.
