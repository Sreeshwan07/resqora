import { motion } from "motion/react";
import { Droplets, Flame, Navigation, PhoneCall, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mapsDirectionsLink } from "@/lib/alerts";
import { locateServices, type LocatedService } from "@/lib/geo";
import type { ServiceCategory } from "@/lib/nearby-services";
import type { LivePosition } from "@/hooks/use-live-position";

const ICONS: Record<string, typeof Users> = {
  hospital: Stethoscope,
  police: ShieldCheck,
  fire: Flame,
  blood_bank: Droplets,
  pharmacy: Stethoscope,
  shelter: Users,
};

export const CATEGORY_LABEL: Record<string, string> = {
  hospital: "Nearest hospital",
  police: "Nearest police station",
  fire: "Nearest fire & rescue",
  blood_bank: "Nearest blood bank",
  pharmacy: "Nearest pharmacy",
  shelter: "Nearest rescue / shelter",
};

const DEFAULT_CATEGORIES: ServiceCategory[] = ["hospital", "police", "fire", "blood_bank"];

export function nearestFor(position: LivePosition | null, categories: ServiceCategory[]) {
  const origin = position ? { lat: position.lat, lng: position.lng } : null;
  const located = locateServices(origin);
  return categories
    .map((category) => located.find((service) => service.category === category))
    .filter((service): service is LocatedService => Boolean(service));
}

export function ServiceRow({
  service,
  origin,
  label,
}: {
  service: LocatedService;
  origin: { lat: number; lng: number } | null;
  label?: string;
}) {
  const Icon = ICONS[service.category] ?? Users;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          {label ?? CATEGORY_LABEL[service.category]}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">{service.name}</p>
        <p className="text-xs text-muted-foreground">
          {origin ? `${service.distanceKm} km · ${service.etaMinutes} min` : "Awaiting GPS"}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        <Button asChild size="icon" variant="emergency" aria-label={`Call ${service.name}`}>
          <a href={`tel:${service.phone.replace(/\s/g, "")}`}>
            <PhoneCall className="size-4" />
          </a>
        </Button>
        <Button asChild size="icon" variant="outline" aria-label={`Navigate to ${service.name}`}>
          <a
            href={
              origin
                ? mapsDirectionsLink(`${service.coords.lat},${service.coords.lng}`, origin)
                : mapsDirectionsLink(`${service.name} ${service.address}`)
            }
            target="_blank"
            rel="noreferrer"
          >
            <Navigation className="size-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

/** Nearest responders resolved from the live GPS fix; updates as the user moves. */
export function NearestServices({
  position,
  categories = DEFAULT_CATEGORIES,
  title = "Nearest emergency services",
}: {
  position: LivePosition | null;
  categories?: ServiceCategory[];
  title?: string;
}) {
  const origin = position ? { lat: position.lat, lng: position.lng } : null;
  const entries = nearestFor(position, categories);

  return (
    <section aria-label={title} className="glass-panel rounded-2xl p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-[11px] text-muted-foreground">
          {position ? `Updated ${position.updatedAt.toLocaleTimeString()}` : "Awaiting GPS"}
        </p>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {entries.map((service, index) => (
          <motion.li
            key={service.id}
            className="min-w-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
          >
            <ServiceRow service={service} origin={origin} />
          </motion.li>
        ))}
      </ul>
    </section>
  );
}