import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSeason } from "@/contexts/SeasonContext";
import { useAuth } from "@/contexts/AuthContext";

const NEW_SEASON = "__new_season__";

export function SeasonPicker({ className }: { className?: string }) {
  const { seasons, seasonId, setSeasonId, openNewSeasonDialog } = useSeason();
  const { user, openLoginDialog } = useAuth();

  if (!seasonId) return null;

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
