# Module: src

Root router setup for the TanStack React Router application: builds the router instance from the generated route tree and supplies a default full-page error boundary component.

## Key files
- `src/router.tsx`: Defines getRouter() which calls createRouter with the generated routeTree, scroll restoration, zero preload stale time, and DefaultErrorComponent as the fallback error UI (with a 'Try again' action that invalidates the router and resets, and a 'Go home' link).
- `src/routeTree.gen.ts`: Generated route tree consumed by createRouter; contents not read, produced by the TanStack Router file-based routing generator.

## Public interface
- getRouter(): Router — factory returning a configured TanStack router instance (src/router.tsx)

## Dependencies
- @tanstack/react-router (createRouter, useRouter)
- ./routeTree.gen (routeTree)

## Open questions
- src/routeTree.gen.ts was not read, so the set of routes (including any server routes/handlers) in this module is unknown.
- Router context is an empty object ({}); it is unclear whether routes expect any context values.
- Error messages are shown only when import.meta.env.DEV is true; confirm no sensitive error details leak in production via other paths.
