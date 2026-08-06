import type { EmergencyContact, Profile } from "@/lib/api";

/** Offline snapshot of the details a responder needs when there is no network. */
export type OfflineSnapshot = {
  savedAt: string;
  profile: Pick<
    Profile,
    | "full_name"
    | "date_of_birth"
    | "blood_group"
    | "allergies"
    | "medical_conditions"
    | "medications"
    | "phone"
    | "home_address"
  > | null;
  contacts: { name: string; relationship: string; phone: string; email: string | null }[];
};

const KEY = "aegis.offline.snapshot";

export function saveOfflineSnapshot(
  profile: Profile | null | undefined,
  contacts: EmergencyContact[],
) {
  if (typeof window === "undefined") return;
  const snapshot: OfflineSnapshot = {
    savedAt: new Date().toISOString(),
    profile: profile
      ? {
          full_name: profile.full_name,
          date_of_birth: profile.date_of_birth,
          blood_group: profile.blood_group,
          allergies: profile.allergies,
          medical_conditions: profile.medical_conditions,
          medications: profile.medications,
          phone: profile.phone,
          home_address: profile.home_address,
        }
      : null,
    contacts: contacts.map((c) => ({
      name: c.name,
      relationship: c.relationship,
      phone: c.phone,
      email: c.email ?? null,
    })),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(snapshot));
  } catch {
    /* storage full or blocked — offline copy is best-effort */
  }
}

export function readOfflineSnapshot(): OfflineSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OfflineSnapshot) : null;
  } catch {
    return null;
  }
}
