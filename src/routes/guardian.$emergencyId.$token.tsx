import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BatteryMedium,
  Clock,
  Copy,
  Gauge,
  Link2,
  MapPin,
  Navigation,
  PhoneCall,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { GuardianServices } from "@/components/guardian/guardian-services";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { copyText, mapsDirectionsLink, mapsEmbedUrl, mapsLink } from "@/lib/alerts";
import { haversineKm } from "@/lib/geo";
import type { NearbyPlace, PlaceCategory } from "@/lib/nearby.server";
import { formatDuration } from "@/lib/emergency";

export const Route = createFileRoute("/guardian/$emergencyId/$token")({
  head: () => ({
    meta: [
      { title: "Guardian dashboard — AEGIS emergency" },
      {
        name: "description",
        content:
          "Secure AEGIS Guardian command centre: live location, movement trail, nearest emergency services and a live incident timeline.",
      },
      { property: "og:title", content: "AEGIS Guardian dashboard" },
      {
        property: "og:description",
        content: "Live emergency command centre for the nominated Guardian.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GuardianDashboard,
});

type TrackPoint = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  battery_level: number | null;
  created_at: string;
};

type GuardianView = {
  guardian_name: string;
  full_name: string;
  avatar_url: string | null;
  user_phone: string | null;
  blood_group: string | null;
  emergency_id: string;
  reference: string;
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
  duration_seconds: number | null;
  location_updated_at: string | null;
  expires_at: string | null;
  timeline: { label: string; detail: string | null; created_at: string }[];
  track: TrackPoint[];
};

/** 🟢 Safe · 🟡 Monitoring · 🟠 Emergency active · 🔵 Assistance on the way · ✅ Resolved */
function statusView(view: GuardianView) {
  if (view.status === "resolved" || view.status === "cancelled" || view.live_status === "safe") {
    return { emoji: "✅", label: "Emergency resolved", tone: "bg-emerald-500/15 text-emerald-700" };
  }
  if (view.live_status === "assistance_en_route" || view.status === "en_route") {
    return { emoji: "🔵", label: "Assistance on the way", tone: "bg-sky-500/15 text-sky-700" };
  }
  if (view.status === "active" || view.status === "contacts_notified") {
    return { emoji: "🟠", label: "Emergency active", tone: "bg-orange-500/15 text-orange-700" };
  }
  if (view.status === "created" || view.status === "locating" || view.status === "ai_analysis") {
    return { emoji: "🟡", label: "Monitoring", tone: "bg-amber-500/15 text-amber-700" };
  }
  return { emoji: "🟢", label: "Safe", tone: "bg-emerald-500/15 text-emerald-700" };
}

function GuardianDashboard() {
  const { emergencyId, token } = Route.useParams();
  const [nearest, setNearest] = useState<Partial<Record<PlaceCategory, NearbyPlace>>>({});
  const [online, setOnline] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const view = useQuery({
    queryKey: ["guardian-view", emergencyId, token],
    refetchInterval: 10_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_guardian_view", {
        _emergency_id: emergencyId,
        _token: token,
      });
      if (error) throw new Error(error.message);
      return (data as unknown as GuardianView | null) ?? null;
    },
  });

  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.clearInterval(tick);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const data = view.data ?? null;
  const coords = data?.latitude != null && data.longitude != null
    ? { lat: data.latitude, lng: data.longitude }
    : null;

  const telemetry = useMemo(() => {
    if (!data || data.track.length === 0) return { speedKmh: null as number | null, battery: null as number | null };
    const [latest, previous] = data.track;
    let speedKmh: number | null =
      latest.speed != null ? Math.max(0, Math.round(latest.speed * 3.6)) : null;
    if (speedKmh == null && previous) {
      const km = haversineKm(
        { lat: latest.latitude, lng: latest.longitude },
        { lat: previous.latitude, lng: previous.longitude },
      );
      const hours =
        (new Date(latest.created_at).getTime() - new Date(previous.created_at).getTime()) / 3_600_000;
      if (hours > 0) speedKmh = Math.round(km / hours);
    }
    return { speedKmh, battery: latest.battery_level };
  }, [data]);

  const trackingLink = typeof window === "undefined" ? "" : window.location.href;

  if (view.isLoading) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 p-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <Logo />
        <h1 className="font-display text-2xl font-bold">Guardian link expired</h1>
        <p className="text-sm text-muted-foreground">
          This Guardian dashboard is no longer available. Emergency links expire automatically once
          the emergency ends, and each link works for a single emergency only.
        </p>
      </main>
    );
  }

  const status = statusView(data);
  const elapsed = data.resolved_at
    ? (data.duration_seconds ?? 0)
    : Math.max(0, Math.round((now - new Date(data.started_at).getTime()) / 1000));
  const lastUpdate = data.location_updated_at ?? data.track[0]?.created_at ?? null;
  const details = [
    `AEGIS emergency ${data.reference}`,
    `User: ${data.full_name}`,
    `Status: ${status.label}`,
    `Type: ${data.type} (${data.severity})`,
    `Address: ${data.address ?? "unavailable"}`,
    coords ? `GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "GPS: pending",
    coords ? `Map: ${mapsLink(coords)}` : "",
    `Started: ${new Date(data.started_at).toLocaleString()}`,
    `Guardian dashboard: ${trackingLink}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <main className="aurora min-h-screen">
      <div className="mx-auto max-w-6xl space-y-4 p-4 pb-16 sm:p-6">
        <header className="glass-panel flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Guardian command centre
              </p>
              <p className="text-sm font-semibold">Hello {data.guardian_name}</p>
            </div>
          </div>
          <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>
            <span aria-hidden="true" className="mr-1">
              {status.emoji}
            </span>
            {status.label}
          </Badge>
        </header>

        <section className="glass-panel rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-4">
            {data.avatar_url ? (
              <img
                src={data.avatar_url}
                alt={`${data.full_name} profile photo`}
                className="size-16 rounded-2xl object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 font-display text-xl font-bold">
                {data.full_name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold">{data.full_name}</h1>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden="true" />
                {data.address ?? "Resolving address…"}
              </p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {coords
                  ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
                  : "Awaiting first GPS fix"}
                {data.blood_group ? ` · Blood group ${data.blood_group}` : ""}
              </p>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Metric icon={Clock} label="Started" value={new Date(data.started_at).toLocaleTimeString()} />
            <Metric icon={Activity} label="Duration" value={formatDuration(elapsed)} />
            <Metric
              icon={MapPin}
              label="Last update"
              value={lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : "—"}
            />
            <Metric
              icon={Gauge}
              label="Speed"
              value={telemetry.speedKmh != null ? `${telemetry.speedKmh} km/h` : "—"}
            />
            <Metric
              icon={telemetry.battery != null ? BatteryMedium : online ? Wifi : WifiOff}
              label={telemetry.battery != null ? "Battery" : "Connection"}
              value={
                telemetry.battery != null
                  ? `${telemetry.battery}%`
                  : online
                    ? "Online"
                    : "Offline"
              }
            />
          </dl>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <section className="glass-panel overflow-hidden rounded-2xl">
              <div className="flex items-center justify-between p-4 pb-3">
                <h2 className="font-display text-lg font-bold">Live location</h2>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="pulse-ring size-2 rounded-full bg-primary" aria-hidden="true" />
                  Refreshing every 10s
                </span>
              </div>
              {coords ? (
                <iframe
                  title={`Live location of ${data.full_name}`}
                  src={mapsEmbedUrl(coords)}
                  className="h-72 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <p className="p-4 text-sm text-muted-foreground">Waiting for the first GPS fix.</p>
              )}
              {data.track.length > 1 && (
                <ol className="max-h-40 space-y-1 overflow-y-auto p-4 text-xs text-muted-foreground">
                  {data.track.slice(0, 12).map((point, index) => (
                    <li key={`${point.created_at}-${index}`} className="flex justify-between gap-3">
                      <span className="font-mono">
                        {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                      </span>
                      <span>{new Date(point.created_at).toLocaleTimeString()}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="glass-panel rounded-2xl p-4">
              <h2 className="font-display text-lg font-bold">Quick actions</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {data.user_phone && (
                  <Button asChild variant="emergency">
                    <a href={`tel:${data.user_phone}`}>
                      <PhoneCall className="size-4" />
                      Call {data.full_name.split(" ")[0]}
                    </a>
                  </Button>
                )}
                {coords && (
                  <Button asChild variant="outline">
                    <a
                      href={mapsDirectionsLink(`${coords.lat},${coords.lng}`)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Navigation className="size-4" />
                      Navigate to user
                    </a>
                  </Button>
                )}
                <ServiceCall label="Call nearest hospital" place={nearest.hospital} />
                <ServiceCall label="Call nearest police" place={nearest.police} />
                <ServiceCall label="Call nearest fire station" place={nearest.fire} />
                {coords && (
                  <Button asChild variant="outline">
                    <a
                      href={`https://www.google.com/maps/search/blood+bank/@${coords.lat},${coords.lng},13z`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      🩸 Nearby blood banks
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={async () => {
                    await copyText(details);
                    toast.success("Emergency details copied");
                  }}
                >
                  <Copy className="size-4" />
                  Copy emergency details
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await copyText(trackingLink);
                    toast.success("Live tracking link copied");
                  }}
                >
                  <Link2 className="size-4" />
                  Copy tracking link
                </Button>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="glass-panel rounded-2xl p-4">
              <h2 className="font-display text-lg font-bold">Nearest emergency services</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Live results around {data.full_name.split(" ")[0]}’s current position.
              </p>
              <GuardianServices
                lat={data.latitude}
                lng={data.longitude}
                onNearest={setNearest}
              />
            </section>

            <section className="glass-panel rounded-2xl p-4">
              <h2 className="font-display text-lg font-bold">Emergency timeline</h2>
              <ol className="mt-3 space-y-3">
                {data.timeline.length === 0 && (
                  <li className="text-sm text-muted-foreground">Awaiting the first event.</li>
                )}
                {data.timeline.map((event) => (
                  <li key={`${event.label}-${event.created_at}`} className="flex gap-3">
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{event.label}</p>
                      {event.detail && (
                        <p className="text-xs text-muted-foreground">{event.detail}</p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(event.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <footer className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Emergency-only view · Reference {data.reference} · link expires when the emergency ends
        </footer>
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-card/70 p-3">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function ServiceCall({ label, place }: { label: string; place?: NearbyPlace }) {
  if (!place?.phone) return null;
  return (
    <Button asChild variant="outline">
      <a href={`tel:${place.phone}`}>
        <PhoneCall className="size-4" />
        {label}
      </a>
    </Button>
  );
}