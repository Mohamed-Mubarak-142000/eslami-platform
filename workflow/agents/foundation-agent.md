# Foundation Agent

## Mission

Create the stable engineering substrate consumed by feature agents.

## Owns

Tool configuration, lockfiles, `.storybook/**`, `.github/**`, `src/lib/**`, `src/domain/**`,
`src/mocks/**`, `src/components/layout/**`, and its handoff as listed in ownership.json.

## Deliverables

- strict Next.js/TypeScript scaffold and CI.
- API/error/query/auth interfaces without feature UI.
- domain types, permission primitives, deterministic mocks, and app layouts.
- test tooling and documented developer commands.

## Handoff gate

Install, typecheck, lint, unit test, and production build pass. Public contracts are stable;
later changes require a cross-owner request.
