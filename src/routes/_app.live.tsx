import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Copy, Loader2, MapPin, Radar, RefreshCcw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { StatusIndicator } from "@/components/system/status-indicator";
import { EmptyState } from "@/components/system/empty-state";
import { PanelSkeleton } from "@/components/system/loading-skeletons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  activeEmergencyQuery,
  contactsQuery,
  emergencyEventsQuery,
  getCurrentPosition,
  logEvent,
} from "@/lib/api";
import { statusLabel } from "@/lib/emergency";

export const Route = createFileRoute("/_app/live")({
  head: () => ({
    meta: [
      { title: "Live location — AEGIS" },
      {
        name: "description",
        content:
          "Follow an active AEGIS emergency in real time: live GPS coordinates, responder status and the full alert timeline.",
      },
      { property: "og:title", content: "AEGIS Live Location" },
      { property: "og:description", content: "Real-time coordinates and responder progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LiveLocationPage,
});

function LiveLocationPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const active = useQuery(activeEmergencyQuery(user?.id));
  const events = useQuery(emergencyEventsQuery(active.data?.id));
  const contacts = useQuery(contactsQuery(user?.id));

  const emergency = active.data;
  const coords =
    emergency?.latitude != null && emergency?.longitude != null
      ? { lat: emergency.latitude, lng: emergency.longitude }
      : null;

  async function refreshLocation() {
    if (!emergency || !user) return;
    try {
      const position = await getCurrentPosition();
      await supabase
        .from("emergencies")
        .update({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        .eq("id", emergency.id);
      await logEvent(
        emergency.id,
        user.id,
        "Location updated",
        `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`,
      );
      await queryClient.invalidateQueries();
      toast.success("Location refreshed");
    } catch {
      toast.error("Could not read your GPS position");
    }
  }

  function copyCoords() {
    if (!coords) return;
    void navigator.clipboard.writeText(`${coords.lat}, ${coords.lng}`);
    toast.success("Coordinates copied");
  }

  return (
    <>
      <PageHeader
        icon={Radar}
        title="Live location"
        description="Real-time coordinates shared with your contacts and assigned responders."
        actions={
          emergency ? (
            <StatusIndicator status="critical" label={statusLabel(emergency.status)} pulse />
          ) : (
            <StatusIndicator status="safe" label="No active alert" />
          )
        }
      />

      {active.isLoading ? (
        <PanelSkeleton rows={3} />
      ) : !emergency ? (
        <EmptyState
          icon={Radar}
          title="Nothing to track right now"
          description="Live coordinates appear here the moment an emergency is active."
          action={
            <Button asChild variant="hero">
              <Link to="/emergency">Open emergency console</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="glass-panel overflow-hidden rounded-3xl">
            <div className="relative grid h-72 place-items-center bg-linear-to-br from-primary/10 via-background to-alert/10 sm:h-96">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] [background-size:44px_44px]"
              />
              <div className="relative grid place-items-center">
                <motion.span
                  animate={{ scale: [1, 1.7], opacity: [0.5, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute size-24 rounded-full bg-alert/30"
                />
                <span className="relative grid size-12 place-items-center rounded-full bg-alert text-alert-foreground shadow-lg shadow-alert/40">
                  <MapPin className="size-6" aria-hidden="true" />
                </span>
              </div>
              <p className="absolute bottom-4 rounded-full bg-background/80 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                Interactive map integration placeholder
              </p>
            </div>
            <div className="grid gap-4 border-t border-border p-5 sm:grid-cols-2">
              <Detail label="Latitude" value={coords ? coords.lat.toFixed(6) : "Unavailable"} />
              <Detail label="Longitude" value={coords ? coords.lng.toFixed(6) : "Unavailable"} />
              <Detail label="Emergency type" value={emergency.type} className="capitalize" />
              <Detail label="Started" value={new Date(emergency.started_at).toLocaleTimeString()} />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-border p-5">
              <Button variant="hero" onClick={refreshLocation}>
                <RefreshCcw className="size-4" />
                Refresh GPS
              </Button>
              <Button variant="outline" onClick={copyCoords} disabled={!coords}>
                <Copy className="size-4" />
                Copy coordinates
              </Button>
              <Button variant="outline" disabled={!coords} asChild={Boolean(coords)}>
                {coords ? (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}#map=17/${coords.lat}/${coords.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Share2 className="size-4" />
                    Open in maps
                  </a>
                ) : (
                  <span>
                    <Share2 className="size-4" />
                    Open in maps
                  </span>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-panel rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground">Alert timeline</h2>
              {events.isLoading ? (
                <Loader2 className="mt-4 size-4 animate-spin text-muted-foreground" />
              ) : (
                <ol className="mt-4 space-y-4">
                  {(events.data ?? []).map((event) => (
                    <li key={event.id} className="flex gap-3">
                      <span className="mt-1.5 size-2 shrink-0 rounded-full bg-alert" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{event.label}</p>
                        {event.detail && (
                          <p className="text-xs text-muted-foreground">{event.detail}</p>
                        )}
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {new Date(event.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="glass-panel rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground">Sharing with</h2>
              <ul className="mt-3 space-y-2">
                {(contacts.data ?? []).map((contact) => (
                  <li key={contact.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-foreground">{contact.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{contact.phone}</span>
                  </li>
                ))}
                {(contacts.data?.length ?? 0) === 0 && (
                  <li className="text-sm text-muted-foreground">No contacts configured.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium text-foreground ${className ?? ""}`}>{value}</p>
    </div>
  );
}