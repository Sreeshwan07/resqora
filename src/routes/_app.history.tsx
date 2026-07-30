import { createFileRoute } from "@tanstack/react-router";
import { History, Filter, FileClock } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { EmptyState } from "@/components/system/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_app/history")({
  head: () => ({
    meta: [
      { title: "History — AEGIS" },
      { name: "description", content: "Review past incidents, check-ins, and alert timelines." },
      { property: "og:title", content: "History — AEGIS" },
      { property: "og:description", content: "A clear record of past incidents and check-ins." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  return (
    <>
      <PageHeader
        icon={History}
        title="History"
        description="A timeline of incidents and check-ins. No records exist in this preview."
        actions={
          <Button variant="outline" className="min-h-11">
            <Filter className="size-4" />
            Filters
          </Button>
        }
      />

      <Card className="rounded-2xl">
        <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 space-y-0 sm:flex sm:justify-between">
          <CardTitle className="min-w-0 truncate text-base">Incident log</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            Placeholder
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <Input
            type="search"
            aria-label="Search history"
            placeholder="Search by date, type, or location"
            className="h-11 rounded-xl"
          />
          <EmptyState
            icon={FileClock}
            title="No history yet"
            description="Once incidents and check-ins are recorded, they will appear here as a searchable timeline."
          />
        </CardContent>
      </Card>
    </>
  );
}