import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/**
 * Paginação customizada — botão numerado ativo em verde (primary),
 * fiel ao protótipo do Figma.
 */
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const goTo = (p: number) => onChange(Math.min(Math.max(1, p), totalPages));

  // Constrói a lista de páginas com elipses para muitas páginas.
  const pages: (number | "...")[] = [];
  const windowSize = 1; // páginas vizinhas mostradas ao redor da atual

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - windowSize && i <= page + windowSize)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav
      role="navigation"
      aria-label="Paginação"
      className="flex items-center justify-center gap-2 py-3"
    >
      <button
        type="button"
        onClick={() => goTo(page - 1)}
        disabled={page === 1}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "disabled:opacity-40 disabled:pointer-events-none",
        )}
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, idx) =>
          p === "..." ? (
            <span
              key={`e-${idx}`}
              className="px-2 text-sm text-muted-foreground select-none"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => goTo(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "h-9 min-w-9 rounded-md px-3 text-sm font-semibold tabular-nums transition-colors",
                p === page
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {p}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={() => goTo(page + 1)}
        disabled={page === totalPages}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          "text-foreground hover:bg-muted",
          "disabled:opacity-40 disabled:pointer-events-none",
        )}
      >
        Próxima
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
