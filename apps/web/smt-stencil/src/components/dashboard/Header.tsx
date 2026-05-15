import menuIcon from "@/assets/menu.svg";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";

/**
 * Header verde fixo com título "Controle de Lavagens".
 */
export function Header() {
  return (
    <header
      className="border-b-[6px] border-primary bg-card text-foreground shadow-card"
      style={{
        height: "60px",
        backgroundColor: "#FFFFFF",
        borderColor: "#2B8E37",
        boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
      }}
    >
      <div className="flex items-center gap-3 px-5 py-3">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Abrir menu"
            >
              <img src={menuIcon} alt="Menu" className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[260px]">
            <SheetTitle>Menu</SheetTitle>
            <nav className="mt-6 space-y-2">
              <NavLink
                to="/"
                className="flex items-center gap-3 rounded-lg border border-input px-3 py-3 text-sm text-foreground transition-colors hover:bg-muted"
                activeClassName="bg-primary/10"
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/historico"
                className="flex items-center gap-3 rounded-lg border border-input px-3 py-3 text-sm text-foreground transition-colors hover:bg-muted"
                activeClassName="bg-primary/10"
              >
                Histórico de Lavagens
              </NavLink>
            </nav>
          </SheetContent>
        </Sheet>
        <h1 className="font-montserrat font-bold text-[24px] leading-[26px] tracking-[-0.25px]">
          Controle de Lavagens
        </h1>
      </div>
    </header>
  );
}
