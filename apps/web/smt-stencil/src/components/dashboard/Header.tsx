import logoHeader from "@/assets/logo-header.svg";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const label = user?.area === "operacao" ? "OP" : (user?.area ?? "OP").slice(0, 2).toUpperCase();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="h-[66px] shrink-0 border-b-[6px] border-[#2B8E37] bg-white">
      <div className="flex h-[60px] items-center justify-between px-4">
        <div className="flex items-center gap-7">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#171717] transition-colors hover:bg-[#F5F5F5]"
            aria-label="Expandir ou colapsar menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <img
            src={logoHeader}
            alt="Controle de Lavagens"
            className="h-10 w-auto object-contain"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5] text-[16px] font-bold text-[#171717] transition-colors hover:bg-[#ECECEC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B8E37] focus-visible:ring-offset-2"
              aria-label="Abrir menu do usuario"
            >
              {label}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-[#171717]"
              disabled={loggingOut}
              onSelect={(event) => {
                event.preventDefault();
                void handleLogout();
              }}
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Saindo..." : "Sair"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
