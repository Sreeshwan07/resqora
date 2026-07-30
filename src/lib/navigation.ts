import {
  Home,
  Siren,
  MapPinned,
  History,
  UserRound,
  Settings,
  LifeBuoy,
  ShieldCheck,
  Bot,
  Bell,
  Radar,
  Gauge,
  AlarmClock,
  NotebookPen,
  Droplets,
  Activity,
  Info,
} from "lucide-react";
import type { NavSection, NavItem } from "@/types";

export const primaryNav: NavItem[] = [
  { label: "Home", to: "/dashboard", icon: Home, description: "Fast emergency actions" },
  { label: "Emergency", to: "/emergency", icon: Siren, description: "Trigger assistance" },
  { label: "Nearby", to: "/nearby", icon: MapPinned, description: "Responders around you" },
  { label: "History", to: "/history", icon: History, description: "Past incidents" },
  { label: "Profile", to: "/profile", icon: UserRound, description: "Your safety identity" },
  { label: "About", to: "/about", icon: Info, description: "How AEGIS works" },
  { label: "Settings", to: "/settings", icon: Settings, description: "Preferences" },
];

export const assistantNav: NavItem = {
  label: "AI Assistant",
  to: "/assistant",
  icon: Bot,
  description: "Triage & first aid",
};

export const liveLocationNav: NavItem = {
  label: "Live Location",
  to: "/live",
  icon: Radar,
  description: "Active emergency tracking",
};

export const notificationsNav: NavItem = {
  label: "Notifications",
  to: "/notifications",
  icon: Bell,
  description: "Alerts & updates",
};

export const adminNav: NavItem = {
  label: "Admin",
  to: "/admin",
  icon: Gauge,
  description: "Platform analytics",
};

export const checkinsNav: NavItem = {
  label: "Check-ins",
  to: "/checkins",
  icon: AlarmClock,
  description: "Timed safety confirmations",
};

export const notesNav: NavItem = {
  label: "Emergency notes",
  to: "/notes",
  icon: NotebookPen,
  description: "Responder instructions",
};

export const donorsNav: NavItem = {
  label: "Blood donors",
  to: "/donors",
  icon: Droplets,
  description: "Directory & availability",
};

export const activityNav: NavItem = {
  label: "Activity",
  to: "/activity",
  icon: Activity,
  description: "Audit trail & exports",
};

export const navSections: NavSection[] = [
  {
    title: "Response",
    items: [...primaryNav.slice(0, 3), assistantNav, liveLocationNav, checkinsNav],
  },
  {
    title: "Records",
    items: [primaryNav[3], activityNav, notesNav, donorsNav, notificationsNav],
  },
  {
    title: "Account",
    items: primaryNav.slice(4),
  },
];

export const supportNav: NavItem[] = [
  { label: "Safety guide", to: "/dashboard", icon: LifeBuoy },
  { label: "Trust center", to: "/dashboard", icon: ShieldCheck },
];

export const mobileNav: NavItem[] = [
  primaryNav[0],
  primaryNav[2],
  primaryNav[3],
  primaryNav[5],
  primaryNav[4],
];