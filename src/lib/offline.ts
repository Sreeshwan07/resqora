import { supabase } from "@/integrations/supabase/client";

const EMERGENCY_KEY = "aegis.offline.emergency";
const PINGS_KEY = "aegis.offline.pings";

export type QueuedEmergency = {
  userId: string;
  type: string;
  severity: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  startedAt: string;
};

export type QueuedPing = {
  userId: string;
  emergencyId: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  createdAt: string;
};

export function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function queueEmergency(entry: QueuedEmergency) {
  write(EMERGENCY_KEY, [...read<QueuedEmergency>(EMERGENCY_KEY), entry]);
}

export function queuePing(entry: QueuedPing) {
  write(PINGS_KEY, [...read<QueuedPing>(PINGS_KEY), entry]);
}

export function pendingCount() {
  return read<QueuedEmergency>(EMERGENCY_KEY).length + read<QueuedPing>(PINGS_KEY).length;
}

/** Pushes everything captured while offline to the backend. Safe to call often. */
export async function syncOfflineQueue() {
  if (isOffline()) return 0;
  let synced = 0;

  const emergencies = read<QueuedEmergency>(EMERGENCY_KEY);
  const remainingEmergencies: QueuedEmergency[] = [];
  for (const item of emergencies) {
    const { data, error } = await supabase
      .from("emergencies")
      .insert({
        user_id: item.userId,
        type: item.type,
        severity: item.severity,
        status: "active",
        notes: item.notes,
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address,
        started_at: item.startedAt,
      })
      .select("id")
      .single();
    if (error || !data) {
      remainingEmergencies.push(item);
      continue;
    }
    await supabase.from("emergency_events").insert({
      emergency_id: data.id,
      user_id: item.userId,
      label: "Offline SOS synced",
      detail: "This alert was captured without connectivity and uploaded once back online.",
    });
    synced += 1;
  }
  write(EMERGENCY_KEY, remainingEmergencies);

  const pings = read<QueuedPing>(PINGS_KEY);
  if (pings.length > 0) {
    const { error } = await supabase.from("location_pings").insert(
      pings.map((ping) => ({
        emergency_id: ping.emergencyId,
        user_id: ping.userId,
        latitude: ping.latitude,
        longitude: ping.longitude,
        accuracy: ping.accuracy,
        created_at: ping.createdAt,
      })),
    );
    if (!error) {
      synced += pings.length;
      write(PINGS_KEY, []);
    }
  }

  return synced;
}
