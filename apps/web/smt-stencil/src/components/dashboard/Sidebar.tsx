import brandLogo from "@/assets/brand.svg";

/**
 * Sidebar lateral fina — fundo branco com logo da marca e ícones de navegação.
 */
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-16 flex-col items-center gap-3 border-r bg-card py-4">
      <div className="flex h-11 w-11 items-center justify-center">
        <img src={brandLogo} alt="Marca" className="h-8 w-8" />
      </div>
    </aside>
  );
}
