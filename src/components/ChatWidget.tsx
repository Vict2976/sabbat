import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = ["Hvornår er næste kamp?", "Hvem er topscorer?", "Hvem skylder flest bøder?"];

// Renders **bold** inline; everything else is plain text with line breaks kept.
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
      )}
    </>
  );
}

// Floating team assistant in the bottom-right corner. Only shown to logged-in users.
export function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  // Forget the conversation when the user logs out.
  useEffect(() => {
    if (!user) {
      setOpen(false);
      setMessages([]);
    }
  }, [user]);

  if (!user) return null;

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    const history: Message[] = [...messages, { role: "user", content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    const setAnswer = (content: string) =>
      setMessages((m) => [...m.slice(0, -1), { role: "assistant", content }]);

    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/assistent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token ?? ""}`,
        },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        setAnswer((await res.text().catch(() => "")) || "Noget gik galt. Prøv igen.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setAnswer(answer);
      }
      if (!answer) setAnswer("Jeg fik ikke noget svar. Prøv igen.");
    } catch {
      setAnswer("Kunne ikke få forbindelse. Prøv igen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed right-4 bottom-20 md:bottom-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col w-[calc(100vw-2rem)] sm:w-96 h-[min(32rem,calc(100dvh-10rem))] rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 h-12 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-display text-sm">FC</div>
              <div className="font-display text-lg leading-none">Holdassistenten</div>
            </div>
            <button onClick={() => setOpen(false)} title="Luk" className="p-1.5 rounded-md text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-muted-foreground">Spørg mig om kampe, truppen, statistik, bøder eller hvordan appen virker.</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 whitespace-pre-wrap break-words ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  {m.content ? <Rich text={m.content} /> : <span className="text-muted-foreground animate-pulse">Tænker…</span>}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv et spørgsmål…"
              maxLength={2000}
              className="flex-1 bg-transparent px-2 py-2 text-base sm:text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              title="Send"
              className="p-2 rounded-md bg-primary text-primary-foreground disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        title={open ? "Luk assistent" : "Spørg holdassistenten"}
        className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
