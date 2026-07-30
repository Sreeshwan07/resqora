import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlarmClock, ArrowRight, Info, QrCode, Radar } from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import {
  EmergencyStatusCard,
  type LandingStatus,
} from "@/components/landing/emergency-status-card";
import { EmergencyConsole } from "@/components/landing/emergency-console";
import { NearestServicesPanel } from "@/components/landing/nearest-services-panel";
import { useLivePosition } from "@/hooks/use-live-position";
import { useAuth } from "@/hooks/use-auth";
import { activeEmergencyQuery } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AEGIS — Emergency SOS in Two Taps" },
      {
        name: "description",
        content:
          "AEGIS puts one-tap SOS, AI accident reporting and the nearest hospital, police, fire and blood bank on a single emergency-ready screen.",
      },
      { property: "og:title", content: "AEGIS — Emergency SOS in Two Taps" },
      {
        property: "og:description",
        content:
          "One-tap SOS, AI photo triage and nearest responders with call and navigate actions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuth();
  const { position, address, denied } = useLivePosition();
  const active = useQuery(activeEmergencyQuery(user?.id));
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const emergency = active.data;
  const status: LandingStatus = !emergency
    ? "safe"
    : emergency.status === "resolved"
      ? "resolved"
      : emergency.status === "active" || emergency.status === "contacts_notified"
        ? "coordinating"
        : "active";

  return (
    <div className="min-h-dvh bg-background">
      <LandingNav />
      <main className="aurora">
        <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6 sm:px-6 sm:py-10">
          <h1 className="sr-only">AEGIS — AI-Powered Emergency Intelligence Platform</h1>

          <EmergencyStatusCard
            status={status}
            now={now}
            position={position}
            address={address}
            denied={denied}
          />

          <EmergencyConsole position={position} />

          <NearestServicesPanel position={position} />

          <nav aria-label="Quick links" className="grid gap-2 sm:grid-cols-4">
            {[
              { to: "/live", label: "Live location", icon: Radar },
              { to: "/checkins", label: "Safety check-in", icon: AlarmClock },
              { to: "/profile", label: "Medical ID QR", icon: QrCode },
              { to: "/about", label: "About AEGIS", icon: Info },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="glass-panel flex items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <item.icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            ))}
          </nav>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
