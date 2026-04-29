import { useState, useEffect } from "react";
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
}

export default function CampoSetor({ onSetorChange, value }: Props) {
  const [setores, setSetores] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSetores() {
      try {
        const data: Setor[] = await getSectors();
        setSetores(data.filter((s) => s.ativo));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Falha ao carregar setores.",
        );
      } finally {
        setLoading(false);
      }
    }
    fetchSetores();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onSetorChange(e.target.value);
  }

  return (
    <div>
      <label className="block font-medium text-black mb-1">Setor</label>
      <div className="relative">
        <select
          value={value}
          disabled={loading}
          onChange={handleChange}
          className="w-full appearance-none border-2 border-[#D4D4D4] rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-600 focus:outline-none pr-10 text-[#404040] cursor-pointer disabled:opacity-50"
        >
          <option value="" disabled>
            {loading ? "Carregando setores..." : "Selecione um setor"}
          </option>
          {setores.map((setor) => (
            <option key={setor.id} value={setor.id}>
              {setor.numeroSetor} - {setor.nome}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9L12 15L18 9"
              stroke="#2B8E37"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
