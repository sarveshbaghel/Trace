# Trace — Production Technical Specification

### AI-Verified Civic Issue Reporting & Authority Escalation Platform

**Document type:** Product & Engineering Spec (v1.0)
**Status:** Draft for production build-out
**Last updated:** August 2026

---

## 1. Executive Summary

Trace is a mobile-first platform that lets citizens report civic infrastructure issues (potholes, garbage, broken streetlights, water leakage, drainage, damaged roads, illegal dumping, etc.) with a photo and precise GPS location. Every report is screened by an AI forensics pipeline, checked for duplicates, and reviewed by a human moderator before it becomes public. Approved reports are auto-published from the Trace account on X (Twitter), tagging the responsible municipal authority, creating public accountability and a traceable resolution record.

This document corrects and hardens the original concept doc into a spec suitable for a real production build — covering functional scope, non-functional requirements, system architecture, data model, API design, AI pipeline, security/compliance, infrastructure, observability, testing, and rollout plan.

---

## 2. Problem Statement

Existing civic complaint systems fail on:

- No verification — fake, stock, or edited images can be submitted
- Duplicate complaints flooding the same issue
- Complaints disappearing into unaccountable backlogs
- No way for citizens to verify action was taken
- Incomplete or inaccurate location data reaching authorities
- Low public visibility into unresolved issues
- Poor complaint lifecycle tracking

Trace addresses these with AI image verification, GPS-anchored geolocation, duplicate detection, mandatory human review, public posting for accountability, and full status tracking.

---

## 3. Goals & Non-Goals

### Goals
- Let citizens report an issue in under 60 seconds
- Guarantee every public post has passed authenticity + human review
- Route each complaint to the correct authority automatically
- Provide a fully auditable status trail from submission to resolution
- Support city-scale volume (thousands of reports/day) without manual bottlenecks

### Non-Goals (v1)
- Trace does not resolve issues itself — it escalates and tracks
- No payment processing or citizen incentive/rewards system in v1
- No native government case-management integration in v1 (API-ready for future integration only)
- Not a general-purpose social network — posting is one-directional (Trace → X)

---

## 4. Users & Personas

| Persona | Core needs |
|---|---|
| **Citizen** | Fast reporting, transparency on status, notifications, trust that reports aren't ignored |
| **Moderator/Admin** | Fast, low-friction review queue; clear AI signals; ability to reject spam/duplicates quickly |
| **City/Department Admin** | City-scoped visibility, analytics, SLA tracking for their department |
| **Government Authority (external)** | Accurate location, evidence, and a public record of the complaint tagged to them |
| **Platform Super Admin** | Manage cities, authorities, roles, and platform-wide analytics |

---

## 5. Functional Requirements

### 5.1 Authentication & Accounts
- Email + password and phone OTP sign-up/login
- JWT access tokens (short-lived) + refresh tokens (rotated, stored hashed)
- Password reset via email/OTP with rate-limited, expiring tokens
- Role-based access: `citizen`, `moderator`, `department_admin`, `super_admin`
- Profile management (name, phone, home city, notification preferences)

### 5.2 Complaint Submission
- In-app **live camera capture only** for the primary evidence photo (gallery upload disabled or clearly flagged as lower-trust, since gallery images are trivially manipulated/pre-edited — this is a correction from the original spec, which allowed gallery upload as an equal option)
- Automatic GPS capture at time of shot, with manual pin adjustment (max radius cap, e.g. 150m, to prevent gaming location)
- Reverse geocoding to human-readable address
- Map preview before submit
- Category selection (fixed taxonomy, see 5.3)
- Free-text description (min/max length enforced)
- Client-side compression before upload; upload resumable/chunked for weak networks
- Optimistic local queueing — submission works offline and syncs when connectivity returns

### 5.3 Complaint Categories
Pothole · Garbage Dump · Broken Streetlight · Water Leakage · Drainage Issue · Damaged Road · Illegal Dumping · Sewage Overflow · Traffic Signal Issue · Public Safety Hazard · Other (routed to super admin for reclassification)

### 5.4 Complaint Lifecycle (state machine)
```
SUBMITTED → AI_ANALYSIS → UNDER_REVIEW → (APPROVED | REJECTED | NEEDS_INFO)
APPROVED → POSTED → AUTHORITY_ACKNOWLEDGED → IN_PROGRESS → RESOLVED
                                            ↘ REOPENED (citizen disputes resolution)
```
Every transition is written to an immutable `status_history` record with actor, reason, and timestamp — this is the accountability backbone of the product.

### 5.5 Notifications
Push (FCM) + in-app for: submission received, AI analysis complete, moderator decision, posted publicly, authority acknowledged, work started, resolved, reopened.

### 5.6 Citizen Dashboard
Total / pending / in-progress / resolved counts, full complaint history, per-complaint timeline, ability to reopen a wrongly-closed complaint.

### 5.7 Admin/Moderator Console
- Review queue, prioritized by severity score and age (oldest-first with SLA countdown, not FIFO alone)
- Side-by-side: image, manipulation heatmap, AI scores, GPS + address, duplicate matches, submitter history
- Actions: approve, reject (with required reason), request more info, reassign category, reassign authority, add internal remarks
- Bulk actions for obvious spam/duplicate clusters
- Full-city map view with filters (category, status, date range, severity)
- Analytics: volume trends, category breakdown, resolution time distribution, authority SLA compliance, duplicate rate, AI flag rate

### 5.8 Authority Management
Each authority record: department name, city, category(ies) handled, X handle, contact email/phone, SLA target (hours/days), escalation contact for SLA breach.

### 5.9 Automatic Public Posting
On approval, a worker job posts to X with photo, address, coordinates + map link, complaint ID, and authority tag(s). Posting is queued and retried with backoff — **not** performed synchronously in the approval request path.

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Availability** | 99.5% for citizen-facing API in v1; target 99.9% post-scale |
| **Latency** | Complaint submission ack < 2s p95 (excluding AI analysis, which is async) |
| **Throughput** | Design for 10,000 complaints/day per city at launch, horizontally scalable |
| **Data durability** | Images and DB backed up with point-in-time recovery; no single point of failure on storage |
| **Security** | OWASP ASVS L2 baseline; all PII encrypted at rest and in transit |
| **Privacy** | Compliant with India's Digital Personal Data Protection (DPDP) Act, 2023 — see §10 |
| **Accessibility** | Mobile app meets WCAG 2.1 AA where applicable (contrast, tap targets, screen reader labels) |
| **Observability** | Every request traceable end-to-end; alerting on error-rate and queue-lag SLOs |
| **Localization** | UI and category labels support English + regional language(s) from v1.1 |

---

## 7. System Architecture

```
┌─────────────────┐
│ React Native App │
└────────┬─────────┘
         │ HTTPS (TLS 1.2+)
         ▼
┌─────────────────────┐
│  API Gateway / LB    │  (rate limiting, auth check, request routing)
└────────┬─────────────┘
         ▼
┌─────────────────────┐        ┌──────────────────────┐
│  Core API (Node.js)  │◄──────►│   Redis (cache +      │
│  NestJS, TypeScript   │        │   BullMQ job queues)  │
└────────┬──────────────┘        └──────────────────────┘
         │                                 │
         ▼                                 ▼
┌─────────────────────┐        ┌──────────────────────┐
│ PostgreSQL + PostGIS  │        │  Worker Processes     │
│ (primary datastore)   │        │  (AI dispatch, X post,│
└─────────────────────┘        │  notifications, dup    │
         │                       │  detection)            │
         ▼                       └──────────┬─────────────┘
┌─────────────────────┐                     ▼
│ Object Storage (S3)   │        ┌──────────────────────┐
│ + CDN for images       │◄──────►│ FastAPI AI Service    │
└─────────────────────┘        │ (TruFor, OpenCV,       │
                                  │  ExifTool, embeddings) │
                                  └──────────────────────┘
```

**Key correction from the original design:** X posting and AI analysis must be **asynchronous background jobs**, not steps in the synchronous request path. The original "linear pipeline" diagram implied blocking calls, which does not hold up under real traffic or third-party API latency/outages. All cross-service calls go through the Redis/BullMQ queue with retry + dead-letter handling.

---

## 8. Data Model (corrected & normalized)

All tables use UUID primary keys, `created_at`/`updated_at` timestamps, and soft-delete (`deleted_at`) where user-facing.

**users**
`id, name, email (unique), phone (unique), password_hash, role, home_city_id, notification_prefs, created_at, updated_at`

**complaints**
`id, user_id (fk), category, description, image_url, image_hash, latitude, longitude, geom (PostGIS point, indexed), address, city_id (fk), status, severity_score, created_at, updated_at`

**ai_analysis**
`id, complaint_id (fk, unique), authenticity_score, manipulation_score, ai_generated_probability, duplicate_score, model_version, heatmap_url, verdict, analyzed_at`

**duplicate_matches**
`id, complaint_id (fk), matched_complaint_id (fk), similarity_score, method (hash|embedding|geo_time), created_at`
*(Added table — the original schema had a `duplicate_score` field but no way to record which complaint it matched, which is required for moderator review.)*

**authorities**
`id, city_id (fk), department_name, category, twitter_handle, email, phone, sla_hours`

**cities**
`id, name, state, timezone`
*(Added — the original schema referenced "city" as a bare string on multiple tables with no canonical source of truth.)*

**posts**
`id, complaint_id (fk, unique), tweet_id, posted_at, post_status (pending|posted|failed), retry_count`

**status_history**
`id, complaint_id (fk), from_status, to_status, changed_by (fk users, nullable for system), reason, changed_at`

**refresh_tokens**
`id, user_id (fk), token_hash, expires_at, revoked_at`
*(Added — required for secure refresh-token rotation; missing from the original schema entirely.)*

Indexes: `complaints(geom)` GIST index for proximity queries, `complaints(status, created_at)` for queue ordering, `complaints(user_id)`, `duplicate_matches(complaint_id)`.

---

## 9. API Specification (versioned, `/api/v1`)

### Auth
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/otp/request
POST   /api/v1/auth/otp/verify
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/password/forgot
POST   /api/v1/auth/password/reset
```

### Complaints
```
POST   /api/v1/complaints
GET    /api/v1/complaints            (mine, paginated, filterable)
GET    /api/v1/complaints/:id
GET    /api/v1/complaints/:id/status
POST   /api/v1/complaints/:id/reopen
```

### Admin
```
GET    /api/v1/admin/queue
GET    /api/v1/admin/complaints/:id
POST   /api/v1/admin/complaints/:id/approve
POST   /api/v1/admin/complaints/:id/reject
POST   /api/v1/admin/complaints/:id/request-info
POST   /api/v1/admin/complaints/:id/reassign
GET    /api/v1/admin/analytics
GET    /api/v1/admin/authorities
POST   /api/v1/admin/authorities
PUT    /api/v1/admin/authorities/:id
```

### Internal (service-to-service, not public)
```
POST   /internal/ai/analyze
POST   /internal/social/post/:complaintId
POST   /internal/notifications/dispatch
```

All endpoints return a standard error envelope:
```json
{ "error": { "code": "COMPLAINT_NOT_FOUND", "message": "...", "requestId": "..." } }
```

---

## 10. AI Pipeline

1. Image uploaded → stored in object storage → job enqueued
2. FastAPI service loads TruFor pretrained forensics model, runs manipulation localization
3. Parallel checks: EXIF/metadata consistency (ExifTool), screenshot detection, perceptual hash + embedding generation for duplicate search
4. Duplicate search: perceptual hash exact/near match + PostGIS radius query (e.g. 100m) + time window (e.g. 14 days) + embedding cosine similarity threshold
5. Severity score computed from category, embedding cues, and historical resolution data (heuristic in v1, model-based later)
6. Results written to `ai_analysis` and `duplicate_matches`; complaint moves to `UNDER_REVIEW`

Example response:
```json
{
  "authenticity_score": 0.91,
  "manipulation_score": 0.08,
  "ai_generated_probability": 0.05,
  "verdict": "likely_genuine",
  "model_version": "trufor-v1.2"
}
```

**Correction:** AI scores are advisory signals for the moderator, never an auto-approve/auto-reject gate in v1. Full automation of publish decisions is a v2+ consideration once false-positive/negative rates are measured in production.

---

## 11. Third-Party Integrations

| Service | Purpose | Notes |
|---|---|---|
| X API v2 | Auto-posting | Use **OAuth 2.0 with PKCE** for the posting account (X API v2's current recommended auth for posting on behalf of an account); OAuth 1.0a is legacy and being phased down — correction from the original spec |
| Firebase Cloud Messaging | Push notifications | Standard for both iOS/Android via React Native |
| AWS S3 (or GCS) | Image storage | Private bucket, signed URLs, lifecycle rules to archive old resolved-complaint images |
| Mapbox / OpenStreetMap | Maps & reverse geocoding | Cache geocoding results to control cost |
| Sentry | Error tracking | Both mobile and backend |

---

## 12. Security & Compliance

- **Auth:** JWT (short TTL, e.g. 15 min) + rotating refresh tokens stored hashed; OTP rate-limited and expiring
- **Image handling:** MIME/type validation, size caps, virus/malware scanning before storage, EXIF GPS stripped from any *publicly posted* image copy (raw EXIF retained internally for verification only)
- **Privacy-by-design:** automatic face and license-plate blurring on the public-facing image variant before it is ever posted to X; the unblurred original stays access-controlled for moderators/authorities only
- **Regulatory:** Design for compliance with India's **Digital Personal Data Protection (DPDP) Act, 2023** — explicit consent capture at signup, data minimization, a documented data-retention policy, and a citizen-facing data deletion request flow. This is a correction/addition — the original spec had no data-protection-law section at all, which is a hard requirement for any India-facing citizen data platform.
- **Abuse prevention:** rate limiting per IP/account, CAPTCHA on repeated failed OTP/login attempts, duplicate/spam scoring, account suspension workflow with audit log
- **Transport/at-rest:** TLS everywhere, encrypted DB volumes, encrypted S3 buckets, secrets in a managed secret store (not env files in source control)

---

## 13. Infrastructure & DevOps

- **Containerization:** Docker for all services (API, worker, AI service)
- **Orchestration:** Start with a managed container platform (e.g. ECS/Cloud Run) for v1; move to Kubernetes only once operational complexity justifies it — avoid premature K8s overhead for an MVP-to-production path
- **IaC:** Terraform for all cloud resources (DB, storage, networking, secrets)
- **CI/CD:** GitHub Actions — lint → test → build → deploy to staging → manual promote to prod; run DB migrations as a gated pipeline step, never ad hoc
- **Environments:** isolated dev / staging / production with separate credentials and data
- **Config/secrets:** managed secret store (e.g. AWS Secrets Manager / GCP Secret Manager); no secrets in `.env` files committed to the repo

---

## 14. Observability

- **Logging:** structured JSON logs, correlation/request ID propagated from client → API → worker → AI service
- **Metrics:** request rate/latency/error-rate per endpoint, queue depth and job-processing latency, AI service inference time, X-post success/failure rate
- **Tracing:** distributed tracing across API → queue → AI service → posting worker
- **Alerting:** SLO-based alerts (e.g. review-queue age > SLA, job failure rate spike, X posting failures) routed to on-call
- **Error tracking:** Sentry (or equivalent) on mobile app, backend, and AI service

---

## 15. Testing Strategy

| Layer | Approach |
|---|---|
| Unit | Jest (backend/mobile), Pytest (AI service) — target meaningful coverage on business logic, not a vanity % |
| Integration | API contract tests against a real Postgres/Redis test instance (Testcontainers) |
| E2E | Detox (mobile) for the core submit → track flow; Playwright for the admin console |
| AI validation | Held-out labeled dataset of genuine/manipulated images to track false-positive/negative rates over time, not just a demo pass |
| Load | k6 or Artillery against submission and admin-queue endpoints before any public launch |
| Security | Dependency scanning (Dependabot/Snyk), periodic pen-test before major releases |

---

## 16. Disaster Recovery & Backup

- Automated daily PostgreSQL backups with point-in-time recovery (WAL archiving)
- Cross-region replication for object storage
- Documented RTO/RPO targets (e.g. RPO ≤ 1 hour, RTO ≤ 4 hours for v1)
- Quarterly restore drills — a backup that's never been restored is not a backup

---

## 17. Technology Stack (summary)

| Layer | Choice |
|---|---|
| Mobile | React Native (bare workflow), TypeScript, React Navigation, react-native-vision-camera, react-native-maps, react-native-geolocation-service, Zustand, Axios, FCM |
| Backend | Node.js, NestJS, TypeScript, JWT, Zod, BullMQ, Redis, Multer, Prisma |
| Database | PostgreSQL + PostGIS |
| AI Service | Python, FastAPI, PyTorch, TruFor, OpenCV, ExifTool |
| Storage | AWS S3 (or GCS) + CDN |
| Maps | Mapbox / OpenStreetMap |
| Social | X API v2, OAuth 2.0 (PKCE) |
| Infra | Docker, Terraform, GitHub Actions, ECS/Cloud Run (v1) |
| Observability | Sentry, structured logging, metrics/tracing stack (e.g. Prometheus/Grafana or a managed APM) |

---

## 18. Revised Development Roadmap

### Phase 0 — Foundations (1 week)
Repo setup, CI/CD skeleton, environments, IaC baseline, core data model & migrations.

### Phase 1 — Core Product (2–3 weeks)
Auth, camera + GPS capture, map preview, complaint submission, status tracking, citizen dashboard, basic admin queue (manual review, no AI yet).

### Phase 2 — AI & Trust Layer (2–3 weeks)
TruFor integration, metadata/screenshot checks, duplicate detection, severity scoring, admin console upgrades (heatmap, duplicate view), analytics dashboard.

### Phase 3 — Public Accountability Layer (2 weeks)
Authority management, X API integration (async posting worker), notifications, SLA tracking.

### Phase 4 — Production Hardening (2 weeks) — *new phase, missing from original plan*
Load testing, security review, DPDP compliance pass, observability rollout, backup/DR drill, staging soak test.

### Phase 5 — Launch & Iterate
Pilot in a single city/ward, monitor AI false-positive/negative rates and moderator throughput, then scale city-by-city.

---

## 19. Team Structure & Ownership

| Role | Owns |
|---|---|
| Mobile Engineer | React Native app, camera/GPS/map UX, offline queueing |
| Backend Engineer | API, auth, data model, queue/worker infra, integrations |
| AI/ML Engineer | TruFor pipeline, duplicate detection, severity scoring, model evaluation |
| (Recommended addition) DevOps/Platform | CI/CD, IaC, observability, on-call — can be shared across the above three initially, but should be an explicit responsibility, not implicit |

---

## 20. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| AI false-positives block genuine reports | Keep AI as advisory-only signal in v1; track precision/recall against labeled data |
| X API rate limits/outages block publishing | Async queue with retry + backoff; posting failure never blocks complaint lifecycle |
| Location spoofing / gaming duplicate detection | Combine GPS + time + image similarity, not any single signal alone |
| Legal exposure from public posting of identifiable people/vehicles | Mandatory face/plate blur before any public post |
| Moderator bottleneck at scale | Severity + age-based queue prioritization, bulk actions, city-scoped admin roles |
| Data protection non-compliance | DPDP-aligned consent, retention, and deletion flows built in from Phase 0, not bolted on later |

---

## 21. Future Scope

Before/after resolution verification photos · authority-facing response portal with API access · citizen reputation/trust scoring · ML-based severity estimation (replacing v1 heuristic) · city-wide heatmaps · multilingual AI description parsing · video evidence support · IoT/sensor integration for proactive detection · official government case-management portal integration.

---

## 22. Conclusion

Trace's core value is **verified public accountability**: AI-assisted forensics, precise geolocation, mandatory human review, and transparent public escalation, combined into an auditable lifecycle from report to resolution. This spec moves the original concept from an MVP demo flow to a production-shaped system — async processing, a normalized data model, compliance and privacy controls, observability, and a hardening phase before any public launch — while preserving the original product vision and roadmap timeline.
