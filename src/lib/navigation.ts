import {
  Home,
  Siren,
  MapPinned,
  History,
  UserRound,
  Settings,
  Bot,
  Bell,
  Radar,
  Gauge,
  AlarmClock,
  NotebookPen,
  Droplets,
  Activity,
  Info,
  Camera,
  Users,
  IdCard,
  FileText,
  Share2,
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

export const reportNav: NavItem = {
  label: "Report accident",
  to: "/report",
  icon: Camera,
  description: "AI photo & video triage",
};

export const contactsNav: NavItem = {
  label: "Emergency contacts",
  to: "/contacts",
  icon: Users,
  description: "Who we alert",
};

export const medicalIdNav: NavItem = {
  label: "Medical ID",
  to: "/medical-id",
  icon: IdCard,
  description: "Responder medical card",
};

export const documentsNav: NavItem = {
  label: "Documents",
  to: "/documents",
  icon: FileText,
  description: "Downloadable PDFs",
};

export const navSections: NavSection[] = [
  // (share centre is declared above navSections)
  {
    title: "Emergency",
    items: [
      { label: "Home", to: "/dashboard", icon: Home, description: "Fast emergency actions" },
      { label: "Emergency SOS", to: "/emergency", icon: Siren, description: "Trigger assistance" },
      reportNav,
      { label: "Nearby services", to: "/nearby", icon: MapPinned, description: "Responders around you" },
      liveLocationNav,
      shareCenterNav,
    ],
  },
  {
    title: "Records",
    items: [
      donorsNav,
      { label: "Emergency history", to: "/history", icon: History, description: "Past incidents" },
      contactsNav,
      medicalIdNav,
      documentsNav,
    ],
  },
  {
    title: "Account",
    items: [
      notificationsNav,
      primaryNav[4],
      { label: "Settings", to: "/settings", icon: Settings, description: "Preferences" },
      { label: "About", to: "/about", icon: Info, description: "How AEGIS works" },
    ],
  },
];

export const supportNav: NavItem[] = [
  assistantNav,
  checkinsNav,
  notesNav,
  activityNav,
];

export const mobileNav: NavItem[] = [
  primaryNav[0],
  primaryNav[2],
  primaryNav[3],
  primaryNav[5],
  primaryNav[4],
];