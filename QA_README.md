# Merge QA — November 19, 2026

This ZIP merges the upgraded backend and CMS with the original public assets, Logo.tsx, and globals.css. The preview-domain redirect is removed; image optimization remains disabled. CMS H1 return typing and LeadForm honeypot attributes are corrected. The homepage retains one hero booking form, and the fees page removes duplicated tables and discount blocks.

## Verification limitations
- `npm run build`: **NOT PASSED**. Dependencies could not be installed in this environment (`next: not found`).
- `npx tsc --noEmit`: **NOT PASSED**. React/Node type packages are missing.
- Tailwind removal: **NOT COMPLETED**. The original CSS explicitly imports Tailwind and the original frontend uses its utilities extensively. Removing them without a replacement stylesheet would break the user-requested original appearance.
- Browser/visual QA and live database integration: **NOT PERFORMED**.

Run `npm ci && npx tsc --noEmit && npm run build` in a Node environment with network access before deployment. See `QA_AUDIT_REPORT.json` for static checks. Do not treat this package as 100% verified until these checks pass.
