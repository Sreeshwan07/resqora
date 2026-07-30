import { createFileRoute } from "@tanstack/react-router";
import { MapPinned, Navigation, Hospital, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { EmptyState } from "@/components/system/empty-state";
import { StatusIndicator } from "@/components/system/status-indicator";
import { PanelSkeleton } from "@/components/system/loading-skeletons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/nearby")({
  head: () => ({
    meta: [
      { title: "Nearby — AEGIS" },
      { name: "description", content: "Discover nearby responders, hospitals, and safe places." },
      { property: "og:title", content: "Nearby — AEGIS" },
      { property: "og:description", content: "Nearby responders and safe places, at a glance." },
    ],
  }),
  component: NearbyPage,
});

function NearbyPage() {
  return (
    <>
      <PageHeader
        icon={MapPinned}
        title="Nearby"
        description="Responders, hospitals, and safe places around you. Placeholder content only."
        actions={
          <Button variant="outline" className="min-h-11">
            <Navigation className="size-4" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card className="overflow-hidden rounded-2xl">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">Live map</CardTitle>
            <StatusIndicator status="offline" label="Map not connected" />
          </CardHeader>
          <CardContent>
            <div className="aurora grid h-72 place-items-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
              Map placeholder
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Around you</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="responders">
              <TabsList className="grid w-full grid-cols-2 rounded-xl">
                <TabsTrigger value="responders">Responders</TabsTrigger>
                <TabsTrigger value="places">Safe places</TabsTrigger>
              </TabsList>
              <TabsContent value="responders" className="mt-4">
                <PanelSkeleton rows={3} />
              </TabsContent>
              <TabsContent value="places" className="mt-4">
                <EmptyState
                  icon={Hospital}
                  title="No places yet"
                  description="Nearby safe places will be listed here once location services are connected."
                  action={
                    <Button variant="outline">
                      <ShieldCheck className="size-4" />
                      Learn more
                    </Button>
                  }
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
}