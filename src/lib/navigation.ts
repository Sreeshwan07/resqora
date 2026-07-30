import {
  LayoutDashboard,
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
} from "lucide-react";
import type { NavSection, NavItem } from "@/types";

export const primaryNav: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, description: "Overview" },
  { label: "Emergency", to: "/emergency", icon: Siren, description: "Trigger assistance" },
  { label: "Nearby", to: "/nearby", icon: MapPinned, description: "Responders around you" },
  { label: "History", to: "/history", icon: History, description: "Past incidents" },
  { label: "Profile", to: "/profile", icon: UserRound, description: "Your safety identity" },
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

export const navSections: NavSection[] = [
  {
    title: "Response",
    items: [...primaryNav.slice(0, 3), assistantNav, liveLocationNav],
  },
  {
    title: "Records",
    items: [primaryNav[3], notificationsNav],
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
  primaryNav[1],
  primaryNav[3],
  primaryNav[4],
];