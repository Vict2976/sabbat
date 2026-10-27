import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSeason } from "@/contexts/SeasonContext";
import { useAuth } from "@/contexts/AuthContext";

const NEW_SEASON = "__new_season__";

export function SeasonPicker({ className }: { className?: string }) {
  const { seasons, seasonId, setSeasonId, openNewSeasonDialog, loading } = useSeason();
  const { user, openLoginDialog } = useAuth();

  if (loading) return null;

  // No seasons at all almost always means the seasons migration has not been applied yet.
  if (!seasonId) {
    return (
      <span
        title="Ingen sæsoner fundet — kør databasemigrationen (supabase db push)"
        className={`inline-flex h-8 items-center rounded-md border border-dashed border-border px-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${className ?? ""}`}
      >
        Ingen sæsoner
      </span>
    );
  }

  const onChange = (value: string) => {
    if (value !== NEW_SEASON) return setSeasonId(value);
    if (!user) return openLoginDialog();
    openNewSeasonDialog();
  };

  return (
    <Select value={seasonId} onValueChange={onChange}>
      <SelectTrigger
        aria-label="Vælg sæson"
        className={`h-8 gap-1.5 border-border bg-card px-2.5 text-xs font-semibold uppercase tracking-wider ${className ?? ""}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {seasons.map((s) => (
          <SelectItem key={s.id} value={s.id} className="text-sm">
            {s.name}
            {s.is_active && <span className="ml-2 text-[10px] uppercase tracking-wider text-primary">Aktiv</span>}
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem value={NEW_SEASON} className="text-sm text-muted-foreground">
          Ny sæson…
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
