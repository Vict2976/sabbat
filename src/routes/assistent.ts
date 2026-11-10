import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buildAssistantContext, systemPrompt } from "@/lib/assistant-context";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;

// Chat endpoint for the logged-in assistant. Streams the answer back as plain text.
export const Route = createFileRoute("/assistent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = process.env.SUPABASE_URL;
        const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!url || !anonKey || !apiKey) return new Response("Assistenten er ikke sat op", { status: 500 });

        // Only logged-in users: the Supabase access token must be valid.
        const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
        if (!token) return new Response("Log ind for at bruge assistenten", { status: 401 });
        const db = createClient<Database>(url, anonKey, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: claims, error: authError } = await db.auth.getClaims(token);
        if (authError || !claims?.claims?.sub) return new Response("Log ind for at bruge assistenten", { status: 401 });

        let messages: ChatMessage[];
        try {
          const body = (await request.json()) as { messages?: unknown };
          messages = (Array.isArray(body.messages) ? body.messages : [])
            .filter((m): m is ChatMessage =>
              !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
            .slice(-MAX_MESSAGES)
            .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
        } catch {
          return new Response("Ugyldig forespørgsel", { status: 400 });
        }
        if (!messages.length || messages[messages.length - 1].role !== "user") {
          return new Response("Ugyldig forespørgsel", { status: 400 });
        }

        const context = await buildAssistantContext(db);
        const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "X-Title": "FC Sabbatar",
          },
          body: JSON.stringify({
            model: process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-5.5",
            stream: true,
            max_tokens: 800,
            // Lookup answers need no extended thinking; it only adds delay and can eat the token budget.
            reasoning: { enabled: false },
            messages: [{ role: "system", content: systemPrompt(context) }, ...messages],
          }),
          signal: request.signal,
        });
        if (!upstream.ok || !upstream.body) {
          console.error("[assistent] OpenRouter", upstream.status, await upstream.text().catch(() => ""));
          return new Response("Assistenten kunne ikke svare lige nu", { status: 502 });
        }

        // Turn OpenRouter's SSE stream into a plain text stream of the answer.
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";
        const text = upstream.body.pipeThrough(
          new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, controller) {
              buffer += decoder.decode(chunk, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";
              for (const line of lines) {
                if (!line.startsWith("data: ")) continue;
                const data = line.slice(6).trim();
                if (data === "[DONE]") continue;
                try {
                  const delta = JSON.parse(data).choices?.[0]?.delta?.content;
                  if (delta) controller.enqueue(encoder.encode(delta));
                } catch {
                  // Keep-alive comments and partial lines are skipped.
                }
              }
            },
          }),
        );

        return new Response(text, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
