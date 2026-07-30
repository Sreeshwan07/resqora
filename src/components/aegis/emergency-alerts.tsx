import { useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, MapPin, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/system/empty-state";
import {
  alertChannels,
  buildAlertMessage,
  coordsOf,
  copyText,
  mapsLink,
  shareText,
} from "@/lib/alerts";
import type { Emergency, EmergencyContact, Profile } from "@/lib/api";

/**
 * Emergency notification centre. Delivery is simulated for now; the generated
 * payload is provider-agnostic so SMS, WhatsApp and email adapters can send the
 * exact same message body.
 */
export function EmergencyAlerts({
  emergency,
  profile,
  contacts,
}: {
  emergency: Emergency;
  profile: Profile | null | undefined;
  contacts: EmergencyContact[];
}) {
  const [expanded, setExpanded] = useState<string | null>(contacts[0]?.id ?? null);
  const coords = coordsOf(emergency);

  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title="No trusted contacts yet"
        description="Add three emergency contacts in your profile so AEGIS can alert them instantly."
      />
    );
  }

  async function handleCopy(value: string, label: string) {
    await copyText(value);
    toast.success(`${label} copied`);
  }

  return (
    <ul className="space-y-3">
      {contacts.map((contact, index) => {
        const message = buildAlertMessage({ contact, profile, emergency });
        const open = expanded === contact.id;
        return (
          <motion.li
            key={contact.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="rounded-2xl border border-border bg-card/60 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{contact.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {contact.relationship} · {contact.phone}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {alertChannels.map((channel) => (
                  <Badge
                    key={channel.id}
                    variant="secondary"
                    className="gap-1 rounded-full text-[10px] font-semibold"
                  >
                    <Check className="size-3" aria-hidden="true" />
                    {channel.label}
                  </Badge>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setExpanded(open ? null : contact.id)}
              aria-expanded={open}
              className="mt-3 text-xs font-medium text-primary hover:underline"
            >
              {open ? "Hide message" : "Show delivered message"}
            </button>

            {open && (
              <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs leading-relaxed text-foreground">
                {message}
              </pre>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => handleCopy(message, "Message")}>
                <Copy className="size-4" />
                Copy message
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!coords}
                onClick={() => coords && handleCopy(mapsLink(coords), "Location")}
              >
                <MapPin className="size-4" />
                Copy location
              </Button>
              <Button
                size="sm"
                variant="hero"
                onClick={async () => {
                  const shared = await shareText("AEGIS emergency alert", message);
                  toast.success(shared ? "Alert shared" : "Alert copied to clipboard");
                }}
              >
                <Share2 className="size-4" />
                Share
              </Button>
            </div>
          </motion.li>
        );
      })}
    </ul>
  );
}