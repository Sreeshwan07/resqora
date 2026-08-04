import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ApprovalStatus } from "@/lib/access";

export type AdminUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  current_city: string | null;
  blood_group: string | null;
  created_at: string;
  approval_status: ApprovalStatus;
  approved_at: string | null;
  approved_by: string | null;
  onboarding_completed: boolean;
};

export type AdminEmergency = {
  id: string;
  user_id: string;
  type: string;
  severity: string;
  status: string;
  address: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  started_at: string;
  resolved_at: string | null;
  duration_seconds: number | null;
};

export type AdminActivity = {
  id: string;
  user_id: string;
  action: string;
  detail: string | null;
  created_at: string;
};

export type AdminMedAiLog = {
  id: string;
  user_id: string;
  title: string;
  language: string;
  urgency: string | null;
  specialist: string | null;
  created_at: string;
};

export type AdminResqrId = {
  id: string;
  user_id: string;
  active: boolean;
  regenerated_count: number;
  created_at: string;
  updated_at: string;
};

/** Every record the admin dashboard renders. Read under the admin RLS policies — never mock data. */
export const adminDataQuery = () =>
  queryOptions({
    queryKey: ["admin-data"],
    refetchInterval: 15_000,
    queryFn: async () => {
      const [users, emergencies, activity, medai, resqr] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, full_name, email, phone, avatar_url, current_city, blood_group, created_at, approval_status, approved_at, approved_by, onboarding_completed",
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("emergencies")
          .select(
            "id, user_id, type, severity, status, address, notes, latitude, longitude, started_at, resolved_at, duration_seconds",
          )
          .order("started_at", { ascending: false })
          .limit(400),
        supabase
          .from("activity_logs")
          .select("id, user_id, action, detail, created_at")
          .order("created_at", { ascending: false })
          .limit(400),
        supabase
          .from("medai_conversations")
          .select("id, user_id, title, language, urgency, specialist, created_at")
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("resqr_ids")
          .select("id, user_id, active, regenerated_count, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(300),
      ]);
      for (const result of [users, emergencies, activity, medai, resqr]) {
        if (result.error) throw new Error(result.error.message);
      }
      return {
        users: (users.data ?? []) as AdminUser[],
        emergencies: (emergencies.data ?? []) as AdminEmergency[],
        activity: (activity.data ?? []) as AdminActivity[],
        medai: (medai.data ?? []) as AdminMedAiLog[],
        resqr: (resqr.data ?? []) as AdminResqrId[],
      };
    },
  });

/**
 * Approves or rejects an account. The database trigger stamps approved_by /
 * approved_at from the verified session and rejects non-admin callers, so the
 * acting administrator can never be spoofed from the client.
 */
export async function setApprovalStatus(userId: string, status: ApprovalStatus) {
  const { error } = await supabase
    .from("profiles")
    .update({ approval_status: status })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export function isSosSession(emergency: AdminEmergency) {
  return emergency.type === "sos";
}

export function isQrScanActivity(activity: AdminActivity) {
  return /resqr|qr|scan/i.test(activity.action);
}