# Module: src/hooks

Provides a small React hook, useIsMobile, that reports whether the viewport is narrower than a 768px breakpoint, updating via a matchMedia change listener. This is purely client-side UI utility code; it has no server, data, or AI involvement.

## Key files
- `src/hooks/use-mobile.tsx`: Defines and exports useIsMobile(); sets up a window.matchMedia listener in useEffect and returns a boolean indicating mobile-width viewport (initially false until the effect runs).

## Public interface
- useIsMobile(): boolean — exported from src/hooks/use-mobile.tsx

## Dependencies
- react (React.useState, React.useEffect)
- Browser APIs: window.matchMedia, window.innerWidth

## Open questions
- The hook returns false during SSR and the first client render (state starts undefined), which may cause a layout flash or hydration mismatch in a TanStack Start SSR context; is that acceptable for its consumers?
- MOBILE_BREAKPOINT (768) is hardcoded and not exported; should it be shared with CSS/Tailwind breakpoints to avoid drift?
- No consumers of this hook are visible in the provided files; where is it used?
