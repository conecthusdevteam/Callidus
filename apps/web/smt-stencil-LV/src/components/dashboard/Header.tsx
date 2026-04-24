import { Menu } from "lucide-react";

/**
 * Header verde fixo com título "Controle de Lavagens".
 */
export function Header() {
  return (
    <header className="border-b-[3px] border-primary bg-card text-foreground shadow-card">
      <div className="flex items-center gap-3 px-5 py-3">
        <Menu className="h-5 w-5 text-muted-foreground" />
       <h1 className="font-montserrat font-bold text-[24px] leading-[26px] tracking-[-0.25px]">
      Controle de Lavagens
      </h1>

      </div>
    </header>
  );
}
