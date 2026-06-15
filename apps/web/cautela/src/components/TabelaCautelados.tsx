import type { Equipamento } from "../data/cautelaTypes";

export function TabelaCautelados({
  equipamentos,
}: {
  equipamentos: Equipamento[];
}) {
  if (!equipamentos?.length) return null;

  return (
    <table className="w-full overflow-hidden">
      <thead>
        <tr style={{ backgroundColor: "#0E9F6E" }}>
          <th className="px-4 py-1 text-left text-white text-[14px] font-bold">
            Descrição
          </th>
          <th className="px-4 py-1 text-center text-white text-[14px]font-bold">
            Quantidade
          </th>
        </tr>
      </thead>
      <tbody>
        {equipamentos.map((eq, i) => (
          <tr
            key={i}
            className="border-b border-gray-100 odd:bg-white even:bg-[#F4F4F4]"
          >
            <td className="px-4 py-2 text-[14px] text-[#0A0A0A]">
              {eq.descricao}
            </td>
            <td className="px-4 py-2 text-center text-[14px] text-[#0A0A0A]">
              {eq.quantidade ?? "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ListaCautelados({
  equipamentos,
  max = 3,
}: {
  equipamentos: Equipamento[];
  max?: number;
}) {
  if (!equipamentos?.length) return null;
  const visiveis = equipamentos.slice(0, max);
  const extras = equipamentos.length - max;

  return (
    <ul className="space-y-0.5 mb-3">
      {visiveis.map((eq, i) => (
        <li
          key={i}
          className="text-[15px] text-[#404040] flex items-center gap-1.5"
        >
          <span className="text-[#6B7280]">•</span>
          {eq.descricao} - {eq.quantidade ?? 1}
        </li>
      ))}
      {extras > 0 && (
        <li className="text-[12px] text-[#9CA3AF]">+{extras} item(ns)</li>
      )}
    </ul>
  );
}
