import {
  Bell,
  LayoutDashboard,
  Repeat,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Optional accent tone overriding the default active-state color (e.g. "health" for
   * Vida Saudável's red identity) — see Sidebar.css. */
  accent?: "health";
}

export interface NavGroup {
  title?: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/rotinas", label: "Rotinas", icon: Repeat },
    ],
  },
  {
    title: "Configurações",
    items: [
      { to: "/configuracoes/preferencias", label: "Preferências", icon: SlidersHorizontal },
      { to: "/configuracoes/notificacoes", label: "Notificações", icon: Bell },
    ],
  },
];
