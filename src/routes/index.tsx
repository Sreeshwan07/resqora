import { lazy, Suspense, useEffect, useState } from "react";
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
import { EmergencyTools } from "@/components/landing/emergency-tools";
import { GuardianShortcut } from "@/components/landing/guardian-shortcut";
import { MobileNav } from "@/components/layouts/mobile-nav";
import { InstallCard } from "@/components/pwa/install-card";
import { LocationGate } from "@/components/resqora/location-gate";
import { ApprovalGate } from "@/components/system/approval-gate";
import { useLivePosition } from "@/hooks/use-live-position";
import { useNearbyServices } from "@/hooks/use-nearby-services";
import { useAuth } from "@/hooks/use-auth";
import { useAccess } from "@/hooks/use-access";
import { useSosTheme } from "@/hooks/use-sos-theme";
import { activeEmergencyQuery } from "@/lib/api";

// Emergency-critical UI (status, SOS, tools) renders first; these secondary
// sections load in a separate chunk so the first screen stays fast.
const CompactNearestServices = lazy(() =>
  import("@/components/landing/compact-nearest-services").then((m) => ({
    default: m.CompactNearestServices,
  })),
);
const RecentActivityFeed = lazy(() =>
  import("@/components/landing/recent-activity-feed").then((m) => ({
    default: m.RecentActivityFeed,
  })),
);

function SectionFallback() {
  return <div className="h-40 animate-pulse rounded-3xl border border-border bg-card" />;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RESQORA — Emergency SOS" },
      {
        name: "description",
        content:
          "RESQORA puts one-tap SOS, AI accident reporting and the nearest hospital, police, fire and blood bank on a single emergency-ready screen.",
      },
      { property: "og:title", content: "RESQORA — Emergency SOS" },
      {
        property: "og:description",
        content:
          "RESQORA puts one-tap SOS, AI accident reporting and the nearest hospital, police, fire and blood bank on a single emergency-ready screen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user } = useAuth();
  const access = useAccess();
  useSosTheme();
  const { position, address, denied, resolvingAddress } = useLivePosition();
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

  const locked = !access.loading && !access.approved;

  return (
    <div className="min-h-dvh bg-background">
      <LandingNav />
      <main>
        <div className="mx-auto w-full max-w-5xl space-y-5 px-4 pb-28 pt-5 sm:space-y-7 sm:px-6 sm:py-8 lg:pb-10">
          <h1 className="sr-only">RESQORA — Every Second Matters. Every Life Connected.</h1>

          {locked ? (
            <ApprovalGate status={access.status} />
          ) : (
            <>
              <GuardianShortcut />

              <InstallCard />

              <EmergencyStatusCard
                status={status}
                now={now}
                position={position}
                address={address}
                resolvingAddress={resolvingAddress}
                denied={denied}
              />

              <EmergencyConsole />

              <EmergencyTools />

              <Suspense fallback={<SectionFallback />}>
                <CompactNearestServices nearby={nearby} />
              </Suspense>

              {emergency && emergency.status !== "resolved" && (
                <EmergencyContactsCard notified={emergency.status !== "created"} />
              )}

              <Suspense fallback={<SectionFallback />}>
                <RecentActivityFeed />
              </Suspense>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
      {!locked && <LocationGate />}
      <MobileNav />
    </div>
  );
}
