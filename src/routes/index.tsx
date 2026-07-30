import { createFileRoute } from "@tanstack/react-router";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { StatsSection } from "@/components/landing/stats-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { CtaSection } from "@/components/landing/cta-section";
import { SiteFooter } from "@/components/landing/site-footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AEGIS — Emergency Assistance in Seconds" },
      {
        name: "description",
        content:
          "AEGIS is an AI-powered emergency intelligence platform that helps you reach assistance fast and keeps loved ones informed.",
      },
      { property: "og:title", content: "AEGIS — Emergency Assistance in Seconds" },
      {
        property: "og:description",
        content:
          "AI-powered emergency intelligence: rapid assistance, live context, and calm updates for your trusted circle.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-dvh bg-background">
      <LandingNav />
      <main>
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
