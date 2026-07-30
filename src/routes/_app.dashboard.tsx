import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Bell,
  Bot,
  Clock,
  Compass,
  Lightbulb,
  LayoutDashboard,
  MapPin,
  PhoneCall,
  Siren,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { StatCard } from "@/components/system/stat-card";
import { StatusIndicator } from "@/components/system/status-indicator";
import { EmptyState } from "@/components/system/empty-state";
import { StatCardSkeleton, PanelSkeleton } from "@/components/system/loading-skeletons";
import { MedicalIdCard } from "@/components/aegis/medical-id-card";
import { SafetyScoreCard } from "@/components/aegis/safety-score-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  activeEmergencyQuery,
  computeSafetyScore,
  contactsQuery,
  emergenciesQuery,
  notificationsQuery,
  profileQuery,
} from "@/lib/api";
import { formatDuration, statusLabel } from "@/lib/emergency";
import { nearbyServices } from "@/lib/nearby-services";

const QUICK_ACTIONS = [
  { to: "/emergency", label: "Trigger SOS", description: "Alert contacts & responders", icon: Siren },
  { to: "/assistant", label: "AI assistant", description: "Guided triage in a minute", icon: Bot },
  { to: "/nearby", label: "Nearby help", description: "Hospitals, police, fire", icon: Compass },
  { to: "/live", label: "Live location", description: "Share your exact position", icon: MapPin },
] as const;

const SAFETY_TIPS = [
  "Keep your phone charged above 30% — location sharing needs battery.",
  "Tell one trusted contact your route before travelling at night.",
  "Learn the recovery position; it keeps an unconscious airway open.",
  "Store your blood group and allergies in your medical ID today.",
];

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AEGIS Emergency Intelligence" },
      {
        name: "description",
        content:
          "Your AEGIS safety dashboard: medical ID, safety score, trusted contacts and recent emergency activity.",
      },
      { property: "og:title", content: "AEGIS Dashboard" },
      { property: "og:description", content: "Medical ID, safety score and emergency readiness." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const profile = useQuery(profileQuery(user?.id));
  const contacts = useQuery(contactsQuery(user?.id));
  const emergencies = useQuery(emergenciesQuery(user?.id));
  const active = useQuery(activeEmergencyQuery(user?.id));
  const notifications = useQuery(notificationsQuery(user?.id));

  const loading = profile.isLoading || contacts.isLoading;
  const score = computeSafetyScore(profile.data ?? null, contacts.data ?? []);
  const unread = (notifications.data ?? []).filter((item) => !item.read).length;
  const resolved = (emergencies.data ?? []).filter((item) => item.status === "resolved");
  const avgResponse =
    resolved.length > 0
      ? Math.round(
          resolved.reduce((sum, item) => sum + (item.duration_seconds ?? 0), 0) / resolved.length,
        )
      : null;

  const hints: string[] = [];
  if (!profile.data?.blood_group) hints.push("Add your blood group to your medical ID.");
  if ((contacts.data?.length ?? 0) < 3) hints.push("Add three trusted emergency contacts.");
  if (!profile.data?.home_address) hints.push("Add a home address as a location fallback.");

  return (
    <>
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome back${profile.data?.full_name ? `, ${profile.data.full_name.split(" ")[0]}` : ""}`}
        description="Everything AEGIS knows about keeping you safe, in one place."
        actions={
          <Button asChild variant="emergency">
            <Link to="/emergency">
              <Siren className="size-4" />
              Trigger SOS
            </Link>
          </Button>
        }
      />

      {active.data && (
        <div className="rounded-2xl border border-alert/40 bg-alert/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <StatusIndicator status="critical" label={statusLabel(active.data.status)} pulse />
              <p className="mt-2 text-sm text-foreground">
                An emergency is currently active. Responders are being kept up to date.
              </p>
            </div>
            <Button asChild variant="emergency">
              <Link to="/live">
                Track live
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => <StatCardSkeleton key={index} />)
        ) : (
          <>
            <StatCard
              icon={Users}
              label="Trusted contacts"
              value={`${contacts.data?.length ?? 0}/3`}
              delta={contacts.data?.length === 3 ? "Complete" : "Incomplete"}
            />
            <StatCard
              icon={Siren}
              label="Total emergencies"
              value={String(emergencies.data?.length ?? 0)}
            />
            <StatCard
              icon={Clock}
              label="Avg. resolution time"
              value={avgResponse ? formatDuration(avgResponse) : "—"}
            />
            <StatCard icon={Bell} label="Unread alerts" value={String(unread)} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SafetyScoreCard score={score} hints={hints} />

          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground">Quick actions</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-4 transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <action.icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {action.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                  <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/history">View all</Link>
              </Button>
            </div>
            <div className="mt-4">
              {emergencies.isLoading ? (
                <PanelSkeleton rows={2} />
              ) : (emergencies.data?.length ?? 0) === 0 ? (
                <EmptyState
                  icon={Siren}
                  title="No emergencies yet"
                  description="That's the best possible dashboard. Your history will appear here if you ever need us."
                />
              ) : (
                <ul className="space-y-3">
                  {emergencies.data!.slice(0, 4).map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-4"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-alert/10 text-alert">
                        <Siren className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium capitalize text-foreground">
                          {item.type} emergency
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.started_at).toLocaleString()}
                        </p>
                      </div>
                      <StatusIndicator
                        status={item.status === "resolved" ? "safe" : "critical"}
                        label={statusLabel(item.status)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <MedicalIdCard profile={profile.data} contacts={contacts.data ?? []} />

          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Nearby services</h2>
              <Button asChild variant="ghost" size="sm">
                <Link to="/nearby">View all</Link>
              </Button>
            </div>
            <ul className="mt-3 space-y-3">
              {[...nearbyServices]
                .sort((a, b) => a.distanceKm - b.distanceKm)
                .slice(0, 3)
                .map((service) => (
                  <li key={service.id} className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-alert/10 text-alert">
                      <MapPin className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{service.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {service.distanceKm} km · {service.etaMinutes} min away
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Lightbulb className="size-4 text-warning" aria-hidden="true" />
              Safety tips
            </h2>
            <ul className="mt-3 space-y-2.5">
              {SAFETY_TIPS.map((tip) => (
                <li key={tip} className="text-sm text-muted-foreground">
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground">Emergency contacts</h2>
            {(contacts.data?.length ?? 0) === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No contacts yet.{" "}
                <Link to="/profile" className="font-medium text-primary underline-offset-4 hover:underline">
                  Add three now
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {contacts.data!.map((contact) => (
                  <li key={contact.id} className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <PhoneCall className="size-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{contact.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {contact.relationship} · {contact.phone}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}