import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Emergency, EmergencyContact, Profile } from "@/lib/api";
import { deliveriesQuery } from "@/lib/alert-delivery";
import {
  buildWhatsappAlert,
  contactsWithPhone,
  markWhatsappShared,
  prepareWhatsappShares,
  whatsappShareLink,
} from "@/lib/whatsapp-alerts";

/**
 * WhatsApp cannot be sent server-side without a paid Business API, so RESQORA
 * prepares a complete message per contact and tracks which ones were shared.
 */
export function WhatsappShareStatus({
  emergency,
  profile,
  contacts,
  trackingUrl,
  address,
}: {
  emergency: Emergency;
  profile: Profile | null | undefined;
  contacts: EmergencyContact[];
  trackingUrl?: string | null;
  address?: string | null;
}) {
  const queryClient = useQueryClient();
  const deliveries = useQuery(deliveriesQuery(emergency.id));
  const [busy, setBusy] = useState(false);
  const reachable = contactsWithPhone(contacts);
  const rows = (deliveries.data ?? []).filter((row) => row.channel === "whatsapp");
  const message = buildWhatsappAlert({ emergency, profile, address, trackingUrl });

  // Make sure every contact with a phone has a prepared message row.
  useEffect(() => {
    if (reachable.length === 0 || deliveries.isLoading) return;
    if (rows.length >= reachable.length) return;
    void prepareWhatsappShares({
      userId: emergency.user_id,
      emergencyId: emergency.id,
      contacts: reachable,
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["alert-deliveries", emergency.id] }))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emergency.id, reachable.length, rows.length, deliveries.isLoading]);

  async function share(id: string, phone: string | null) {
    setBusy(true);
    try {
      window.open(whatsappShareLink(message, phone), "_blank", "noreferrer");
      await markWhatsappShared(id);
      await queryClient.invalidateQueries({ queryKey: ["alert-deliveries", emergency.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record the WhatsApp share");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <MessageCircle className="size-4 text-success" aria-hidden="true" />
          WhatsApp alerts
        </h2>
        <Badge variant="outline" className="rounded-full text-[10px]">
          {rows.filter((row) => row.status === "delivered").length} of {reachable.length} shared
        </Badge>
      </div>

      {reachable.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Add a phone number to your trusted contacts to unlock WhatsApp alerts.
        </p>
      ) : (
        <>
          <p className="mt-2 text-xs text-muted-foreground">
            WhatsApp needs your confirmation to send. Each message is fully written — tap to open
            WhatsApp and press send.
          </p>
          <ul className="mt-3 space-y-2">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">
                    {row.contact_name}
                  </span>
                  <span className="block truncate text-muted-foreground">{row.contact_phone}</span>
                </span>
                <span className="flex items-center gap-2">
                  {row.status === "delivered" ? (
                    <span className="flex items-center gap-1 font-semibold text-success">
                      <Check className="size-3" aria-hidden="true" />
                      Shared
                      {row.sent_at ? ` · ${new Date(row.sent_at).toLocaleTimeString()}` : ""}
                    </span>
                  ) : (
                    <span className="font-semibold text-muted-foreground">Ready to send</span>
                  )}
                  <Button
                    size="sm"
                    variant={row.status === "delivered" ? "outline" : "hero"}
                    disabled={busy}
                    onClick={() => share(row.id, row.contact_phone)}
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <MessageCircle className="size-4" />
                    )}
                    {row.status === "delivered" ? "Send again" : "Send"}
                  </Button>
                </span>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="text-xs text-muted-foreground">Preparing WhatsApp messages…</li>
            )}
          </ul>
          <details className="mt-3 rounded-xl border border-border p-3">
            <summary className="cursor-pointer text-xs font-medium text-primary">
              Preview the WhatsApp message
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs text-foreground">
              {message}
            </pre>
          </details>
        </>
      )}
    </div>
  );
}