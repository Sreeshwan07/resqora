import { createFileRoute } from "@tanstack/react-router";
import { Settings2, Bell, MapPin, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { SectionHeading } from "@/components/system/section-heading";
import { ThemeToggle } from "@/components/system/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AEGIS" },
      { name: "description", content: "Control alerts, location sharing, privacy, and appearance." },
      { property: "og:title", content: "Settings — AEGIS" },
      { property: "og:description", content: "Control alerts, privacy, and appearance in AEGIS." },
    ],
  }),
  component: SettingsPage,
});

const groups = [
  {
    icon: Bell,
    title: "Notifications",
    items: [
      { id: "critical", label: "Critical alerts", description: "Always-on alerts for emergencies." },
      { id: "digest", label: "Weekly digest", description: "A summary of your safety activity." },
    ],
  },
  {
    icon: MapPin,
    title: "Location",
    items: [
      { id: "live", label: "Live location sharing", description: "Share position during an incident." },
      { id: "history", label: "Location history", description: "Keep a private trail of past routes." },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Privacy",
    items: [
      { id: "anon", label: "Anonymised analytics", description: "Help improve AEGIS reliability." },
      { id: "lock", label: "Require device unlock", description: "Protect sensitive screens." },
    ],
  },
];

function SettingsPage() {
  return (
    <>
      <PageHeader
        icon={Settings2}
        title="Settings"
        description="Preferences are UI placeholders and are not persisted."
        actions={<ThemeToggle />}
      />

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.title} className="space-y-4">
            <Card className="rounded-2xl">
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <group.icon className="size-4" aria-hidden="true" />
                </span>
                <CardTitle className="min-w-0 truncate text-base">{group.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {group.items.map((item, index) => (
                  <div key={item.id}>
                    {index > 0 && <Separator className="my-1" />}
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
                      <div className="min-w-0">
                        <Label htmlFor={item.id} className="text-sm font-medium">
                          {item.label}
                        </Label>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Switch id={item.id} className="shrink-0" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        ))}
      </div>
    </>
  );
}