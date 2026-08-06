# Guidelines

Conventions backed by **≥2** real, verbatim code examples. Anything with fewer is omitted below.

## Public functions are declared with `export function`.

- `src/contexts/AuthContext.tsx`:

  ```
  export function AuthProvider({ children }: { children: React.ReactNode }) {
  ```

- `src/hooks/use-mobile.tsx`:

  ```
  export function useIsMobile() {
  ```

## Rejected (insufficient evidence)

- Single-example convention (demo). — only 1 example(s) — no convention
