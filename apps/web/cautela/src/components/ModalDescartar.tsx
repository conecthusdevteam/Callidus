interface Props {
  onConfirmar: (justificativa: string) => void;
  onCancelar: () => void;
}

export default function ModalDescartar({ onConfirmar, onCancelar }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-[340px] flex flex-col items-center gap-4">
        {/* Ícone lixeira */}
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
          <label className="text-sm text-gray-600 mb-1 block text-center">
            Justificativa:
          </label>
          <textarea
            id="justificativa"
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={() => {
            const el = document.getElementById(
              "justificativa",
            ) as HTMLTextAreaElement;
            if (!el.value.trim()) {
              alert("Informe a justificativa.");
              return;
            }
            onConfirmar(el.value.trim());
          }}
          className="w-full py-3 rounded-xl bg-[#2B8E37] text-white font-semibold text-sm hover:bg-[#22592A] transition-colors"
        >
          Enviar
        </button>

        <button
          onClick={onCancelar}
          className="w-full py-3 rounded-xl border border-gray-300 text-black font-medium text-sm hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
