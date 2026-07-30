import { Droplets, HeartPulse, Pill, TriangleAlert } from "lucide-react";
import type { Profile } from "@/lib/api";

export function MedicalIdCard({ profile }: { profile: Profile | null | undefined }) {
  const rows = [
    { icon: Droplets, label: "Blood group", value: profile?.blood_group || "Not set" },
    { icon: TriangleAlert, label: "Allergies", value: profile?.allergies || "None recorded" },
    { icon: HeartPulse, label: "Conditions", value: profile?.medical_conditions || "None recorded" },
    { icon: Pill, label: "Medications", value: profile?.medications || "None recorded" },
  ];

  return (
    <div className="glass-panel overflow-hidden rounded-2xl">
      <div className="bg-linear-to-r from-primary/12 to-alert/12 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Medical ID</p>
        <p className="mt-1 font-display text-lg font-semibold text-foreground">
          {profile?.full_name || "Unnamed profile"}
        </p>
        <p className="text-xs text-muted-foreground">
          {profile?.date_of_birth ? `DOB ${profile.date_of_birth}` : "Date of birth not set"} ·{" "}
          {profile?.phone || "No phone"}
        </p>
      </div>
      <dl className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3 px-5 py-3.5">
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-alert/10 text-alert">
              <row.icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {row.label}
              </dt>
              <dd className="text-sm text-foreground">{row.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}