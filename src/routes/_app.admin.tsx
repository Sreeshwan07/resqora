import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Activity, Clock, MapPinned, ShieldAlert, Users } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { StatCard } from "@/components/system/stat-card";
import { StatCardSkeleton, PanelSkeleton } from "@/components/system/loading-skeletons";
import { StatusIndicator } from "@/components/system/status-indicator";
import { EmptyState } from "@/components/system/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { adminOverviewQuery, isAdminQuery } from "@/lib/api";
import { formatDuration, statusLabel } from "@/lib/emergency";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [
      { title: "Admin control centre — RESQORA" },
      {
        name: "description",
        content:
          "Platform analytics for RESQORA operators: user growth, live emergencies, response times and an incident density heatmap.",
      },
      { property: "og:title", content: "RESQORA Admin Control Centre" },
      { property: "og:description", content: "User, emergency and response analytics for operators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const admin = useQuery(isAdminQuery(user?.id));
  const overview = useQuery({ ...adminOverviewQuery(), enabled: admin.data === true });

  const stats = useMemo(() => {
    const profiles = overview.data?.profiles ?? [];
    const emergencies = overview.data?.emergencies ?? [];
    const active = emergencies.filter((e) => e.status !== "resolved" && e.status !== "cancelled");
    const resolved = emergencies.filter((e) => e.status === "resolved");
    const avg =
      resolved.length > 0
        ? Math.round(resolved.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0) / resolved.length)
        : null;

    const byType = new Map<string, number>();
    for (const item of emergencies) byType.set(item.type, (byType.get(item.type) ?? 0) + 1);
    const byCity = new Map<string, number>();
    for (const item of profiles) {
      const city = item.current_city?.trim();
      if (city) byCity.set(city, (byCity.get(city) ?? 0) + 1);
    }

    return {
      profiles,
      emergencies,
      active,
      avg,
      onboarded: profiles.filter((p) => p.onboarding_completed).length,
      types: [...byType.entries()].sort((a, b) => b[1] - a[1]),
      cities: [...byCity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }, [overview.data]);

  if (admin.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!admin.data) {
    return (
      <>
        <PageHeader
          icon={ShieldAlert}
          title="Admin control centre"
          description="Restricted to RESQORA operators."
        />
        <EmptyState
          icon={ShieldAlert}
          title="Operator access required"
          description="Your account doesn't have the admin role. Ask an RESQORA operator to grant access."
        />
      </>
    );
  }

  const maxType = Math.max(1, ...stats.types.map(([, count]) => count));

  return (
    <>
      <PageHeader
        icon={ShieldAlert}
        title="Admin control centre"
        description="Platform-wide user, emergency and response analytics."
      />

      {overview.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            label="Registered users"
            value={String(stats.profiles.length)}
            delta={`${stats.onboarded} onboarded`}
          />
          <StatCard icon={Activity} label="Total emergencies" value={String(stats.emergencies.length)} />
          <StatCard
            icon={ShieldAlert}
            label="Active right now"
            value={String(stats.active.length)}
            delta={stats.active.length > 0 ? "Live" : "Clear"}
          />
          <StatCard
            icon={Clock}
            label="Avg. resolution"
            value={stats.avg ? formatDuration(stats.avg) : "—"}
          />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground">Emergencies by type</h2>
          {stats.types.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No emergencies recorded yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {stats.types.map(([type, count]) => (
                <li key={type}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize text-foreground">{type}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxType) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPinned className="size-4 text-primary" aria-hidden="true" />
            Incident density heatmap
          </h2>
          <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:36px_36px]">
            {stats.emergencies
              .filter((e) => e.latitude != null && e.longitude != null)
              .slice(0, 40)
              .map((e, index) => (
                <motion.span
                  key={e.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "absolute size-10 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md",
                    e.status === "resolved" ? "bg-info/40" : "bg-alert/50",
                  )}
                  style={{
                    left: `${((((e.longitude as number) + 180) % 360) / 360) * 100}%`,
                    top: `${((90 - (e.latitude as number)) / 180) * 100}%`,
                  }}
                />
              ))}
            <p className="absolute bottom-3 left-4 text-xs text-muted-foreground">
              Approximate global distribution of reported incidents
            </p>
          </div>
          {stats.cities.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {stats.cities.map(([city, count]) => (
                <li
                  key={city}
                  className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  {city} · {count}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="glass-panel rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-foreground">Latest incidents</h2>
        {overview.isLoading ? (
          <div className="mt-4">
            <PanelSkeleton rows={3} />
          </div>
        ) : stats.emergencies.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">No incidents on the platform yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {[...stats.emergencies]
              .sort((a, b) => +new Date(b.started_at) - +new Date(a.started_at))
              .slice(0, 8)
              .map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/60 p-4"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold capitalize text-foreground">
                      {item.type} · severity {item.severity}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.started_at).toLocaleString()} ·{" "}
                      {item.latitude != null && item.longitude != null
                        ? `${item.latitude.toFixed(3)}, ${item.longitude.toFixed(3)}`
                        : "No GPS"}
                    </p>
                  </div>
                  <StatusIndicator
                    status={
                      item.status === "resolved"
                        ? "safe"
                        : item.status === "cancelled"
                          ? "offline"
                          : "critical"
                    }
                    label={statusLabel(item.status)}
                  />
                </li>
              ))}
          </ul>
        )}
      </section>
    </>
  );
}