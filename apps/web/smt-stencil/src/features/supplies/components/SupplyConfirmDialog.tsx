import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SupplyConfirmDialog({
  open,
  title,
  description,
  question,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  question: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="w-[min(436px,calc(100vw-48px))] gap-4 rounded-3xl border-0 bg-[#FAFAFA] p-6 text-center shadow-none [&>button:last-child]:hidden">
        <DialogHeader className="space-y-0">
          <DialogTitle className="text-center text-[18px] font-bold leading-[26px] tracking-[-0.25px] text-[#1A1A1A]">
            {title}
          </DialogTitle>
          <DialogDescription className="pt-0 text-center text-sm leading-[18px] tracking-[-0.25px] text-[#0A0A0A]">
            {description}
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm leading-[18px] tracking-[-0.25px] text-[#0A0A0A]">
          {question}
        </p>

        <div className="flex w-full items-center justify-center gap-[14px]">
          <Button
            type="button"
            onClick={onCancel}
            className="h-9 flex-1 rounded-lg bg-[#171717] px-4 text-sm font-medium leading-5 text-[#F9F9F9] hover:bg-[#27272A]"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onConfirm}
            className="h-9 flex-1 rounded-lg border-black bg-white/10 px-4 text-sm font-medium leading-5 text-[#0A0A0A] hover:bg-white/40"
          >
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
