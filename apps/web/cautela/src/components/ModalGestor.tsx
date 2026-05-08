import { useEffect, useState } from "react";

export function ModalAprovado({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl px-16 py-10 flex flex-col items-center gap-4 min-w-[340px]">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#EEF5EE" }}
        >
          <div className="w-10 h-10 rounded-full border-2 border-[#2B8E37] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[#2B8E37]"
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
        <p className="text-base font-bold text-black text-center">
          Sua resposta foi enviada ao solicitante
        </p>
      </div>
    </div>
  );
}

export function ModalRecusado({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl px-16 py-10 flex flex-col items-center gap-4 min-w-[340px]">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#EEF5EE" }}
        >
          <div className="w-10 h-10 rounded-full border-2 border-[#2B8E37] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[#2B8E37]"
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
        <p className="text-base font-bold text-black text-center">
          A cautela foi recusada com sucesso
        </p>
      </div>
    </div>
  );
}

export function ModalDescartar({
  onConfirmar,
  onCancelar,
}: {
  onConfirmar: (justificativa: string) => void;
  onCancelar: () => void;
}) {
  const [justificativa, setJustificativa] = useState("");
  const [erro, setErro] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-[420px] flex flex-col items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#FEE2E2" }}
        >
          <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M9 6V4h6v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 11v6M14 11v6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 className="text-lg font-bold text-black text-center">
          Tem certeza que deseja
          <br />
          recusar a cautela?
        </h2>

        <div className="w-full">
          <label className="text-sm text-gray-600 mb-1 block">
            Justificativa:
          </label>
          <textarea
            rows={4}
            value={justificativa}
            onChange={(e) => {
              setJustificativa(e.target.value);
              if (e.target.value.trim()) setErro(false);
            }}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none resize-none ${
              erro ? "border-red-400 border-2" : "border-gray-300"
            }`}
          />
          {erro && (
            <p className="text-red-500 text-xs mt-1">
              A justificativa é obrigatória.
            </p>
          )}
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => {
              if (!justificativa.trim()) {
                setErro(true);
                return;
              }
              onConfirmar(justificativa.trim());
            }}
            className="flex-1 py-2.5 rounded-xl bg-[#2B8E37] text-white font-semibold text-sm hover:bg-[#22592A] transition-colors"
          >
            Enviar
          </button>
          <button
            onClick={onCancelar}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-black font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModalAutorizarSaida({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl px-12 py-10 flex flex-col items-center gap-4 min-w-[340px] max-w-[420px]">
        {/* Ícone de saída autorizada */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#FEF3C7" }}
        >
          <svg
            className="w-8 h-8 text-amber-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 3h-2a1 1 0 000 2h2a1 1 0 000-2z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 14l2 2 4-4"
            />
          </svg>
        </div>
        <p className="text-base font-bold text-black text-center">
          A cautela foi autorizada a sair com sucesso
        </p>
        <p className="text-sm text-[#404040] text-center">
          A portaria será notificada automaticamente.
        </p>
      </div>
    </div>
  );
}

export function ModalPermitirSaida({
  onConfirmar,
  onCancelar,
}: {
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-[420px] flex flex-col items-center gap-5">
        {/* Ícone de encerramento */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#EEF5EE" }}
        >
          <svg
            className="w-8 h-8 text-[#2B8E37]"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 12h14M12 5l7 7-7 7"
            />
          </svg>
        </div>

        <div className="text-center">
          <h2 className="text-base font-bold text-black">
            A cautela foi autorizada a sair com sucesso.
          </h2>
          <p className="text-sm text-[#404040] mt-2">
            Ao sair, essa cautela será{" "}
            <span className="font-semibold">encerrada</span>. Esta ação é
            irreversível.
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onConfirmar}
            className="flex-1 py-2.5 rounded-xl bg-[#2B8E37] text-white font-semibold text-sm hover:bg-[#22592A] transition-colors"
          >
            Confirmar saída
          </button>
          <button
            onClick={onCancelar}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-black font-medium text-sm hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModalEncerrada({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl px-12 py-10 flex flex-col items-center gap-4 min-w-[340px]">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "#F4F4F4" }}
        >
          <svg
            className="w-8 h-8 text-[#525252]"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <rect
              x="3"
              y="11"
              width="18"
              height="11"
              rx="2"
              stroke="currentColor"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 11V7a5 5 0 0110 0v4"
            />
          </svg>
        </div>
        <p className="text-base font-bold text-black text-center">
          Cautela encerrada com sucesso
        </p>
        <p className="text-sm text-[#404040] text-center">
          O registro foi fechado com data e hora de saída.
        </p>
      </div>
    </div>
  );
}
