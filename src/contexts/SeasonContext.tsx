import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export type Season = { id: string; name: string; sort_order: number; is_active: boolean };

const STORAGE_KEY = "sabbat.season_id";

interface SeasonContextType {
  seasons: Season[];
  season: Season | null;
  seasonId: string | null;
  setSeasonId: (id: string) => void;
  loading: boolean;
  openNewSeasonDialog: () => void;
}

const SeasonContext = createContext<SeasonContextType | null>(null);

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonId, setSeasonIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [makeActive, setMakeActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const setSeasonId = (id: string) => {
    setSeasonIdState(id);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, id);
  };

  // Newest season first — that is the one you are normally working in.
  const load = async (preferId?: string) => {
    const { data, error } = await supabase
      .from("seasons")
      .select("id,name,sort_order,is_active")
      .order("sort_order", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return [];
    }
    const rows = (data ?? []) as Season[];
    setSeasons(rows);
    setSeasonIdState((current) => {
      const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      const wanted = [preferId, current, stored].find((id) => id && rows.some((s) => s.id === id));
      return wanted ?? rows.find((s) => s.is_active)?.id ?? rows[0]?.id ?? null;
    });
    setLoading(false);
    return rows;
  };

  useEffect(() => { load(); }, []);

  const openNewSeasonDialog = () => {
    setName("");
    setMakeActive(true);
    setDialogOpen(true);
  };

  const createSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed.length > 40) return toast.error("Sæsonnavnet er for langt");
    setSubmitting(true);
    const nextOrder = seasons.reduce((max, s) => Math.max(max, s.sort_order), 0) + 1;
    const { data, error } = await supabase
      .from("seasons")
      .insert({ name: trimmed, sort_order: nextOrder, is_active: makeActive })
      .select("id")
      .single();
    setSubmitting(false);
    if (error) return toast.error(error.message);
    setDialogOpen(false);
    toast.success(`Sæsonen "${trimmed}" er oprettet`);
    await load(data.id);
  };

  const season = useMemo(
    () => seasons.find((s) => s.id === seasonId) ?? null,
    [seasons, seasonId],
  );

  return (
    <SeasonContext.Provider value={{ seasons, season, seasonId, setSeasonId, loading, openNewSeasonDialog }}>
      {children}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Ny sæson</DialogTitle>
          </DialogHeader>
          <form onSubmit={createSeason} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Navn</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Forår 26/27"
                maxLength={40}
                required
                autoFocus
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={makeActive} onCheckedChange={(v) => setMakeActive(v === true)} />
              Gør til aktiv sæson
            </label>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Opretter…" : "Opret sæson"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error("useSeason must be used within SeasonProvider");
  return ctx;
}
