import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HistoryStencilSummary } from "@/lib/api";
import { StencilDetailsCard } from "./StencilDetailsCard";

export function StencilPreviewDialog({
  open,
  stencil,
  mode,
  saving,
  onConfirm,
  onEdit,
  onCancel,
}: {
  open: boolean;
  stencil: HistoryStencilSummary | null;
  mode: "create" | "edit";
  saving: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="w-[min(860px,calc(100vw-48px))] max-w-none rounded-xl bg-card p-8">
        <DialogHeader>
          <DialogTitle className="text-[26px] font-bold leading-tight text-[#0A0A0A]">
            Confirmar informações
          </DialogTitle>
          <DialogDescription className="text-[20px] leading-7 text-muted-foreground">
            Revise as informações inseridas.
          </DialogDescription>
        </DialogHeader>

        {stencil && (
          <StencilDetailsCard stencil={stencil} codeLabel="Código gerado" />
        )}

        <div className="mt-2 flex items-center justify-center gap-10">
          <Button
            type="button"
            disabled={saving}
            onClick={onConfirm}
            className="h-10 rounded-md bg-[#2563EB] px-8 text-base"
          >
            {saving ? "Salvando..." : "Confirmar"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={onEdit}
            className="h-10 px-5 text-base"
          >
            Editar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
