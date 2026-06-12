import { CardCautelaRecebida } from "./CardCautelaRecebida";
import { HistoricoLista } from "./HistoricoLista";
import { type CautelaComDecisao } from "./Tabela";
import { type StatusCautela } from "../data/cautelaTypes";

export function AbaSaida({
  cautelas,
  historico,
  livreAcesso,
  onTipoAcessoChange,
  onClickCard,
  onClickHistorico,
  onAprovar,
  onDescartar,
  statusHistorico,
}: {
  cautelas: CautelaComDecisao[];
  historico: CautelaComDecisao[];
  livreAcesso: "livre" | "entrada";
  onLivreAcessoChange: (v: "livre" | "entrada") => void;
  onTipoAcessoChange: (c: CautelaComDecisao, v: "livre" | "entrada") => void;
  onClickCard: (c: CautelaComDecisao) => void;
  onClickHistorico: (c: CautelaComDecisao) => void;
  onAprovar: (id: string) => void;
  onDescartar: (id: string) => void;
  statusHistorico: (c: CautelaComDecisao) => StatusCautela;
}) {
  const emSaida = cautelas.filter((c) => c.status === "Saída Autorizada");

  return (
    <div className="py-2 px-3">
      {emSaida.length === 0 ? (
        <p className="text-[13px] text-[#6B7280] text-center mt-6 py-4">
          Nenhuma saída pendente.
        </p>
      ) : (
        emSaida.map((c, i) => (
          <CardCautelaRecebida
            key={c.id}
            cautela={c}
            index={i}
            isNaoLida={false}
            isMobile={true}
            livreAcesso={livreAcesso}
            onLivreAcessoChange={(v) => onTipoAcessoChange(c, v)}
            onClick={() => onClickCard(c)}
            onAprovar={onAprovar}
            onDescartar={onDescartar}
          />
        ))
      )}

      <HistoricoLista
        historico={historico}
        statusHistorico={statusHistorico}
        onClickLinha={onClickHistorico}
      />
    </div>
  );
}
