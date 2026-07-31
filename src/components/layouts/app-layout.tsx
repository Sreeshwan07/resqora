import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useRouterState } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layouts/app-sidebar";
import { AppTopbar } from "@/components/layouts/app-topbar";
import { MobileNav } from "@/components/layouts/mobile-nav";
import { GlobalSosButton } from "@/components/aegis/global-sos";
import { LiveLocationCard } from "@/components/aegis/live-location-card";
import { useLivePosition } from "@/hooks/use-live-position";

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { position, address, denied } = useLivePosition();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // /live renders its own detailed live-location panel — avoid showing it twice.
  const showLocationCard = !pathname.startsWith("/live");

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
    </div>
  );
}