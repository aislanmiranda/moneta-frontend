import {
  Calendar,
  FileText,
  FolderKanban,
  HeartPulse,
  Layers,
  type LucideIcon,
  Package,
  Puzzle,
  SlidersHorizontal,
  Users,
  Wallet,
} from "lucide-react";

export const MODULE_ICONS: Record<string, LucideIcon> = {
  Wallet,
  HeartPulse,
  Calendar,
  FileText,
  FolderKanban,
  Users,
  Puzzle,
  SlidersHorizontal,
  Package,
  Layers,
};

const FALLBACK_ICON: LucideIcon = Package;

export function resolveModuleIcon(name: string): LucideIcon {
  return MODULE_ICONS[name] ?? FALLBACK_ICON;
}
