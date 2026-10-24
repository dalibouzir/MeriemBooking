# Vercel deployment

The application uses the Next.js framework preset. `vercel.json` sets `npm ci`
as the install command and `npm run build` as the build command. Node.js is
pinned to `24.x` in `package.json`. Let Vercel manage the output directory.

The Git repository root is the application root (`meriem-booking` locally).
Use `.` as Vercel's Root Directory when connecting this repository.

## Environment

Set variables in the Vercel project for each intended environment. Local
`.env.local` values are not uploaded or committed by this task.

| Feature | Variables |
| --- | --- |
| Public library and Supabase client, including build-time rendering | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Site URLs | `NEXT_PUBLIC_SITE_URL`, `NEXTAUTH_URL` (production: `https://www.fittrahmoms.com`) |
| Admin sign-in | `NEXTAUTH_SECRET`, `MERIEM_ADMIN_EMAIL`, `MERIEM_ADMIN_PASSWORD` |
| Server database access | `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`; `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE` |
| Transactional email | `RESEND_API_KEY`, plus the verified sender settings used by the enabled email routes |
| AI assistant | `OPENROUTER_API_KEY`; optional `OPENROUTER_MODEL`, `OPENROUTER_MAX_TOKENS`, `OPENROUTER_APP_NAME` |
| Optional Meta tracking | `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_GRAPH_API_VERSION` |

Only intentionally public values belong in `NEXT_PUBLIC_*` variables.
Production environment configuration and a hosted Vercel build still need to
be verified in the actual Vercel project; no linked project or Vercel CLI
authentication is available in this checkout.

## Checks

```sh
npm ci
npm run typecheck
npm run build
npm run start -- --port 3100
# In another terminal:
npm run smoke:production
```

`npm run smoke:production -- https://your-preview.vercel.app` can also check a
publicly accessible Vercel preview. It performs read-only requests.

`npm run lint` checks the entire repository. The restored ESLint flat config
exposes existing issues in older application files; do not disable rules to
make that backlog appear clean. The changed page and navigation components
can be checked independently while the legacy backlog is addressed.

## Enrollment is still a preview

Training dates, hours, platform and price are sample values and are visibly
labeled as non-final. Workshop date and price remain placeholders. Both final
registration buttons are disabled. The mobile bars navigate to the details;
they do not create a registration or payment.

Before opening paid enrollment, replace the preview values, supply the real
registration destination and explicitly enable the final buttons. Do not add
event structured data containing the sample dates or prices.
