import { useState, useEffect } from "react";

interface Setor {
  id: string;
  nome: string;
}

export default function CampoSetor() {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSetores() {
      try {
        const res = await fetch("http://seu-backend.com/api/setores");
        const data = await res.json();
        setSetores(data);
      } catch (err) {
        console.error("Erro ao carregar setores", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSetores();
  }, []);

  return (
    <div>
      <label className="block text-nowrap font-medium text-black">Setor</label>
      <select
        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
        defaultValue=""
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
    </div>
  );
}
