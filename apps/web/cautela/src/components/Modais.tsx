import type { ReactNode } from "react";

// ─── Base ─────────────────────────────────────────────────────────────────────

function ModalOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {children}
    </div>
  );
}

function ModalCard({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl px-10 py-8 flex flex-col items-center gap-4 min-w-[320px]">
      {children}
    </div>
  );
}

function IconeSucesso({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const outer =
    size === "lg" ? "w-20 h-20 rounded-3xl" : "w-14 h-14 rounded-2xl";
  const inner = size === "lg" ? "w-9 h-9" : "w-9 h-9";
  const icon = size === "lg" ? "w-7 h-7" : "w-6 h-6";
  return (
    <div
      className={`${outer} flex items-center justify-center`}
      style={{ backgroundColor: "#EEF5EE" }}
    >
      <div
        className={`${inner} rounded-full border-2 border-[#2B8E37] flex items-center justify-center`}
      >
        <svg
          className={`${icon} text-[#2B8E37]`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

/** Solicitação enviada ao gestor */
export function ModalSolicitacaoEnviada({ onClose }: { onClose?: () => void }) {
  return (
    <ModalOverlay>
      <ModalCard>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
        <IconeSucesso size="lg" />
        <p className="text-base font-bold text-black text-center">
          Sua solicitação foi enviada ao gestor
        </p>
      </ModalCard>
    </ModalOverlay>
  );
}

/** Confirmação de exclusão de item */
export function ModalConfirmarExclusao({
  onConfirmar,
  onCancelar,
}: {
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <ModalOverlay>
      <div className="bg-white rounded-2xl shadow-xl px-14 py-10 flex flex-col items-center gap-4 min-w-[320px]">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#FEE2E2" }}
        >
          <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M9 6V4h6v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-base font-bold text-black text-center">
          Você deseja excluir este item?
        </p>
        <p className="text-xs text-[#404040] text-center">
          Os dados serão removidos permanentemente.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            className="px-4 py-2 rounded-lg bg-[#F5F5F5] text-[#171717] text-sm font-medium hover:bg-gray-300"
          >
            Não
          </button>
          <button
            onClick={onConfirmar}
            className="px-4 py-2 rounded-lg bg-[#3BB14A] text-white text-sm font-medium hover:bg-[#2B8E37]"
          >
            Sim
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/** Item excluído com sucesso */
export function ModalItemExcluido() {
  return (
    <ModalOverlay>
      <div className="bg-white rounded-2xl shadow-xl px-12 py-10 flex flex-col items-center gap-4 min-w-[320px]">
        <IconeSucesso size="md" />
        <p className="text-base font-bold text-black text-center">
          O item foi EXCLUÍDO com sucesso.
        </p>
      </div>
    </ModalOverlay>
  );
}

// ─── Gestor ───────────────────────────────────────────────────────────────────

/** Confirmação de alteração de tipo de acesso */
export function ModalConfirmarAcesso({
  onConfirmar,
  onCancelar,
}: {
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <ModalOverlay>
      <ModalCard>
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-amber-100">
          <svg
            className="w-6 h-6 text-amber-500"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
        <p className="text-base font-bold text-black text-center">
          Deseja alterar o tipo de acesso?
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={onCancelar}
            className="px-6 py-2 rounded-lg bg-[#F5F5F5] text-[#171717] text-sm font-medium hover:bg-gray-200"
          >
            Não
          </button>
          <button
            onClick={onConfirmar}
            className="px-6 py-2 rounded-lg bg-[#3BB14A] text-white text-sm font-medium hover:bg-[#22592A]"
          >
            Sim
          </button>
        </div>
      </ModalCard>
    </ModalOverlay>
  );
}

/** Alteração de acesso realizada com sucesso */
export function ModalAcessoSucesso({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay>
      <ModalCard>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#D1FAE5]">
          <svg
            className="w-6 h-6 text-[#0E9F6E]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-base font-bold text-black text-center">
          Alteração de acesso realizada com sucesso!
        </p>
      </ModalCard>
    </ModalOverlay>
  );
}

// ─── Portaria ─────────────────────────────────────────────────────────────────

/** Cautela encerrada com sucesso (Portaria) */
export function ModalEncerrada({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay>
      <ModalCard>
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#D1FAE5]">
          <svg
            className="w-6 h-6 text-[#0E9F6E]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-base font-bold text-black text-center">
          Cautela encerrada com sucesso!
        </p>
        <button
          onClick={onClose}
          className="mt-2 px-6 py-2 rounded-lg bg-[#3BB14A] text-white text-sm font-medium hover:bg-[#22592A]"
        >
          Ok
        </button>
      </ModalCard>
    </ModalOverlay>
  );
}

/** Entrada/saída aprovada pela Portaria */
export function ModalAprovadoPortaria({ onClose }: { onClose: () => void }) {
  return (
    <ModalOverlay>
      <ModalCard>
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#D1FAE5]">
          <svg
            className="w-6 h-6 text-[#0E9F6E]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <p className="text-base font-bold text-black text-center">
          Aprovação realizada com sucesso!
        </p>
        <button
          onClick={onClose}
          className="mt-2 px-6 py-2 rounded-lg bg-[#3BB14A] text-white text-sm font-medium hover:bg-[#22592A]"
        >
          Ok
        </button>
      </ModalCard>
    </ModalOverlay>
  );
}
