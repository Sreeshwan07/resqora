import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  AlarmClock,
  Bell,
  Bot,
  Droplets,
  Lock,
  MapPinned,
  Radar,
  Rocket,
  ShieldCheck,
  Siren,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About AEGIS — How the emergency platform works" },
      {
        name: "description",
        content:
          "How AEGIS works: one-tap SOS, AI triage, live location sharing, medical ID, safety check-ins, trusted contacts, blood donors and nearby responders.",
      },
      { property: "og:title", content: "About AEGIS — AI-Powered Emergency Intelligence" },
      {
        property: "og:description",
        content: "The complete AEGIS emergency workflow, explained step by step.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const FEATURES = [
  {
    icon: Bot,
    title: "AI emergency assessment",
    body: "Seven guided questions score your situation 0–100, set a priority level and return the right first-aid steps while help is on the way.",
  },
  {
    icon: Radar,
    title: "Live location sharing",
    body: "During an emergency your GPS position refreshes every 10 seconds and can be opened by anyone holding your secure tracking link — no app required.",
  },
  {
    icon: Stethoscope,
    title: "Medical ID",
    body: "Blood group, allergies, conditions, medications and trusted contacts on one card, plus a QR code responders can scan in seconds.",
  },
  {
    icon: AlarmClock,
    title: "Safety check-in",
    body: "Start a timer before a walk home or a solo trip. Miss the confirmation and AEGIS escalates to your full SOS workflow automatically.",
  },
  {
    icon: Users,
    title: "Emergency contacts",
    body: "Three trusted people receive an identical alert containing your identity, medical basics, coordinates and a live map link.",
  },
  {
    icon: Droplets,
    title: "Blood donor network",
    body: "A searchable directory by blood group and city, with an availability switch you control at all times.",
  },
  {
    icon: MapPinned,
    title: "Nearby services",
    body: "Hospitals, police, fire stations, blood banks and pharmacies with distance, ETA, one-tap calling, directions and saved favourites.",
  },
  {
    icon: Bell,
    title: "Notifications",
    body: "Status changes, disaster alerts, check-in reminders and safety tips arrive in the app and on your device.",
  },
] as const;

const WORKFLOW = [
  { label: "SOS triggered", body: "One tap, or an automatic crash-detection countdown." },
  { label: "Location captured", body: "GPS coordinates and accuracy attach to the alert." },
  { label: "AI analysis", body: "Severity scored and response priority calculated." },
  { label: "Contacts notified", body: "Your three trusted contacts get the full alert payload." },
  { label: "Emergency active", body: "Live tracking, status updates and responder guidance." },
  { label: "Resolved", body: "A timed summary is written to your history and activity log." },
] as const;

function AboutPage() {
  return (
    <main className="aurora min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <Link to="/" className="min-w-0">
            <Logo />
          </Link>
          <Button asChild variant="hero" size="sm">
            <Link to="/dashboard">Open AEGIS</Link>
          </Button>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-10"
        >
          <Badge variant="secondary" className="rounded-full">
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI-Powered Emergency Intelligence
          </Badge>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            What AEGIS is
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            AEGIS is a personal emergency platform. It keeps everything a responder or a loved one
            needs — who you are, where you are, what care you need — one tap away, and it acts for
            you when you cannot act for yourself. The home screen carries only actions; every
            explanation lives on this page.
          </p>
        </motion.section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-foreground">How it works</h2>
          <ol className="mt-6 space-y-4 border-l border-border pl-6">
            {WORKFLOW.map((step, index) => (
              <motion.li
                key={step.label}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="relative"
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-[31px] top-1 grid size-4 place-items-center rounded-full border-2 border-background bg-primary"
                />
                <p className="text-sm font-semibold text-foreground">
                  {index + 1}. {step.label}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </motion.li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Everything inside AEGIS
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className="glass-panel rounded-2xl p-5"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <article className="glass-panel rounded-2xl p-6">
            <span className="grid size-10 place-items-center rounded-xl bg-success/10 text-success">
              <Lock className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-3 font-display text-xl font-semibold text-foreground">
              Privacy & security
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Your records are row-level protected — only your account can read or write them.</li>
              <li>Public tracking and medical links use random tokens you can revoke at any time.</li>
              <li>Location is captured only while an emergency or check-in is running.</li>
              <li>Sign-ins, SOS events and profile changes are recorded in your activity log.</li>
            </ul>
          </article>
          <article className="glass-panel rounded-2xl p-6">
            <span className="grid size-10 place-items-center rounded-xl bg-info/10 text-info">
              <Rocket className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-3 font-display text-xl font-semibold text-foreground">
              Future integrations
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Carrier SMS, WhatsApp and email delivery for contact alerts.</li>
              <li>Direct dispatch handoff to local ambulance and police control rooms.</li>
              <li>Wearable crash and fall sensors feeding the detection engine.</li>
              <li>Hospital bed, blood stock and ambulance ETA availability feeds.</li>
            </ul>
          </article>
        </section>

        <section className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-alert/40 bg-alert/5 p-6">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-foreground">
              <ShieldCheck className="size-5 text-alert" aria-hidden="true" />
              Ready when you are
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything above is one or two taps from your home screen.
            </p>
          </div>
          <Button asChild variant="emergency">
            <Link to="/dashboard">
              <Siren className="size-4" />
              Go to home
            </Link>
          </Button>
        </section>
      </div>
    </main>
  );
}