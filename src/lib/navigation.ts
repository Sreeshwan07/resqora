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
  MailCheck,
  Stethoscope,
  QrCode,
  ScanLine,
} from "lucide-react";
import type { NavSection, NavItem } from "@/types";

export const primaryNav: NavItem[] = [
  { label: "Home", to: "/dashboard", icon: Home, description: "Fast emergency actions" },
  { label: "Emergency", to: "/emergency", icon: Siren, description: "Trigger assistance" },
  { label: "Nearby", to: "/nearby", icon: MapPinned, description: "Responders around you" },
  { label: "History", to: "/history", icon: History, description: "Past incidents" },
  { label: "Profile", to: "/profile", icon: UserRound, description: "Your safety identity" },
  { label: "About", to: "/about", icon: Info, description: "How RESQORA works" },
  { label: "Settings", to: "/settings", icon: Settings, description: "Preferences" },
];

export const assistantNav: NavItem = {
  label: "AI Assistant",
  to: "/assistant",
  icon: Bot,
  description: "Triage & first aid",
};

export const medAiNav: NavItem = {
  label: "AI Medical Assistant",
  to: "/medai",
  icon: Stethoscope,
  description: "MedAI symptoms & first aid",
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

export const resqrIdNav: NavItem = {
  label: "My RESQR ID",
  to: "/resqr-id",
  icon: QrCode,
  description: "Emergency QR & wallet card",
};

export const scanNav: NavItem = {
  label: "Scan RESQR ID",
  to: "/scan",
  icon: ScanLine,
  description: "Open someone's emergency summary",
};

export const documentsNav: NavItem = {
  label: "Documents",
  to: "/documents",
  icon: FileText,
  description: "Downloadable PDFs",
};

export const shareCenterNav: NavItem = {
  label: "Share centre",
  to: "/share-center",
  icon: Share2,
  description: "Email, WhatsApp, links & QR",
};

export const emailDiagnosticsNav: NavItem = {
  label: "Email diagnostics",
  to: "/email-diagnostics",
  icon: MailCheck,
  description: "Alert delivery health",
};

export const navSections: NavSection[] = [
  {
    title: "Emergency",
    items: [
      { label: "Home", to: "/dashboard", icon: Home, description: "Fast emergency actions" },
      { label: "Emergency SOS", to: "/emergency", icon: Siren, description: "Trigger assistance" },
      reportNav,
      { label: "Nearby services", to: "/nearby", icon: MapPinned, description: "Responders around you" },
      liveLocationNav,
      shareCenterNav,
      scanNav,
    ],
  },
  {
    title: "Records",
    items: [
      donorsNav,
      { label: "Emergency history", to: "/history", icon: History, description: "Past incidents" },
      contactsNav,
      medicalIdNav,
      resqrIdNav,
      documentsNav,
    ],
  },
  {
    title: "Account",
    items: [
      notificationsNav,
      primaryNav[4],
      { label: "Settings", to: "/settings", icon: Settings, description: "Preferences" },
      emailDiagnosticsNav,
      { label: "About", to: "/about", icon: Info, description: "How RESQORA works" },
    ],
  },
];

export const supportNav: NavItem[] = [
  medAiNav,
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