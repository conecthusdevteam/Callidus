import brandLogo from "@/assets/brand.svg";
import dashboardIcon from "@/assets/icon-dashboard.svg";
import uploadIcon from "@/assets/icon-upload.svg";

/**
 * Sidebar lateral fina — fundo branco com logo da marca e ícones de navegação.
 */
export function Sidebar() {
  const items = [
    { icon: dashboardIcon, label: "Dashboard", active: false },
    { icon: uploadIcon, label: "Upload", active: true },
  ];

  return (
    <aside className="hidden md:flex w-16 flex-col items-center gap-3 border-r bg-card py-4">
      <div className="flex h-11 w-11 items-center justify-center">
        <img src={brandLogo} alt="Marca" className="h-8 w-8" />
      </div>
      {items.map((item, i) => (
        <button
          key={i}
          aria-label={item.label}
          className={`flex h-11 w-11 items-center justify-center rounded-md transition-colors ${
            item.active ? "bg-primary/10" : "hover:bg-muted"
          }`}
        >
          <img src={item.icon} alt={item.label} className="h-6 w-6" />
        </button>
      ))}
    </aside>
  );
}
