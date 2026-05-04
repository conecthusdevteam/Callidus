import { useState, useEffect, useRef } from "react";
import { getSectors } from "../lib/api";

interface Setor {
  id: string;
  numeroSetor: number;
  nome: string;
  gestorId: string;
  ativo: boolean;
}

interface Props {
  onSetorChange: (setorId: string) => void;
  value: string;
}

export default function CampoSetor({ onSetorChange, value }: Props) {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchSetores() {
      try {
        const data: Setor[] = await getSectors();
        setSetores(data.filter((s) => s.ativo));
      } catch (err) {
        console.error("Erro ao carregar setores.", err);
        setError("Nao foi possivel carregar os setores.");
        setSetores([]);
      } finally {
        setLoading(false);
      }
    }
    void fetchSetores();
  }, []);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setorSelecionado = setores.find((s) => s.id === value);

  function selecionar(setor: Setor) {
    onSetorChange(setor.id);
    setAberto(false);
  }

  return (
    <div ref={ref} className="relative">
      <label className="block font-medium text-black mb-1">Setor</label>

      {/* Botão */}
      <button
        type="button"
        disabled={loading}
        onClick={() => setAberto((prev) => !prev)}
        className="w-full border-2 border-[#D4D4D4] rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-600 focus:outline-none text-left flex items-center justify-between disabled:opacity-50"
      >
        <span className={setorSelecionado ? "text-[#404040]" : "text-gray-400"}>
          {loading
            ? "Carregando setores..."
            : setorSelecionado
              ? `${setorSelecionado.numeroSetor} - ${setorSelecionado.nome}`
              : "Selecione um setor"}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          className={`transition-transform flex-shrink-0 ${aberto ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9L12 15L18 9"
            stroke="#2B8E37"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Lista de opções */}
      {aberto && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
          <div
            className="px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              onSetorChange("");
              setAberto(false);
            }}
          >
            Selecione um setor
          </div>
          {setores.map((setor) => (
            <div
              key={setor.id}
              onClick={() => selecionar(setor)}
              className={`px-3 py-2 text-sm cursor-pointer ${
                value === setor.id
                  ? "bg-[#C4EEC9] font-medium"
                  : "text-[#404040]"
              }`}
            >
              {setor.numeroSetor} - {setor.nome}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
