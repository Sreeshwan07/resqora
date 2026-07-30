import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Siren, PhoneCall, MessageSquare, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { StatusIndicator } from "@/components/system/status-indicator";
import { ConfirmModal } from "@/components/system/confirm-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency — AEGIS" },
      { name: "description", content: "Trigger emergency assistance and share live context." },
      { property: "og:title", content: "Emergency — AEGIS" },
      { property: "og:description", content: "One-tap emergency assistance interface preview." },
    ],
  }),
  component: EmergencyPage,
});

function EmergencyPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        icon={Siren}
        title="Emergency"
        description="Interface preview only — no alerts are sent and no responders are contacted."
        actions={<StatusIndicator status="warning" label="Demo mode" />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card className="glass-panel rounded-3xl border-0">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="pulse-ring grid size-40 place-items-center rounded-full bg-alert text-alert-foreground shadow-2xl shadow-alert/30 transition-transform duration-200 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-alert/40 active:scale-95"
              aria-label="Trigger emergency assistance demo"
            >
              <span className="flex flex-col items-center gap-2">
                <ShieldAlert className="size-12" aria-hidden="true" />
                <span className="font-display text-xl font-bold tracking-wide">SOS</span>
              </span>
            </button>
            <p className="mt-8 max-w-sm text-sm text-muted-foreground">
              Press and confirm to walk through the placeholder emergency flow.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" className="min-h-11 justify-start">
                <PhoneCall className="size-4" />
                Call responder
              </Button>
              <Button variant="outline" className="min-h-11 justify-start">
                <MessageSquare className="size-4" />
                Message circle
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base">Situation note</CardTitle>
              <Badge variant="secondary">Optional</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="situation">What is happening?</Label>
              <Textarea
                id="situation"
                rows={4}
                placeholder="Add context that would help a responder…"
                className="rounded-xl"
              />
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => toast.success("Note saved locally", { description: "Placeholder action." })}
              >
                Save note
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={open}
        onOpenChange={setOpen}
        tone="emergency"
        title="Trigger emergency demo?"
        description="This is a UI preview. No alert will be dispatched and no one will be contacted."
        confirmLabel="Trigger demo"
        onConfirm={() =>
          toast.error("Emergency demo triggered", {
            description: "Placeholder only — no responders were notified.",
          })
        }
      />
    </>
  );
}