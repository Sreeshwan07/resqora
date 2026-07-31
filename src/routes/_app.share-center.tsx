import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/system/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode } from "@/components/aegis/qr-code";
import { QuickCallPanel } from "@/components/aegis/quick-call-panel";
import { EmptyState } from "@/components/system/empty-state";
import { useAuth } from "@/hooks/use-auth";
import { useLivePosition } from "@/hooks/use-live-position";
import { useNearbyServices } from "@/hooks/use-nearby-services";
import { activeEmergencyQuery, contactsQuery, profileQuery } from "@/lib/api";
import { copyText, coordsOf, mapsLink } from "@/lib/alerts";
import { deliveriesQuery } from "@/lib/alert-delivery";
import { GuardianSessionPanel } from "@/components/aegis/guardian-session-panel";
import { buildEmergencyEmail, contactsWithEmail, sendEmergencyEmailAlerts } from "@/lib/email-alerts";
import { logActivity } from "@/lib/activity";
import { recentSharesQuery } from "@/lib/shares";
import {
  buildSosMessage,
  emailHref,
  ensureLiveShareLink,
  ensureMedicalShareLink,
  shareUrl,
  whatsappHref,
} from "@/lib/share";

export const Route = createFileRoute("/_app/share-center")({
  head: () => ({
    meta: [
      { title: "Emergency share centre — AEGIS" },
      {
        name: "description",
        content:
          "Send emergency emails, share on WhatsApp, copy the secure live tracking link and hand out QR codes for your medical ID — all from one screen.",
      },
      { property: "og:title", content: "Emergency share centre — AEGIS" },
      {
        property: "og:description",
        content: "Email alerts, WhatsApp share, tracking link and QR codes in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShareCenterPage,
});

function ShareCenterPage() {
  const { user } = useAuth();
  const profile = useQuery(profileQuery(user?.id));
  const contacts = useQuery(contactsQuery(user?.id));
  const active = useQuery(activeEmergencyQuery(user?.id));
  const deliveries = useQuery(deliveriesQuery(active.data?.id));
  const shares = useQuery(recentSharesQuery(user?.id));
  const { position } = useLivePosition();
  const nearby = useNearbyServices(position);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [medicalUrl, setMedicalUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const emergency = active.data ?? null;
  const contactList = contacts.data ?? [];
  const emailable = contactsWithEmail(contactList);
  const coords = emergency ? coordsOf(emergency) : position ? { lat: position.lat, lng: position.lng } : null;

  useEffect(() => {
    if (!user || !emergency) return;
    void ensureLiveShareLink(user.id, emergency.id)
      .then((link) => setTrackingUrl(shareUrl(link)))
      .catch(() => setTrackingUrl(null));
  }, [user?.id, emergency?.id, user, emergency]);

  useEffect(() => {
    if (!user) return;
    void ensureMedicalShareLink(user.id)
      .then((link) => setMedicalUrl(shareUrl(link)))
      .catch(() => setMedicalUrl(null));
  }, [user?.id, user]);

  const message = emergency
    ? buildSosMessage({ emergency, profile: profile.data, link: trackingUrl })
    : null;
  const emailPreview = emergency
    ? buildEmergencyEmail({
        emergency,
        profile: profile.data,
        trackingUrl,
      })
    : null;
  const emailDeliveries = (deliveries.data ?? []).filter((d) => d.channel === "email");

  async function copy(value: string, label: string) {
    await copyText(value);
    toast.success(`${label} copied`);
  }

  async function nativeShare() {
    if (!message) return;
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    const payload = { title: "AEGIS emergency alert", text: message, url: trackingUrl ?? undefined };
    if (nav.share) {
      try {
        await nav.share(payload);
        await logActivity(user?.id, "Emergency shared", "Shared through the device share sheet");
        await shares.refetch();
      } catch {
        /* the user dismissed the sheet */
      }
      return;
    }
    await copy(message, "Emergency message");
  }

  async function sendEmails() {
    if (!user || !emergency) return;
    setSending(true);
    try {
      const result = await sendEmergencyEmailAlerts({
        userId: user.id,
        emergency,
        profile: profile.data,
        contacts: contactList,
        trackingUrl,
      });
      if (result.skipped) {
        toast.error("Add an email address to your trusted contacts first");
      } else if (!result.configured) {
        toast.error("Automatic email isn't connected yet — use the mail app button below");
      } else {
        toast.success(`Emergency email sent to ${result.sent} contact(s)`);
        await logActivity(user.id, "Emergency emails sent", `${result.sent} contact(s)`);
      }
      await deliveries.refetch();
      await shares.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the emails");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        icon={Share2}
        title="Emergency share centre"
        description="Everything your contacts need — emergency email, WhatsApp share, secure tracking link and QR codes — in one place."
      />

      {!emergency ? (
        <EmptyState
          icon={ShieldAlert}
          title="No emergency is active"
          description="Trigger an SOS to unlock live sharing. Your medical ID QR code below always works."
          action={
            <Button asChild variant="hero">
              <Link to="/emergency">Open emergency SOS</Link>
            </Button>
          }
        />
      ) : (
        <section className="space-y-4">
          <GuardianSessionPanel
            emergency={emergency}
            profile={profile.data}
            contacts={contactList}
            trackingUrl={trackingUrl}
          />
          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Mail className="size-4 text-primary" aria-hidden="true" />
                Emergency email alerts
              </h2>
              <Badge variant="outline" className="rounded-full text-[10px]">
                {emailable.length} of {contactList.length} contacts have an email
              </Badge>
            </div>
            <ul className="mt-3 space-y-2">
              {emailDeliveries.length === 0 ? (
                <li className="text-xs text-muted-foreground">
                  No emails sent for this emergency yet.
                </li>
              ) : (
                emailDeliveries.map((delivery) => (
                  <li
                    key={delivery.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">
                        {delivery.contact_name}
                      </span>
                      <span className="block truncate text-muted-foreground">
                        {delivery.contact_email}
                      </span>
                    </span>
                    <span
                      className={
                        delivery.status === "delivered"
                          ? "shrink-0 font-semibold text-success"
                          : delivery.status === "failed"
                            ? "shrink-0 font-semibold text-alert"
                            : "shrink-0 font-semibold text-muted-foreground"
                      }
                    >
                      {delivery.status === "delivered"
                        ? "✓ Email sent"
                        : delivery.status === "failed"
                          ? "❌ Delivery failed"
                          : "Sending…"}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="hero" onClick={sendEmails} disabled={sending}>
                <Send className="size-4" />
                {emailDeliveries.length > 0 ? "Send again" : "Send emergency emails"}
              </Button>
              {emailPreview && (
                <Button asChild variant="outline">
                  <a href={emailHref(emailPreview.message, emailPreview.subject)}>
                    <Mail className="size-4" />
                    Open mail app
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <Button asChild variant="hero">
              <a
                href={whatsappHref(message ?? "", contactList[0]?.phone)}
                target="_blank"
                rel="noreferrer"
                onClick={() => void logActivity(user?.id, "Emergency shared", "WhatsApp quick share")}
              >
                <MessageCircle className="size-4" />
                WhatsApp share
              </a>
            </Button>
            <Button variant="outline" onClick={nativeShare}>
              <Share2 className="size-4" />
              Share anywhere
            </Button>
            <Button
              variant="outline"
              disabled={!trackingUrl}
              onClick={() => trackingUrl && copy(trackingUrl, "Tracking link")}
            >
              <Link2 className="size-4" />
              Copy tracking link
            </Button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              disabled={!message}
              onClick={() => message && copy(message, "Emergency details")}
            >
              <Copy className="size-4" />
              Copy emergency details
            </Button>
            <Button
              variant="outline"
              disabled={!coords}
              onClick={() => coords && copy(mapsLink(coords), "Location")}
            >
              <MapPin className="size-4" />
              Copy location
            </Button>
          </div>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-2">
        <QrCode
          value={trackingUrl}
          label="Live emergency tracking"
          filename="aegis-live-tracking.png"
        />
        <QrCode value={medicalUrl} label="Medical ID & profile" filename="aegis-medical-id.png" />
      </section>

      <QuickCallPanel contacts={contactList} nearby={nearby.data} />

      <section className="rounded-2xl border border-border bg-card/60 p-4">
        <h2 className="text-sm font-semibold text-foreground">Recent shares</h2>
        {(shares.data ?? []).length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Nothing shared yet — every share is logged here for your records.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {(shares.data ?? []).map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-foreground">
                  {entry.action}
                  {entry.detail ? ` — ${entry.detail}` : ""}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}