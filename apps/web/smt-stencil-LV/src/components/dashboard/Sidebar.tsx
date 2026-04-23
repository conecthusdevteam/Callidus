import { Droplets, LayoutGrid, Settings, Download } from "lucide-react";

/**
 * Sidebar lateral fina (estilo wallboard) — verde escuro com ícones de navegação.
 */
export function Sidebar() {
  const items = [
    { icon: LayoutGrid, label: "Dashboard", active: true },
    { icon: Droplets, label: "Lavagens" },
    { icon: Download, label: "Exportar" },
    { icon: Settings, label: "Configurações" },
  ];

  return (
    <aside className="hidden md:flex w-14 flex-col items-center gap-1 bg-sidebar py-4 text-sidebar-foreground">
      {items.map((item, i) => (
        <button
          key={i}
          aria-label={item.label}
          className={`flex h-11 w-11 items-center justify-center rounded-md transition-colors ${
            item.active ? "bg-sidebar-active" : "hover:bg-sidebar-active/60"
          }`}
        >
          <item.icon className="h-5 w-5" />
        </button>
      ))}
    </aside>
  );
}
