# Change request: stabilize Next.js generated type files

- Requester: `integration-agent`
- Owner: `foundation-agent`
- Priority: P0 before QA
- Paths: `next.config.ts`, `tsconfig.json`, `.github/git-excludes`

## Problem

`next build` succeeds but Next.js 16 warns that `experimental.typedRoutes` moved to the root
`typedRoutes` option. It also reformats `tsconfig.json`, adds `.next/dev/types/**/*.ts`, and
generates root `next-env.d.ts`. Those generated changes cause later agent boundary checks to
fail even when application code is within ownership.

## Requested outcome

- Move `typedRoutes` to its supported Next.js 16 config location.
- Make the accepted `tsconfig.json` include stable so `next build` does not rewrite it.
- Treat root `next-env.d.ts` as a generated local artifact using the owned exclusion strategy,
  because no workflow agent currently owns that root path.

## Acceptance criteria

- `npm run build` passes without changing tracked files.
- the typed-routes warning is gone.
- `git status --short` after build contains no generated type files.
- typecheck, lint, tests, and Foundation boundary pass.
