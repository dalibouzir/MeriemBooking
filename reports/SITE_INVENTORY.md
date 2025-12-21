# SITE INVENTORY - fittrahmoms.com

## Scope
- Role: senior full-stack auditor (performance, technical SEO, accessibility, security, privacy/compliance)
- Target: https://www.fittrahmoms.com (entire site)
- Method: code inspection plus minimal crawl (depth 3, max 25 pages) of public HTML, sitemap.xml, and robots.txt

## Sources Used
- Filesystem routing: `src/app/**/page.*` and `src/app/api/**/route.*`
- Live fetch: `https://www.fittrahmoms.com/`, `https://www.fittrahmoms.com/sitemap.xml`, `https://www.fittrahmoms.com/robots.txt`
- Internal link crawl: homepage links, depth 3

## URL Map
Note: Arabic strings are escaped as `\uXXXX` to keep ASCII-only output. The full list is also in `reports/URLS.csv`.

### Public Pages
| path | public/private | auth required | indexable | status | title | canonical |
| --- | --- | --- | --- | --- | --- | --- |
| / | public | no | yes | 200 | Fittrah Moms \| \u0641\u0637\u0631\u0629 \u0627\u0644\u0623\u0645\u0647\u0627\u062a | https://www.fittrahmoms.com |
| /%D8%AF%D8%AE%D9%88%D9%84 | public | no | no | 200 | Fittrah Moms \| \u0641\u0637\u0631\u0629 \u0627\u0644\u0623\u0645\u0647\u0627\u062a | https://www.fittrahmoms.com |
| /assistant | public | no | yes | 200 | Fittrah Moms \| \u0641\u0637\u0631\u0629 \u0627\u0644\u0623\u0645\u0647\u0627\u062a | https://www.fittrahmoms.com |
| /booking | public | no | yes | 200 | \u0627\u062d\u062c\u0632\u064a \u062c\u0644\u0633\u062a\u0643 \| \u062c\u0644\u0633\u0629 \u0625\u0631\u0634\u0627\u062f \u0641\u0631\u062f\u064a\u0629 \| Fittrah Moms | https://www.fittrahmoms.com/booking |
| /challenge | public | no | yes | 200 | \u062a\u062d\u062f\u064a \u0627\u0648\u0646\u0644\u0627\u064a\u0646 \u0645\u062c\u0627\u0646\u064a \| Fittrah Moms \| Fittrah Moms | https://www.fittrahmoms.com |
| /chat | public | no | yes | 200 | \u0627\u0644\u062f\u0631\u062f\u0634\u0629 \u0648\u0627\u0644\u0646\u0645\u0627\u0630\u062c \| \u0641\u0637\u0631\u0629 \u0627\u0644\u0623\u0645\u0647\u0627\u062a \| Fittrah Moms | https://www.fittrahmoms.com |
| /download | public | no | yes | 200 | \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062c \u0627\u0644\u062a\u062f\u0631\u064a\u0628\u064a \| Fittrah Moms \| Fittrah Moms | https://www.fittrahmoms.com/train-program |
| /faq | public | no | yes | 200 | \u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629 \| Fittrah Moms \| Fittrah Moms | https://www.fittrahmoms.com/faq |
| /free-call | public | no | yes | 200 | Fittrah Moms \| \u0641\u0637\u0631\u0629 \u0627\u0644\u0623\u0645\u0647\u0627\u062a | https://www.fittrahmoms.com |
| /free-call/redeem | public | no | yes | 200 | Fittrah Moms \| \u0641\u0637\u0631\u0629 \u0627\u0644\u0623\u0645\u0647\u0627\u062a | https://www.fittrahmoms.com |
| /login | public | no | no | 200 | Fittrah Moms \| \u0641\u0637\u0631\u0629 \u0627\u0644\u0623\u0645\u0647\u0627\u062a | https://www.fittrahmoms.com |
| /policy | public | no | yes | 200 | \u0627\u0644\u0634\u0631\u0648\u0637 \u0648\u0627\u0644\u0623\u062d\u0643\u0627\u0645 \| Fittrah Moms | https://www.fittrahmoms.com/policy |
| /privacy | public | no | yes | 200 | \u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629 \| Fittrah Moms | https://www.fittrahmoms.com/privacy |
| /products | public | no | yes | 200 | \u0627\u0644\u0645\u0643\u062a\u0628\u0629 \| \u0645\u0644\u0641\u0627\u062a \u0648\u0645\u0648\u0627\u062f \u062a\u0639\u0644\u064a\u0645\u064a\u0629 \u0645\u062c\u0627\u0646\u064a\u0629 \| Fittrah Moms | https://www.fittrahmoms.com/products |
| /redeem | public | no | yes | 200 | Fittrah Moms \| \u0641\u0637\u0631\u0629 \u0627\u0644\u0623\u0645\u0647\u0627\u062a | https://www.fittrahmoms.com |
| /session | public | no | yes | 200 | Fittrah Moms \| \u0641\u0637\u0631\u0629 \u0627\u0644\u0623\u0645\u0647\u0627\u062a | https://www.fittrahmoms.com |
| /success | public | no | yes | 200 | Fittrah Moms \| \u0641\u0637\u0631\u0629 \u0627\u0644\u0623\u0645\u0647\u0627\u062a | https://www.fittrahmoms.com |
| /train-program | public | no | yes | 200 | \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062c \u0627\u0644\u062a\u062f\u0631\u064a\u0628\u064a \| Fittrah Moms \| Fittrah Moms | https://www.fittrahmoms.com/train-program |

### Private/Admin Pages
| path | public/private | auth required | indexable | status | title | canonical |
| --- | --- | --- | --- | --- | --- | --- |
| /admin | private | yes | no | 200 | Fittrah Moms \| \u0641\u0637\u0631\u0629 \u0627\u0644\u0623\u0645\u0647\u0627\u062a | https://www.fittrahmoms.com |
| /admin/analytics-en | private | yes | no | 200 | Fittrah Moms \| \u0641\u0637\u0631\u0629 \u0627\u0644\u0623\u0645\u0647\u0627\u062a | https://www.fittrahmoms.com |
| /admin/challenge | private | yes | no | 200 | Fittrah Moms \| \u0641\u0637\u0631\u0629 \u0627\u0644\u0623\u0645\u0647\u0627\u062a | https://www.fittrahmoms.com |

### API Routes
| path | public/private | auth required | indexable | status | title | canonical |
| --- | --- | --- | --- | --- | --- | --- |
| /api/admin/analytics-en/clicks | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics-en/devices | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics-en/requests | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics-en/series | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics-en/summary | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics/by-country | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics/by-device | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics/by-product | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics/by-referrer | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics/by-source | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics/clicks | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics/export | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics/requests | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics/summary | private | yes | no | unknown | n/a | n/a |
| /api/admin/analytics/timeseries | private | yes | no | unknown | n/a | n/a |
| /api/admin/bulk-email | private | yes | no | unknown | n/a | n/a |
| /api/admin/download-requests | private | yes | no | unknown | n/a | n/a |
| /api/admin/library | private | yes | no | unknown | n/a | n/a |
| /api/admin/products | private | yes | no | unknown | n/a | n/a |
| /api/admin/products-upload | private | yes | no | unknown | n/a | n/a |
| /api/admin/stats | private | yes | no | unknown | n/a | n/a |
| /api/admin/tokens | private | yes | no | unknown | n/a | n/a |
| /api/assistant | public | no | no | unknown | n/a | n/a |
| /api/auth/[...nextauth] | private | no | no | unknown | n/a | n/a |
| /api/call/redeem | public | no | no | unknown | n/a | n/a |
| /api/call/verify | public | no | no | unknown | n/a | n/a |
| /api/debug/auth-env | private | no | no | unknown | n/a | n/a |
| /api/debug/env | private | no | no | unknown | n/a | n/a |
| /api/debug/supabase-env | private | no | no | unknown | n/a | n/a |
| /api/meta/lead | public | no | no | unknown | n/a | n/a |
| /api/metrics/download-click | public | no | no | unknown | n/a | n/a |
| /api/public/book | public | no | no | 410 | n/a | n/a |
| /api/redeem | public | no | no | unknown | n/a | n/a |
| /api/request-download | public | no | no | unknown | n/a | n/a |

### SEO/Utility Endpoints
| path | public/private | auth required | indexable | status | title | canonical |
| --- | --- | --- | --- | --- | --- | --- |
| /robots.txt | public | no | no | 200 | n/a | n/a |
| /sitemap.xml | public | no | no | 200 | n/a | n/a |

### Likely Non-Indexable Candidates (flagged for later review)
- `/admin`, `/admin/*`, `/api/*`, `/api/debug/*` (internal/admin tooling)
- `/login`, `/%D8%AF%D8%AE%D9%88%D9%84` (admin login)
- `/redeem`, `/free-call`, `/free-call/redeem`, `/download`, `/success` (funnel/utility flows)
- `/assistant` (interactive tool not meant for SEO landing)

## Functionality and Feature Inventory

### A) Marketing/Content Features
- Global layout includes topbar navigation, theme switcher, mobile menu, background visuals, and a route change progress indicator.
- Homepage includes hero messaging, CTA buttons to booking and library, session explanation, testimonial carousel, featured resources, FAQ accordion, and footer with legal/contact links.
- Structured data (JSON-LD) for Organization, WebSite, and Person is injected in the root layout.
- Social and contact links include Instagram, YouTube, Linktree, WhatsApp, and email.
- Policy and privacy pages provide legal copy (static content pages).

### B) Products/Programs Features
- `/products` shows a library of free resources loaded from Supabase `products` (legacy) with filtering (all/books/videos), cards, and CTAs to `/download?product=...`.
- `/download` is the lead capture form for resource access; if no `product` query param, it redirects to `/train-program`.
- `/train-program` is a coming-soon page with no form submission.
- `/challenge` is a dynamic landing page driven by Supabase `challenge_settings` with a registration modal and YouTube video embed.
- `/session` is a marketing page that directs users to WhatsApp for booking.
- `/booking` is a static booking page that links out to Calendly.

### C) Booking Features
- Calendly booking links appear on `/booking`, `/session`, the homepage footer, and success screens.
- Free-call flow: `/download` -> email code -> `/redeem` or `/free-call/redeem` -> `/free-call?token=...` with token validation via `/api/call/verify`.
- `/success` can accept query params (`callBookingUrl`, `ctaLabel`, `supportText`, `videoUrl`) to customize the post-download CTA.

### D) Forms and Data Capture
- Download request form (`/download`): fields include first name, last name, email, country code, phone, product slug, and optional snippet; posts to `/api/request-download`.
- Free-call redemption (`/redeem`, `/free-call/redeem`): single code input; posts to `/api/call/redeem`.
- Challenge registration (`/challenge` modal): name and email (phone optional in server action); stored via Supabase RPC.
- Chat/forms page (`/chat`): intake, feedback, and support forms with client-side validation only; data is logged in console and not sent to a backend.
- Admin login (`/login`, `/%D8%AF%D8%AE%D9%88%D9%84`): NextAuth credentials flow using email/password.

### E) AI Helper / Chatbot
- Global chatbot widget provides canned responses and quick replies; no backend calls. Keywords include `dali` and `\u062f\u0627\u0644\u064a` (admin login hint).
- AI assistant (`/assistant`) posts conversation history to `/api/assistant`, which calls OpenAI Chat Completions (`gpt-4o-mini`) using a system prompt in `src/app/api/assistant/route.ts`.
- No rate limiting or storage is implemented for the assistant endpoint; client uses markdown rendering with sanitization.

### F) Admin Panel / Internal Tools
- `/admin` is gated by NextAuth session (credentials). Tabs include:
  - Calendar: links to Calendly.
  - Bulk email: builds a Gmail compose link with BCC list from `/api/admin/download-requests`.
  - Bulk WhatsApp: creates `wa.me` links and clipboard bundles from collected phone numbers.
  - Products: CRUD and file uploads via `/api/admin/products` and `/api/admin/products-upload` (Supabase storage).
  - Analytics: embedded analytics client uses `/api/admin/analytics-en/*`.
- `/admin/analytics-en` shows download analytics (summary, time series, devices, requests, clicks).
- `/admin/challenge` manages challenge settings, stats, registrations, CSV export, and waitlist promotion via server actions.

### G) Analytics/Monitoring
- Vercel Analytics is enabled globally (`@vercel/analytics/react`).
- Custom click tracking posts to `/api/metrics/download-click` and stores `download_clicks` in Supabase.
- Download requests create `download_requests` and `call_tokens` in Supabase.
- Meta Conversions API posts lead events via `/api/meta/lead` with hashed identifiers.
- Admin analytics endpoints query Supabase for reporting.

### H) Internationalization/Localization
- Root document uses `lang=ar` and `dir=rtl`.
- Arabic login alias at `/%D8%AF%D8%AE%D9%88%D9%84` rewrites to `/login`.
- `/success` supports `locale=en` to render English copy.

## Third-Party Services (code + network evidence)
| domain | service | purpose | where used | data shared |
| --- | --- | --- | --- | --- |
| calendly.com | Calendly | appointment scheduling | `/booking`, `/session`, homepage CTA, email templates | user-entered booking details (name/email/time) on Calendly |
| api.openai.com | OpenAI | AI assistant responses | `/api/assistant` | user messages, system prompt, model params |
| graph.facebook.com | Meta CAPI | lead conversion tracking | `/api/meta/lead` | hashed email/phone, IP, user-agent, event id, fbp/fbc |
| api.resend.com | Resend | transactional/bulk email | Supabase edge functions `send-gift-email`, `send-challenge-email`, `send-bulk-email` | recipient email, name, download URL, meeting details, subject/body |
| *.supabase.co | Supabase | database, storage, edge functions | `/api/request-download`, challenge actions, `/api/admin/*` | download requests, call tokens, challenge registrations, products, library assets |
| vitals.vercel-analytics.com (via @vercel/analytics) | Vercel Analytics | site analytics | root layout | page view/telemetry (details not in code) |
| youtube.com, youtube-nocookie.com, img.youtube.com | YouTube | video embeds and thumbnails | `/success`, `/challenge` | video playback data (cookie behavior depends on embed host) |
| drive.google.com | Google Drive | optional video embed | `/success` (if videoUrl is a Drive link) | unknown |
| wa.me | WhatsApp | direct chat links | homepage, `/session`, `/chat`, support CTAs | phone number and optional message in URL |
| linktr.ee, instagram.com, youtube.com | social platforms | outbound social navigation | homepage/footer links | unknown |
| mail.google.com | Gmail | bulk email helper | `/admin` bulk email tab | selected emails, subject/body in URL params |
| googleapis.com/calendar/v3 | Google Calendar API | calendar helper library (not wired to route) | `src/lib/google-calendar.ts` | would send event/availability data if used |
| cdn.apartmenttherapy.info, blogger.googleusercontent.com, i.ibb.co | external image hosts | Next Image remote sources | homepage/resources | image asset requests |

## Data Flow Map (privacy baseline)
| entry point | data fields | destination | purpose | storage | retention | cookies/localStorage |
| --- | --- | --- | --- | --- | --- | --- |
| `/download` form | first_name, last_name, email, phone, country, product, source, click_id, user_agent | `/api/request-download` -> Supabase `download_requests` + `call_tokens` | deliver download + generate free-call code | Supabase DB + storage lookup | privacy policy says 3 years for contact/booking; otherwise unknown | sessionStorage `fm_click_id`, `fm_click_source`; reads cookies `_fbp`, `_fbc` |
| `/products` click tracking | clickId, product, source, referrer, event | `/api/metrics/download-click` -> Supabase `download_clicks` | attribution for downloads | Supabase DB | unknown | sessionStorage `fm_click_id`, `fm_click_source` |
| `/api/meta/lead` | email, phone, event_id, event_source_url, fbp/fbc, IP, user-agent | Meta Graph API | conversion tracking | Meta | unknown | reads cookies `_fbp`, `_fbc` |
| `/redeem` / `/free-call/redeem` | code | `/api/call/redeem` -> Supabase `call_tokens` | validate code, issue access token | Supabase DB | code expiry enforced (30 days for code, 7 days for access token) | none |
| `/free-call` | token | `/api/call/verify` | verify access token for booking page | Supabase DB | access token expiry 7 days | none |
| `/challenge` registration | name, email (phone optional) | Supabase RPC `register_for_challenge` + `send-challenge-email` | register for challenge, send meeting link | Supabase DB + Resend | unknown | none |
| `/assistant` | chat messages | `/api/assistant` -> OpenAI | AI responses | no storage in code | unknown | none |
| `/chat` forms | intake, feedback, support fields | client-only (no API) | UX-only demo forms | none | n/a | none |
| `/admin` product upload | product metadata + file uploads | `/api/admin/products*` -> Supabase storage + DB | manage library products | Supabase storage + DB | unknown | none |
| Theme switcher | theme id | localStorage | remember theme | localStorage | user-controlled | localStorage |
| Success video progress | playback time | sessionStorage | resume video | sessionStorage | session only | sessionStorage |

## Security/Privacy Control Checklist (non-intrusive)
- Headers configured in `next.config.js` and middleware: `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`.
- Auth/session: NextAuth credentials provider with JWT sessions; admin access is gated by email match to `MERIEM_ADMIN_EMAIL`.
- Basic abuse controls: rate limiting only on `/api/meta/lead` (in-memory, 10 req/min per IP). No rate limiting on `/api/request-download` or `/api/assistant`.
- robots.txt present and disallows `/admin/`, `/api/`, `/debug/`, `/login`, `/%D8%AF%D8%AE%D9%88%D9%84`; sitemap.xml present with 7 URLs.
- Accidental exposure risks observed in code/config:
  - Debug endpoints under `/api/debug/*` are unauthenticated and reveal env presence/prefixes.
  - `.env.local` in repo contains real secrets (OpenAI key, Supabase service role key, Resend key, Google refresh token, admin password). Ensure it is not committed and rotate if exposed.
  - Many pages default to canonical `https://www.fittrahmoms.com` even when not the homepage (could confuse SEO).

## Assumptions / Unknowns
- API route status codes are not all verified over the network; only public pages and `/api/public/book` are confirmed.
- External service data retention (Calendly, OpenAI, Resend, Meta) is not specified in code.
- Supabase schema inferred from code and migrations only; live table contents not inspected.
- Some flows depend on env vars (`NEXT_PUBLIC_SUCCESS_VIDEO_URL`, `NEXT_PUBLIC_SUCCESS_CALL_BOOKING_URL`, etc.); behavior may vary per deployment.
- Arabic content is represented as unicode escape sequences to keep ASCII-only output.
