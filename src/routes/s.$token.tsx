import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MapPin, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MapPreview } from "@/components/aegis/map-preview";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { mapsLink } from "@/lib/alerts";

export const Route = createFileRoute("/s/$token")({
  head: () => ({
    meta: [
      { title: "Live emergency location — AEGIS" },
      {
        name: "description",
        content:
          "Follow a shared AEGIS emergency in real time. This secure link shows the person's latest GPS position and status.",
      },
      { property: "og:title", content: "Live emergency location — AEGIS" },
      { property: "og:description", content: "A secure AEGIS link with a live emergency position." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SharedLocationPage,
});

type SharedLocation = {
  full_name: string;
  type: string;
  severity: string;
  status: string;
  live_status: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  notes: string | null;
  started_at: string;
  resolved_at: string | null;
  location_updated_at: string | null;
  reference: string;
};

const LIVE_LABELS: Record<string, string> = {
  need_help: "Needs immediate help",
  help_arrived: "Help has arrived",
  safe: "Marked safe",
};

function SharedLocationPage() {
  const { token } = Route.useParams();
  const shared = useQuery({
    queryKey: ["shared-location", token],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_shared_location", { _token: token });
      if (error) throw new Error(error.message);
      return (data as unknown as SharedLocation | null) ?? null;
    },
  });

  // Movement history for the same token-gated session.
  const track = useQuery({
    queryKey: ["shared-track", token],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_shared_track", { _token: token });
      if (error) throw new Error(error.message);
      return (data ?? []) as {
        latitude: number;
        longitude: number;
        accuracy: number | null;
        created_at: string;
      }[];
    },
  });

  const info = shared.data;
  const coords =
    info && info.latitude != null && info.longitude != null
      ? { lat: info.latitude, lng: info.longitude }
      : null;

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-3xl space-y-5">
        <Logo />
        {shared.isLoading ? (
          <div className="glass-panel h-72 animate-pulse rounded-3xl" />
        ) : !info ? (
          <div className="glass-panel grid place-items-center rounded-3xl p-10 text-center">
            <ShieldAlert className="size-10 text-muted-foreground" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">This link is no longer active</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The person has stopped sharing their location, or the link has expired.
            </p>
          </div>
        ) : (
          <div className="glass-panel overflow-hidden rounded-3xl">
            <div className="border-b border-border p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-alert">
                Live emergency · {info.reference}
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
                {info.full_name} — {LIVE_LABELS[info.live_status] ?? "Emergency active"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {info.type} emergency · started {new Date(info.started_at).toLocaleString()}
              </p>
            </div>
            <MapPreview coords={coords} title="Shared emergency location" />
            <div className="grid gap-4 border-t border-border p-5 sm:grid-cols-2">
              <Field label="Latitude" value={coords ? coords.lat.toFixed(6) : "Awaiting GPS"} />
              <Field label="Longitude" value={coords ? coords.lng.toFixed(6) : "Awaiting GPS"} />
              <Field label="Address" value={info.address || "Not provided"} />
              <Field
                label="Location updated"
                value={
                  info.location_updated_at
                    ? new Date(info.location_updated_at).toLocaleTimeString()
                    : "Waiting for first fix"
                }
              />
              {info.notes && <Field label="Notes" value={info.notes} />}
              {info.resolved_at && (
                <Field label="Resolved" value={new Date(info.resolved_at).toLocaleString()} />
              )}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border p-5">
              {(track.data ?? []).length > 0 && (
                <div className="w-full">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Movement history
                  </p>
                  <ul className="mt-2 max-h-44 space-y-1 overflow-auto">
                    {(track.data ?? []).map((ping) => (
                      <li
                        key={ping.created_at}
                        className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-3 py-1.5 text-xs"
                      >
                        <span className="font-mono text-foreground">
                          {ping.latitude.toFixed(5)}, {ping.longitude.toFixed(5)}
                        </span>
                        <span className="text-muted-foreground">
                          {new Date(ping.created_at).toLocaleTimeString()}
                          {ping.accuracy ? ` · ±${Math.round(ping.accuracy)}m` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button asChild variant="hero" disabled={!coords}>
                {coords ? (
                  <a href={mapsLink(coords)} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    Open in Google Maps
                  </a>
                ) : (
                  <span>
                    <MapPin className="size-4" />
                    Waiting for GPS
                  </span>
                )}
              </Button>
              <p className="self-center text-xs text-muted-foreground">
                This page refreshes automatically every 10 seconds.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
