import { createFileRoute } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { PageHeader } from "@/components/system/page-header";
import { EmergencyConsole } from "@/components/landing/emergency-console";

export const Route = createFileRoute("/_app/report")({
  head: () => ({
    meta: [
      { title: "Report an accident with AI analysis — AEGIS" },
      {
        name: "description",
        content:
          "Take or upload a photo or video of an accident and AEGIS analyses the emergency type, severity and confidence, then recommends who to alert.",
      },
      { property: "og:title", content: "Report an accident — AEGIS" },
      {
        property: "og:description",
        content: "AI photo and video triage for accidents, with one-tap contact and responder alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  return (
    <>
      <PageHeader
        icon={Camera}
        title="Report accident"
        description="Take a photo, upload an image or a video — AEGIS returns the emergency type, severity and confidence, and recommends the next action."
      />
      <EmergencyConsole mode="report" />
    </>
  );
}