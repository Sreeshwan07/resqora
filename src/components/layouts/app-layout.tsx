import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { AppTopbar } from "@/components/layouts/app-topbar";
import { MobileNav } from "@/components/layouts/mobile-nav";
import { GlobalSosButton } from "@/components/resqora/global-sos";
import { LiveEmergencyWidget } from "@/components/resqora/live-emergency-widget";
import { LiveLocationCard } from "@/components/resqora/live-location-card";
import { useLivePosition } from "@/hooks/use-live-position";
import { useAuth } from "@/hooks/use-auth";
import { useSosTheme } from "@/hooks/use-sos-theme";
import { contactsQuery, profileQuery } from "@/lib/api";
import { saveOfflineSnapshot } from "@/lib/offline-cache";
import { ensureNotificationPermission } from "@/lib/emergency-notifications";

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { position, address, denied } = useLivePosition();
  useSosTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const profile = useQuery(profileQuery(user?.id));
  const contacts = useQuery(contactsQuery(user?.id));
  // /live renders its own detailed live-location panel — avoid showing it twice.
  const showLocationCard = !pathname.startsWith("/live");

  // Ask for notification permission once, then keep an offline copy of the
  // medical ID + trusted contacts so they work with no connectivity.
  useEffect(() => {
    void ensureNotificationPermission();
  }, []);

  useEffect(() => {
    if (!profile.data && !contacts.data) return;
    saveOfflineSnapshot(profile.data, contacts.data ?? []);
  }, [profile.data, contacts.data]);

  return (
    <div className="flex min-h-dvh w-full bg-background aurora">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mx-auto w-full max-w-6xl space-y-8"
          >
            {showLocationCard && (
              <LiveLocationCard position={position} address={address} denied={denied} />
            )}
            {children}
          </motion.div>
        </main>
      </div>
      <MobileNav />
      <GlobalSosButton />
      <LiveEmergencyWidget />
    </div>
  );
}