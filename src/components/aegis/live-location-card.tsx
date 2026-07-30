import { MapPin, Navigation, Satellite, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mapsLink } from "@/lib/alerts";
import type { LivePosition } from "@/hooks/use-live-position";
import { cn } from "@/lib/utils";

/** Compact always-on location strip. Refreshes with the shared GPS watcher (10s). */
export function LiveLocationCard({
  position,
  address,
  denied,
  className,
}: {
  position: LivePosition | null;
  address: string | null;
  denied: boolean;
  className?: string;
}) {
  return (
    <section
      aria-label="Live location"
      className={cn("glass-panel rounded-2xl border border-border/60 p-4", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Current address
          </p>
          <p className="mt-0.5 flex items-start gap-1.5 text-sm font-semibold text-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 break-words">
              {denied
                ? "Location permission needed"
                : (address ?? (position ? "Resolving address…" : "Locating…"))}
            </span>
          </p>
        </div>
        {position && (
          <Button asChild size="sm" variant="outline">
            <a href={mapsLink({ lat: position.lat, lng: position.lng })} target="_blank" rel="noreferrer">
              <Navigation className="size-4" />
              Open map
            </a>
          </Button>
        )}
      </div>

      <dl className="mt-3 grid gap-3 sm:grid-cols-4">
        <Field label="Latitude" value={position ? position.lat.toFixed(6) : "—"} />
        <Field label="Longitude" value={position ? position.lng.toFixed(6) : "—"} />
        <Field
          label="GPS accuracy"
          value={position ? `±${Math.round(position.accuracy)} m` : "—"}
          icon={Satellite}
        />
        <Field
          label="Last updated"
          value={position ? position.updatedAt.toLocaleTimeString() : "—"}
          icon={Timer}
        />
      </dl>
    </section>
  );
}

function Field({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Timer;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 font-mono text-sm text-foreground">
        {Icon && <Icon className="size-3.5 shrink-0 text-primary" aria-hidden="true" />}
        {value}
      </dd>
    </div>
  );
}