import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ChevronRight,
  History,
  IdCard,
  MapPinned,
  Stethoscope,
  UserRound,
  Users,
} from "lucide-react";

const ACTIONS = [
  {
    to: "/resq-ai" as const,
    icon: Stethoscope,
    title: "RESQ AI",
    subtitle: "Medical Assistant",
  },
  { to: "/resqr-id" as const, icon: IdCard, title: "RESQR ID", subtitle: "Emergency QR" },
  {
    to: "/medical-id" as const,
    icon: UserRound,
    title: "Medical Profile",
    subtitle: "Health Information",
  },
  {
    to: "/contacts" as const,
    icon: Users,
    title: "Emergency Contacts",
    subtitle: "Trusted Guardians",
  },
  {
    to: "/nearby" as const,
    icon: MapPinned,
    title: "Nearby Services",
    subtitle: "Emergency Resources",
  },
  {
    to: "/history" as const,
    icon: History,
    title: "Emergency History",
    subtitle: "Previous Emergencies",
  },
];

/** Six large, fully clickable shortcut cards to the most-used RESQORA tools. */
export function QuickActions() {
  return (
    <section aria-label="Quick actions" className="space-y-3">
      <h2 className="font-display text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
        Quick Actions
      </h2>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 sm:gap-4">
        {ACTIONS.map((action, index) => (
          <motion.li
            key={action.to}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
          >
            <Link
              to={action.to}
              className="soft-card group flex h-full min-h-24 items-center gap-3 rounded-3xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:p-5"
            >
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-2xl bg-teal/10 text-teal transition-colors group-hover:bg-teal/15 sm:size-12"
              >
                <action.icon className="size-5 sm:size-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-bold leading-tight text-foreground sm:text-base">
                  {action.title}
                </span>
                <span className="mt-0.5 block text-xs leading-tight text-muted-foreground">
                  {action.subtitle}
                </span>
              </span>
              <ChevronRight
                className="hidden size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block"
                aria-hidden="true"
              />
            </Link>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}