import type { Cautela } from "../data/cautelaTypes";

export function CautelaPrint({ cautela }: { cautela: Cautela | null }) {
  if (!cautela) return null;
  const [data = "—", hora = "—"] = cautela.data?.split(", ") ?? [];
  const titulo =
    cautela.status === "Reprovado"
      ? "REPROVADA"
      : cautela.status === "Encerrada"
        ? "ENCERRADA"
        : "APROVADA";
  const responsavelLabel =
    cautela.status === "Reprovado" ? "Reprovado por" : "Aprovado por";

  return (
    <div className="cautela-print-area">
      <div className="cautela-print-card">
        <h1>{titulo}</h1>
        <p className="print-label">Id da Cautela:</p>
        <p className="print-value">{cautela.customId}</p>

        <div className="print-grid">
          <div>
            <p className="print-label">Data da solicitação</p>
            <p className="print-value">{data}</p>
          </div>
          <div>
            <p className="print-label">Hora da solicitação</p>
            <p className="print-value">{hora}</p>
          </div>
        </div>

        <p className="print-label">Setor</p>
        <p className="print-value">{cautela.setorId || "-"}</p>
        <p className="print-label">Proprietário:</p>
        <p className="print-value">{cautela.visitante || "-"}</p>
        <p className="print-label">Documento/Matrícula</p>
        <p className="print-value">{cautela.documento || "-"}</p>
        <p className="print-label">Email</p>
        <p className="print-value">{cautela.proprietarioEmail || "-"}</p>
        <p className="print-label">Empresa</p>
        <p className="print-value">{cautela.empresa || "-"}</p>
        <p className="print-label">{responsavelLabel}</p>
        <p className="print-value">{cautela.gestor || "-"}</p>

        {cautela.status === "Reprovado" && cautela.motivoNegativa && (
          <>
            <p className="print-label">Justificativa</p>
            <p className="print-value">{cautela.motivoNegativa}</p>
          </>
        )}

        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {cautela.equipamentos.map((item, index) => (
              <tr key={`${item.descricao}-${index}`}>
                <td>{item.descricao}</td>
                <td>{item.quantidade ?? 1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
