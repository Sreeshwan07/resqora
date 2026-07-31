import { motion } from "motion/react";
import { Clock, MapPin, Satellite } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LivePosition } from "@/hooks/use-live-position";
import { useHydrated } from "@/hooks/use-hydrated";

export type LandingStatus = "safe" | "checkin" | "active" | "coordinating" | "resolved";

const STATUS_META: Record<LandingStatus, { label: string; dot: string; ring: string }> = {
  safe: { label: "Safe", dot: "bg-success", ring: "border-success/30 bg-success/5" },
  checkin: {
    label: "Safety check pending",
    dot: "bg-warning",
    ring: "border-warning/30 bg-warning/5",
  },
  active: { label: "Emergency active", dot: "bg-alert", ring: "border-alert/40 bg-alert/5" },
  coordinating: {
    label: "Help being coordinated",
    dot: "bg-info",
    ring: "border-info/30 bg-info/5",
  },
  resolved: {
    label: "Emergency resolved",
    dot: "bg-success",
    ring: "border-success/30 bg-success/5",
  },
};

export function EmergencyStatusCard({
  status,
  now,
  position,
  address,
  denied,
}: {
  status: LandingStatus;
  now: Date;
  position: LivePosition | null;
  address: string | null;
  denied: boolean;
}) {
  const meta = STATUS_META[status];
  // Locale time only renders after hydration so SSR markup can't mismatch.
  const hydrated = useHydrated();
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      aria-label="Live safety status"
      className={cn("glass-panel rounded-2xl border p-4", meta.ring)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className={cn("size-2.5 animate-pulse rounded-full", meta.dot)} aria-hidden="true" />
          {meta.label}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          {hydrated ? now.toLocaleTimeString() : "--:--:--"}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Current address
          </dt>
          <dd className="mt-0.5 flex items-start gap-1.5 text-sm font-medium text-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0 break-words">
              {denied
                ? "Location permission needed"
                : address ??
                  (position
                    ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`
                    : "Locating…")}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            GPS accuracy
          </dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Satellite className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
            {position ? `±${Math.round(position.accuracy)} m` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Last updated
          </dt>
          <dd className="mt-0.5 text-sm font-medium text-foreground">
            {hydrated && position ? position.updatedAt.toLocaleTimeString() : "—"}
          </dd>
        </div>
      </dl>
    </motion.section>
  );
}
