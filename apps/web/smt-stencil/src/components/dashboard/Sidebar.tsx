import brandLogo from "@/assets/brand.svg";
import dashboardIcon from "@/assets/icon-dashboard.svg";
import uploadIcon from "@/assets/icon-upload.svg";
import { NavLink } from "@/components/NavLink";

/**
 * Sidebar lateral fina — fundo branco com logo da marca e ícones de navegação.
 */
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-16 flex-col items-center gap-3 border-r bg-card py-4">
      <div className="flex h-11 w-11 items-center justify-center">
        <img src={brandLogo} alt="Marca" className="h-8 w-8" />
      </div>
      <NavLink
        to="/"
        className="flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-muted"
        activeClassName="bg-primary/10"
      >
        <img src={dashboardIcon} alt="Dashboard" className="h-6 w-6" />
      </NavLink>
      <NavLink
        to="/historico"
        className="flex h-11 w-11 items-center justify-center rounded-md transition-colors hover:bg-muted"
        activeClassName="bg-primary/10"
      >
        <img src={uploadIcon} alt="Histórico de Lavagens" className="h-6 w-6" />
      </NavLink>
    </aside>
  );
}
