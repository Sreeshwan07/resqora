import { useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Siren } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ConfirmModal } from "@/components/system/confirm-modal";
import { useAuth } from "@/hooks/use-auth";
import { activeEmergencyQuery } from "@/lib/api";

/**
 * Persistent one-tap SOS. Reuses the existing emergency workflow via
 * /emergency?auto=true (GPS capture, session creation, contact alerts, then
 * redirect to the live status page).
 */
export function GlobalSosButton() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = useQuery(activeEmergencyQuery(user?.id));
  const [confirm, setConfirm] = useState(false);

  const running = Boolean(active.data);

  async function go() {
    if (running) {
      await navigate({ to: "/live" });
      return;
    }
    await navigate({ to: "/emergency", search: { auto: true } });
  }

  if (pathname === "/emergency") return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center lg:inset-x-auto lg:bottom-8 lg:right-8 lg:justify-end">
        <div className="relative pointer-events-auto">
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full bg-alert/30"
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => (running ? void go() : setConfirm(true))}
            aria-label={running ? "Open live emergency status" : "Trigger emergency SOS"}
            className="relative grid size-16 place-items-center rounded-full bg-linear-to-br from-alert to-alert/80 text-alert-foreground shadow-2xl shadow-alert/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-alert/40 lg:size-20"
          >
            <span className="flex flex-col items-center leading-none">
              <Siren className="size-5 lg:size-6" aria-hidden="true" />
              <span className="mt-1 font-display text-xs font-bold tracking-wide">
                {running ? "LIVE" : "SOS"}
              </span>
            </span>
          </motion.button>
        </div>
      </div>

      <ConfirmModal
        open={confirm}
        onOpenChange={setConfirm}
        title="Send emergency SOS now?"
        description="AEGIS will capture your GPS location, start live tracking and alert your three trusted contacts immediately."
        confirmLabel="Send SOS"
        onConfirm={async () => {
          setConfirm(false);
          await go();
        }}
      />
    </>
  );
}