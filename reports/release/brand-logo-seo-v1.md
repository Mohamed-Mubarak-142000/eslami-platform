# Brand logo and SEO release review

## Recommendation

`GO`

The supplied brand mark is integrated into the global header and Next.js metadata image
conventions. Localized search/social metadata, crawler rules, and the public sitemap are
present. Build, unit tests, ownership guards, and focused three-browser QA pass.

## Review notes

- Accessibility: the logo remains inside a labelled home link and has empty decorative alt.
- Privacy: private/auth paths are excluded in robots and retain route-level noindex metadata.
- Performance: the header logo uses optimized `next/image`; metadata images are static.
- Deployment: set `NEXT_PUBLIC_SITE_URL` to the real HTTPS production origin.

## Residual risk and rollback

- A missing production environment URL would emit the placeholder `basira.example` origin.
- Roll back `ca2f89b` for metadata issues and `f6c1dfb` for header-logo regressions.

## Blockers

- none
