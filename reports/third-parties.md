# Third-Party Services Inventory
**Site:** https://www.fittrahmoms.com/  
**Date:** December 20, 2025

## Active Third Parties

### 1. Supabase (Database & Storage)
- **Domain:** ixngvksnkofmwaxhhdfh.supabase.co
- **Purpose:** Database backend, file storage
- **Data Sent:** User data, session info, file uploads
- **Privacy Impact:** High (stores PII)
- **CSP Requirement:** `connect-src 'self' https://*.supabase.co`

### 2. Calendly (Scheduling)
- **Domain:** calendly.com (external links only)
- **Purpose:** Session booking (linked externally)
- **Data Sent:** User redirected to Calendly
- **Privacy Impact:** Medium (user enters info on Calendly)
- **Note:** No embed, just external links

### 3. Vercel Analytics
- **Domain:** vitals.vercel-insights.com (loaded dynamically)
- **Purpose:** Privacy-friendly site analytics
- **Data Sent:** Page views, web vitals, anonymized
- **Privacy Impact:** Low (no PII, cookie-less)
- **CSP Requirement:** `connect-src 'self' https://vitals.vercel-insights.com`

### 4. Meta Pixel (Server-side)
- **Domain:** graph.facebook.com (API calls)
- **Purpose:** Conversion tracking (server-side only)
- **Data Sent:** Lead events via server API
- **Privacy Impact:** Medium (server-side, hashed data)
- **Note:** No client-side pixel loaded

### 5. Stripe (Payments - Conditional)
- **Domain:** stripe.com, js.stripe.com
- **Purpose:** Payment processing
- **Data Sent:** Payment info (on checkout)
- **Privacy Impact:** High (financial data)
- **CSP Requirement:** `script-src 'self' https://js.stripe.com; frame-src https://js.stripe.com`

### 6. Google APIs (Calendar)
- **Domain:** googleapis.com
- **Purpose:** Calendar integration (backend)
- **Data Sent:** Calendar events
- **Privacy Impact:** Low (backend only)

### 7. Image CDNs
- **Domains:** 
  - cdn.apartmenttherapy.info
  - blogger.googleusercontent.com
  - i.ibb.co
- **Purpose:** External images
- **Privacy Impact:** Low
- **CSP Requirement:** `img-src 'self' data: https://cdn.apartmenttherapy.info https://blogger.googleusercontent.com https://i.ibb.co https://*.supabase.co`

## Network Requests Summary (from Lighthouse)
| Domain | Requests | Transfer Size |
|--------|----------|---------------|
| www.fittrahmoms.com | ~60 | ~680 KB |
| ixngvksnkofmwaxhhdfh.supabase.co | 4 | 2.3 KB |

## CSP Recommendation (Report-Only)
```
Content-Security-Policy-Report-Only: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://*.supabase.co https://cdn.apartmenttherapy.info https://blogger.googleusercontent.com https://i.ibb.co;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co https://vitals.vercel-insights.com https://graph.facebook.com;
  frame-src 'self' https://js.stripe.com;
  frame-ancestors 'self';
  base-uri 'self';
  form-action 'self';
```

## Notes
- No Google Tag Manager or GA4 detected
- No client-side Facebook Pixel detected (server-side only)
- Calendly is external links only, no embeds
- Fonts loaded from Next.js (self-hosted via @next/font)
