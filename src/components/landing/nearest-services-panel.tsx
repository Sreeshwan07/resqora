import { motion } from "motion/react";
import { Navigation, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mapsDirectionsLink } from "@/lib/alerts";
import { PANEL_CATEGORIES, PANEL_LABEL, nearestOf } from "@/lib/coordination";
import type { LivePosition } from "@/hooks/use-live-position";

const ICONS: Record<string, string> = {
  hospital: "🏥",
  police: "🚓",
  fire: "🚒",
  blood_bank: "🩸",
};

export function NearestServicesPanel({ position }: { position: LivePosition | null }) {
  const coords = position ? { lat: position.lat, lng: position.lng } : null;
  const entries = PANEL_CATEGORIES.map((category) => ({
    category,
    service: nearestOf(category),
  })).filter((entry) => entry.service);

  return (
    <section aria-label="Nearest emergency services" className="glass-panel rounded-3xl p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Nearest emergency services</h2>
        <p className="text-[11px] text-muted-foreground">
          {position ? `Updated ${position.updatedAt.toLocaleTimeString()}` : "Awaiting GPS"}
        </p>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {entries.map((entry, index) => (
          <motion.li
            key={entry.category}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3"
          >
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-base">
              {ICONS[entry.category]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {PANEL_LABEL[entry.category]}
              </p>
              <p className="truncate text-sm font-semibold text-foreground">{entry.service.name}</p>
              <p className="text-xs text-muted-foreground">
                {entry.service.distanceKm} km · {entry.service.etaMinutes} min
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Button asChild size="icon" variant="emergency" aria-label={`Call ${entry.service.name}`}>
                <a href={`tel:${entry.service.phone.replace(/\s/g, "")}`}>
                  <PhoneCall className="size-4" />
                </a>
              </Button>
              <Button asChild size="icon" variant="outline" aria-label={`Navigate to ${entry.service.name}`}>
                <a
                  href={mapsDirectionsLink(`${entry.service.name} ${entry.service.address}`, coords)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Navigation className="size-4" />
                </a>
              </Button>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
