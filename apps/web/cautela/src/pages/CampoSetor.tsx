import { useState, useEffect } from "react";

interface Setor {
  id: string;
  numeroSetor: number;
  nome: string;
  gestorId: string;
  ativo: boolean;
}

interface Props {
  onSetorChange: (gestorId: string) => void;
}

const mockSetores: Setor[] = [
  {
    id: "1",
    numeroSetor: 1,
    nome: "TI",
    gestorId: "gestor-uuid-1",
    ativo: true,
  },
  {
    id: "2",
    numeroSetor: 2,
    nome: "RH",
    gestorId: "gestor-uuid-2",
    ativo: true,
  },
  {
    id: "3",
    numeroSetor: 3,
    nome: "Financeiro",
    gestorId: "gestor-uuid-3",
    ativo: true,
  },
  {
    id: "4",
    numeroSetor: 4,
    nome: "Operações",
    gestorId: "gestor-uuid-4",
    ativo: true,
  },
  {
    id: "5",
    numeroSetor: 5,
    nome: "Segurança",
    gestorId: "gestor-uuid-5",
    ativo: true,
  },
];

export default function CampoSetor({ onSetorChange }: Props) {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSetores() {
      try {
        const res = await fetch("http://seu-backend.com/api/setores");
        if (!res.ok) throw new Error("Falha na requisição");
        const data: Setor[] = await res.json();
        setSetores(data.filter((s) => s.ativo));
      } catch {
        setSetores(mockSetores);
      } finally {
        setLoading(false);
      }
    }
    fetchSetores();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const setor = setores.find((s) => s.id === e.target.value);
    if (setor) onSetorChange(setor.gestorId);
  }

  return (
    <div>
      <label className="block font-medium text-black mb-1">Setor</label>
      <div className="relative">
        <select
          defaultValue=""
          disabled={loading}
          onChange={handleChange}
          className="w-full appearance-none border-2 border-[#D4D4D4] rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-600 focus:outline-none pr-10 text-[#404040] cursor-pointer disabled:opacity-50"
        >
          <option value="" disabled>
            {loading ? "Carregando setores..." : "Selecione um setor"}
          </option>
          {setores.map((setor) => (
            <option key={setor.id} value={setor.id}>
              {setor.nome}
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
    </div>
  );
}
