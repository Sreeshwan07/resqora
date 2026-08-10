import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useLivePosition } from "@/hooks/use-live-position";
import { activeEmergencyQuery } from "@/lib/api";
import { readBatteryLevel } from "@/lib/device";
import { isOffline } from "@/lib/offline";

/** Minimum gap between two writes, so the Guardian sees a fresh fix every 10s. */
const INTERVAL_MS = 10_000;

/**
 * Keeps the emergency row and its movement trail up to date for as long as an
 * SOS is active — anywhere in the app, not only on the Live page. It reuses the
 * shared GPS watcher (no second geolocation subscription) and stops writing the
 * moment the emergency is resolved or cancelled.
 */
export function useEmergencyTracker() {
  const { user } = useAuth();
  const active = useQuery(activeEmergencyQuery(user?.id));
  const { position } = useLivePosition();
  const emergencyId = active.data?.id;
  const lastWrite = useRef(0);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!emergencyId || !user?.id || !position) return;
    if (isOffline()) return;
    if (inFlight.current) return;
    if (Date.now() - lastWrite.current < INTERVAL_MS) return;
    inFlight.current = true;
    lastWrite.current = Date.now();
    const { lat, lng, accuracy } = position;
    void (async () => {
      try {
        await supabase
          .from("emergencies")
          .update({
            latitude: lat,
            longitude: lng,
            location_updated_at: new Date().toISOString(),
          })
          .eq("id", emergencyId);
        await supabase.from("location_pings").insert({
          emergency_id: emergencyId,
          user_id: user.id,
          latitude: lat,
          longitude: lng,
          accuracy,
          battery_level: await readBatteryLevel(),
        });
      } catch {
        /* the next fix retries; never interrupt the emergency for a failed ping */
      } finally {
        inFlight.current = false;
      }
    })();
  }, [emergencyId, user?.id, position]);

  // A new emergency starts its own throttle window.
  useEffect(() => {
    lastWrite.current = 0;
  }, [emergencyId]);
}
