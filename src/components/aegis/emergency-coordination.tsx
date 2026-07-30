import { motion } from "motion/react";
import { PhoneCall, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServiceRow, nearestFor } from "@/components/aegis/nearest-services";
import { AMBULANCE_CONTACT, coordinationCategories, ROLE_LABEL } from "@/lib/coordination";
import type { LivePosition } from "@/hooks/use-live-position";

/**
 * Single coordination panel: picks the services that matter for this emergency
 * type and severity, so the user never has to search during an incident.
 */
export function EmergencyCoordination({
  type,
  severity,
  position,
  status,
}: {
  type: string;
  severity?: string | null;
  position: LivePosition | null;
  status?: string;
}) {
  const origin = position ? { lat: position.lat, lng: position.lng } : null;
  const categories = coordinationCategories(type, severity);
  const services = nearestFor(position, categories);

  return (
    <section aria-label="Emergency coordination" className="glass-panel rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Radio className="size-4 text-primary" aria-hidden="true" />
          Emergency coordination
        </h2>
        <Badge variant="secondary" className="rounded-full text-[10px] font-semibold uppercase">
          {status ?? "Coordinating"}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Automatically selected for a {type.replace(/_/g, " ")} emergency
        {severity ? ` · ${severity} severity` : ""}.
      </p>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {services.map((service, index) => (
          <motion.li
            key={service.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
          >
            <ServiceRow service={service} origin={origin} label={ROLE_LABEL[service.category]} />
          </motion.li>
        ))}
        <li className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-alert/10 text-alert"
          >
            <PhoneCall className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Ambulance / emergency line
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              {AMBULANCE_CONTACT.name}
            </p>
            <p className="text-xs text-muted-foreground">{AMBULANCE_CONTACT.phone}</p>
          </div>
          <Button asChild size="icon" variant="emergency" aria-label="Call ambulance">
            <a href={`tel:${AMBULANCE_CONTACT.phone.replace(/\s/g, "")}`}>
              <PhoneCall className="size-4" />
            </a>
          </Button>
        </li>
      </ul>
    </section>
  );
}