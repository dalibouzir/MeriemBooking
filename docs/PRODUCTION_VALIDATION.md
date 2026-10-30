# Production validation — 2026-10-24

## Passed locally

- Clean `npm ci` from the committed-format lockfile in an isolated directory.
- `npm run build`, including Next.js compilation, TypeScript and static generation.
- Focused ESLint checks for the changed pages, shared navigation, new editorial
  components, proxy, sitemap and production smoke script.
- `npm audit --omit=dev`: zero reported production dependency vulnerabilities
  after updating Zod to 4.6.7.
- Eight read-only production smoke-check groups under `next start`: the two
  landing pages, homepage navigation, library CTA/single chat widget, sitemap,
  optimized images/public caching, Arabic-login redirect and 404 behavior.
- Browser checks of phone layouts and CTA scrolling, plus tablet/desktop
  layouts, theme changes, phase tabs and mobile navigation.

Vercel settings are explicit: Next.js preset, Node 24.x, `npm ci`,
`npm run build`. Next.js middleware was migrated to the current proxy
convention. Production image placeholders and responsive image sizes are
included, and non-fingerprinted public images are no longer cached as
immutable for an entire year.

## Remaining limitations

- The full repository lint run still reports **104 existing errors and 25
  warnings** in older files. These were exposed by repairing the ESLint
  configuration; rules were not disabled to hide them. The conditional-hook
  bug in the challenge FAQ and shared navigation lint errors were fixed.
- Training enrollment remains a clearly labeled preview with sample dates and
  fees. The marriage workshop now shows the supplied schedule, early-bird
  deadline and package prices, and opens WhatsApp with a package-specific
  booking/payment inquiry. Payment is arranged in that conversation; there is
  no online checkout.
- No deployment was made and no hosted Vercel build was claimed. This checkout
  has no linked/authenticated Vercel project, so remote environment variables,
  integrations and the actual hosted build still require verification.

See [deployment setup](VERCEL_DEPLOYMENT.md) for the environment-variable
requirements and repeatable production checks.
