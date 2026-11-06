# Module: api

Deployment adapter that exposes the built TanStack Start server as a Node-style serverless function: it converts an incoming Node (req, res) pair into a WHATWG Request, dispatches it to the compiled server's fetch handler, and streams the resulting Response back to the Node response.

## Key files
- `api/ssr.js`: Default-exported async handler(req, res); reconstructs the absolute URL from x-forwarded-proto/x-forwarded-host, copies headers (including multi-value arrays), attaches a streamed body for non-GET/HEAD methods, calls server.fetch(request), then mirrors status and headers (dropping transfer-encoding) and pipes the response body chunk-by-chunk to res before ending.

## Public interface
- default export async function handler(req, res) in api/ssr.js — Node request/response entrypoint intended to be invoked by the hosting platform's serverless runtime

## Dependencies
- ../dist/server/server.js (build output; must expose a `fetch(Request)` method as its default export)
- node:stream (Readable.toWeb for converting the Node request body to a web ReadableStream)

## Where the code disagrees with the stack profile
- `api/ssr.js`: The module contains server-side handler code outside src/routes/ and in a different shape than a TanStack Start server route: api/ssr.js is a Node/Vercel-style serverless function with a (req, res) signature that manually bridges to the compiled server's fetch() method, rather than a TanStack Start server route definition.

## Open questions
- Which hosting platform invokes this file? The api/ directory plus res.status()/res.setHeader() usage suggests a Vercel Node serverless function, but no platform config was provided in this module.
- How is the dist/server/server.js artifact guaranteed to exist at deploy time (build step ordering)? It is imported statically at module load.
- There is no try/catch around server.fetch; what happens on a thrown error (500 handling, logging)?
- Response streaming uses res.write without honoring backpressure (no drain handling); is this acceptable for large SSR payloads?
- Is this adapter still needed, or does the TanStack Start/Vite build already emit a platform-specific entry that makes this file redundant?
