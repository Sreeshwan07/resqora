import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { UserRound, Users, Save } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { EmptyState } from "@/components/system/empty-state";
import { StatusIndicator } from "@/components/system/status-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — AEGIS" },
      { name: "description", content: "Manage your safety identity, medical notes, and contacts." },
      { property: "og:title", content: "Profile — AEGIS" },
      { property: "og:description", content: "Your safety identity and trusted contacts." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <>
      <PageHeader
        icon={UserRound}
        title="Profile"
        description="Your safety identity. Fields are placeholders and nothing is stored."
        actions={<StatusIndicator status="active" label="Draft" />}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card className="glass-panel rounded-2xl border-0">
          <CardContent className="flex flex-col items-center py-10 text-center">
            <Avatar className="size-20">
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                AE
              </AvatarFallback>
            </Avatar>
            <p className="mt-4 font-display text-lg font-semibold text-foreground">Your name</p>
            <p className="text-sm text-muted-foreground">Placeholder member</p>
            <Button variant="outline" className="mt-6">
              Change photo
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Personal details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full name</Label>
                <Input id="full-name" placeholder="Jane Doe" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" placeholder="+1 555 000 0000" className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="medical">Medical notes</Label>
                <Textarea
                  id="medical"
                  rows={4}
                  placeholder="Allergies, conditions, medications…"
                  className="rounded-xl"
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  variant="hero"
                  onClick={() => toast.success("Profile saved", { description: "Placeholder action." })}
                >
                  <Save className="size-4" />
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base">Emergency contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={Users}
                title="No emergency contacts"
                description="Add the people who should be notified automatically during an incident."
                action={<Button variant="outline">Add contact</Button>}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}