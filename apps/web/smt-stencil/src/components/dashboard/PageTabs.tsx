import { NavLink } from "@/components/NavLink";

export function PageTabs() {
  return (
    <nav className="flex items-center gap-2 px-5 py-3">
      <NavLink
        to="/"
        end
        className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        activeClassName="bg-muted text-foreground"
      >
        Dashboard
      </NavLink>
      <NavLink
        to="/historico"
        className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        activeClassName="bg-muted text-foreground"
      >
        Histórico de lavagens
      </NavLink>
    </nav>
  );
}
