# Final audit and launch notes — 19 November 2026

## Changes made
- Canonical SEO origin, sitemap, robots and old Vercel-host redirect now consistently point to https://quran.pajee.org. The PAJEE parent organisation remains https://pajee.org.
- Public home and pricing route files explicitly declare `revalidate = 3600` for English, Urdu and Arabic, matching their shared view/cache definitions.
- Re-running the Neon bootstrap migration no longer overwrites edited pricing policies or rates: seed conflicts are ignored.
- `.env.example` clarifies that the Neon pooled database URL belongs in Vercel, not Git.

## Inspection results
- `.gitignore` ignores `.env*` and explicitly allows `.env.example`.
- Public language layouts use `SiteShell` for HTML lang and RTL direction.
- Admin panel layout calls `requireStaff`; sampled portal pages call `requireUser`; private app root declares noindex/nofollow. `next.config.ts` also sends X-Robots-Tag for private route families.
- The database module does not run automatic migrations on public requests. It opens a Neon pooled Postgres connection when configured.
- `images.unoptimized` is enabled; the legacy Vercel hostname redirects permanently to the academy subdomain.

## IMPORTANT: Not verified in this environment
- `npm ci` did not finish because dependency retrieval timed out. The supplied ZIP did not include a complete usable node_modules tree. Consequently `npx tsc --noEmit` and `npm run build` could not be completed; **zero build errors are NOT guaranteed**.
- No live Neon credentials or Vercel deployment were supplied; database execution, real login/session flows, real ISR cache hit rate and DNS resolution were not verified.
- ISR caching does not mean Neon is never contacted: cache misses, expiry, metadata reads, admin activity and authenticated requests can query Neon.
- Source-level checks are not a substitute for penetration testing or production smoke tests.

## Five-step launch checklist
1. **Neon:** Create a database and run `migrations/0001_neon_bootstrap.sql` in Neon SQL Editor. Copy the **pooled** connection URL (hostname includes `-pooler`).
2. **Vercel:** Add environment variables from `.env.example` under Project Settings > Environment Variables. Required: `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL=https://quran.pajee.org`, `ADMIN_PASSWORD` and a long random `AUTH_SECRET`. Keep secrets private. Redeploy after saving.
3. **GitHub:** Push the project without `.env`, `.data`, or `node_modules`. Connect the repository to Vercel. Confirm `npm ci`, TypeScript and production build succeed in Vercel logs before proceeding.
4. **Hostinger DNS:** In the DNS zone for `pajee.org`, add a CNAME for host `quran` pointing to the exact Vercel target shown in the Vercel domain settings. Add `quran.pajee.org` as a domain in Vercel and wait for DNS and HTTPS validation.
5. **Live verification:** Open the homepage and `/ur`, `/ar`, `/pricing`, `/sitemap.xml`, `/robots.txt`. Check RTL, canonical/hreflang, a test lead, admin login, and restricted portal/teacher access. Check Vercel logs and Neon usage after the first visits.
