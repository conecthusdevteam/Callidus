import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SupplySuccessDialog({
  open,
  code,
  action,
  supplyLabel = "Stencil",
  onOpenChange,
}: {
  open: boolean;
  code: string;
  action: "cadastrado" | "atualizado";
  supplyLabel?: "Stencil" | "Placa";
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(460px,calc(100vw-48px))] rounded-xl bg-card px-12 py-10 text-center">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {supplyLabel} {action}
          </DialogTitle>
          <DialogDescription>
            Confirmação de que {supplyLabel.toLowerCase()} foi {action}.
          </DialogDescription>
        </DialogHeader>

        <div className="mx-auto mb-8 grid h-[68px] w-[68px] place-items-center rounded-2xl bg-[#F2FBF3]">
          <Check className="h-9 w-9 text-[#2B8E37]" />
        </div>
        <p className="text-[20px] leading-7 text-[#0A0A0A]">
          {supplyLabel} <strong>{code}</strong>
          <br />
          {action}.
        </p>
      </DialogContent>
    </Dialog>
  );
}
