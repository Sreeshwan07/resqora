import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Plus, ShieldCheck, Users, Bell, Radio } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { StatCard } from "@/components/system/stat-card";
import { SectionHeading } from "@/components/system/section-heading";
import { EmptyState } from "@/components/system/empty-state";
import { StatusIndicator } from "@/components/system/status-indicator";
import { PanelSkeleton } from "@/components/system/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AEGIS" },
      { name: "description", content: "Your AEGIS safety overview: status, readiness, and alerts." },
      { property: "og:title", content: "Dashboard — AEGIS" },
      { property: "og:description", content: "Your AEGIS safety overview at a glance." },
    ],
  }),
  component: DashboardPage,
});

const stats = [
  { id: "readiness", label: "Readiness score", value: "—", delta: "placeholder", icon: ShieldCheck },
  { id: "circle", label: "Trusted contacts", value: "—", delta: "placeholder", icon: Users },
  { id: "alerts", label: "Alerts this month", value: "—", delta: "placeholder", icon: Bell },
  { id: "signal", label: "Device signal", value: "—", delta: "placeholder", icon: Radio },
];

function DashboardPage() {
  return (
    <>
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="A calm overview of your safety posture. All data shown is placeholder content."
        actions={
          <>
            <StatusIndicator status="safe" className="hidden sm:inline-flex" />
            <Button variant="hero">
              <Plus className="size-4" />
              New check-in
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="rounded-2xl">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <Badge variant="secondary">Placeholder</Badge>
          </CardHeader>
          <CardContent>
            <PanelSkeleton rows={4} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Trusted circle</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Users}
              title="No contacts yet"
              description="Your trusted circle will appear here once contacts are added."
              action={<Button variant="outline">Add contact</Button>}
            />
          </CardContent>
        </Card>
      </div>

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Preparedness"
          title="Suggested next steps"
          description="Placeholder guidance cards for onboarding and readiness."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {["Complete your profile", "Set emergency contacts", "Review location sharing"].map(
            (title) => (
              <Card key={title} className="glass-panel rounded-2xl border-0">
                <CardHeader>
                  <CardTitle className="text-sm">{title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Placeholder description for this readiness step.
                </CardContent>
              </Card>
            ),
          )}
        </div>
      </section>
    </>
  );
}