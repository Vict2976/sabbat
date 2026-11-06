# Module: (root)

Root-level tooling configuration for the repository: ESLint (flat config with TypeScript, React Hooks, React Refresh, and Prettier integration) and the Vite build configuration wiring in TanStack Start, React, Tailwind CSS, and tsconfig path aliases.

## Key files
- `vite.config.ts`: Vite build/dev config registering the TanStack Start plugin, @vitejs/plugin-react, @tailwindcss/vite, and vite-tsconfig-paths.
- `eslint.config.js`: ESLint flat config: ignores dist/.output/.vinxi, applies @eslint/js and typescript-eslint recommended rules to *.ts/*.tsx with browser globals, enables react-hooks and react-refresh plugins, disables @typescript-eslint/no-unused-vars, and appends eslint-plugin-prettier/recommended.

## Public interface
- vite.config.ts: default export of defineConfig({...}) consumed by the Vite CLI
- eslint.config.js: default export of tseslint.config(...) consumed by the ESLint CLI

## Dependencies
- vite
- @tanstack/react-start/plugin/vite
- @vitejs/plugin-react
- @tailwindcss/vite
- vite-tsconfig-paths
- @eslint/js
- eslint-plugin-prettier
- globals
- eslint-plugin-react-hooks
- eslint-plugin-react-refresh
- typescript-eslint

## Open questions
- Why is @typescript-eslint/no-unused-vars disabled outright rather than configured with ignore patterns?
- The ESLint config uses globals.browser only; server-side code (TanStack Start server routes) may reference Node/server globals that this config will not recognize.
- The .vinxi ignore entry suggests a legacy Vinxi-based build; is it still relevant now that the Vite plugin from @tanstack/react-start is used?
- No tsconfig.json was provided, so the path aliases resolved by vite-tsconfig-paths cannot be confirmed here.
