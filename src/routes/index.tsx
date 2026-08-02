import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LandingNav } from "@/components/landing/landing-nav";
import { SiteFooter } from "@/components/landing/site-footer";
import {
  EmergencyStatusCard,
  type LandingStatus,
} from "@/components/landing/emergency-status-card";
import { EmergencyConsole } from "@/components/landing/emergency-console";
import { EmergencyContactsCard } from "@/components/landing/emergency-contacts-card";
import { NearestServices } from "@/components/resqora/nearest-services";
import { RecentActivityCard } from "@/components/resqora/recent-activity-card";
import { useLivePosition } from "@/hooks/use-live-position";
import { useNearbyServices } from "@/hooks/use-nearby-services";
import { useAuth } from "@/hooks/use-auth";
import { useSosTheme } from "@/hooks/use-sos-theme";
import { activeEmergencyQuery } from "@/lib/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RESQORA — Emergency SOS in Two Taps" },
      {
        name: "description",
        content:
          "RESQORA puts one-tap SOS, AI accident reporting and the nearest hospital, police, fire and blood bank on a single emergency-ready screen.",
      },
      { property: "og:title", content: "RESQORA — Emergency SOS in Two Taps" },
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
  useSosTheme();
  const { position, address, denied } = useLivePosition();
  const active = useQuery(activeEmergencyQuery(user?.id));
  const emergencyId = active.data && active.data.status !== "resolved" ? active.data.id : null;
  const nearby = useNearbyServices(position, { sessionKey: emergencyId });
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
        <div className="mx-auto w-full max-w-4xl space-y-3 px-4 py-4 sm:space-y-4 sm:px-6 sm:py-8">
          <h1 className="sr-only">RESQORA — Every Second Matters. Every Life Connected.</h1>

          <EmergencyStatusCard
            status={status}
            now={now}
            position={position}
            address={address}
            denied={denied}
          />

          <EmergencyConsole />

          <NearestServices position={position} nearby={nearby} />

          <EmergencyContactsCard
            notified={Boolean(emergency && emergency.status !== "created")}
          />

          <RecentActivityCard />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
