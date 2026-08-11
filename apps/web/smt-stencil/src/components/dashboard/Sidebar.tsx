import { cn } from "@/lib/utils";
import {
  ClipboardCheck,
  Database,
  FolderClock,
  Home,
} from "lucide-react";
import { NavLink } from "react-router-dom";

interface SidebarProps {
  expanded: boolean;
}

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home, end: true },
  { to: "/historico", label: "Histórico", icon: FolderClock },
  { to: "/relatorios", label: "Relatórios", icon: ClipboardCheck },
  { to: "/gestao-de-ativos", label: "Gestão de ativos", icon: Database },
];

export function Sidebar({ expanded }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col gap-2 border-r-2 border-[#E5E5E5] bg-white px-3 py-4 transition-[width] duration-200 md:flex",
        expanded ? "w-[184px]" : "w-[60px]",
      )}
    >
      {navItems.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex min-h-[42px] items-center gap-3 rounded-lg text-[16px] font-medium transition-colors",
              expanded ? "justify-start px-3" : "justify-center px-0",
              isActive
                ? "bg-[#5AA700] text-white"
                : "text-[#737373] hover:bg-[#F5F5F5] hover:text-[#171717]",
            )
          }
          title={!expanded ? label : undefined}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {expanded && <span className="leading-tight">{label}</span>}
        </NavLink>
      ))}
    </aside>
  );
}
