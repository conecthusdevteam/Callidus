import { useState } from "react";
import type { Cautela } from "../data/cautelaTypes";
import DetalhesCautela from "./DetalhesCautela";

interface ModalEdicaoCautelaProps {
  cautela: Cautela;
  livreAcesso: "livre" | "entrada";
  onChangeLivreAcesso: (valor: "livre" | "entrada") => void;
  onSalvar: () => void;
  onFechar: () => void;
}

export default function ModalEdicaoCautela({
  cautela,
  livreAcesso,
  onChangeLivreAcesso,
  onSalvar,
  onFechar,
}: ModalEdicaoCautelaProps) {
  const [sucesso, setSucesso] = useState(false);

  function handleSalvar() {
    setSucesso(true);
    setTimeout(() => {
      setSucesso(false);
      onSalvar();
    }, 3000);
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[5]"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        onClick={onFechar}
      />

      {/* Modal de sucesso */}
      {sucesso && (
        <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl w-[420px] px-12 py-10 flex flex-col items-center gap-4 pointer-events-auto">
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
            <p className="text-[16px] font-bold text-black">
              Edição realizada com sucesso
            </p>
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {!sucesso && (
        <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div
            className="w-[500px] max-h-[calc(100vh-120px)] overflow-y-auto pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <DetalhesCautela
              cautela={cautela}
              onFechar={onFechar}
              variant="historico"
              titulo="Edição de cautela"
              cabecalho={
                <div className="flex items-center gap-4">
                  <p className="text-[13px] text-[#404040]">
                    O item será retornado?
                  </p>
                  <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-black"
                      checked={livreAcesso === "livre"}
                      onChange={() => onChangeLivreAcesso("livre")}
                    />
                    Livre trânsito
                  </label>
                  <label className="flex items-center gap-2 text-[13px] cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-black"
                      checked={livreAcesso === "entrada"}
                      onChange={() => onChangeLivreAcesso("entrada")}
                    />
                    Entrada única
                  </label>
                </div>
              }
              acoes={
                <div className="flex gap-3">
                  <button
                    onClick={handleSalvar}
                    className="flex-1 py-2.5 rounded-lg bg-[#3BB14A] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={onFechar}
                    className="flex-1 py-2.5 rounded-lg border border-gray-300 bg-white text-black text-sm font-medium hover:bg-gray-100 transition-colors"
                  >
                    Descartar
                  </button>
                </div>
              }
            />
          </div>
        </div>
      )}
    </>
  );
}
