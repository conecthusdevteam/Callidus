import { useState, useEffect } from "react";

interface Setor {
  id: string;
  nome: string;
}

// Mock enquanto não tem backend
const mockSetores: Setor[] = [
  { id: "1", nome: "TI" },
  { id: "2", nome: "RH" },
  { id: "3", nome: "Financeiro" },
  { id: "4", nome: "Operações" },
  { id: "5", nome: "Segurança" },
];

export default function CampoSetor() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSetores() {
      try {
        const res = await fetch("http://seu-backend.com/api/setores");
        const data = await res.json();
        setSetores(data);
      } catch {
        // fallback para mock enquanto não tem backend
        setSetores(mockSetores);
      } finally {
        setLoading(false);
      }
    }
    fetchSetores();
  }, []);

  return (
    <div>
      <label className="block font-medium text-black mb-1">Setor</label>

      <div className="relative">
        <select
          defaultValue=""
          disabled={loading}
          className="w-full appearance-none border-2 border-[#D4D4D4] rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-600 focus:outline-none pr-10 text-[#404040] cursor-pointer disabled:opacity-50"
        >
          <option value="" disabled style={{ color: "#969696" }}>
            {loading ? "Carregando setores..." : "Person name A"}
          </option>
          {setores.map((setor) => (
            <option key={setor.id} value={setor.id}>
              {setor.nome}
            </option>
          ))}
        </select>

        {/* Ícone chevron customizado */}
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
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
