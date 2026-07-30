import {
  LayoutDashboard,
  Siren,
  MapPinned,
  History,
  UserRound,
  Settings,
  LifeBuoy,
  ShieldCheck,
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

export const navSections: NavSection[] = [
  {
    title: "Response",
    items: primaryNav.slice(0, 3),
  },
  {
    title: "Records",
    items: primaryNav.slice(3, 4),
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