import { CardCautelaRecebida } from "./CardCautelaRecebida";
import { HistoricoLista } from "./HistoricoLista";
import { AbaSaida } from "./AbaSaida";
import { type CautelaComDecisao } from "./Tabela";
import { type StatusCautela } from "../data/cautelaTypes";

export function MenuLista({
  cautelas,
  recebidas,
  historico,
  abaAtivaMobile,
  onAbaChange,
  livreAcesso,
  onLivreAcessoChange,
  onTipoAcessoChange,
  onClickCard,
  onClickHistorico,
  onAprovar,
  onDescartar,
  statusHistorico,
  mostrarBolinhaGestor,
}: {
  cautelas: CautelaComDecisao[];
  recebidas: CautelaComDecisao[];
  historico: CautelaComDecisao[];
  abaAtivaMobile: "solicitadas" | "emSaida";
  onAbaChange: (aba: "solicitadas" | "emSaida") => void;
  livreAcesso: "livre" | "entrada";
  onLivreAcessoChange: (v: "livre" | "entrada") => void;
  onTipoAcessoChange: (c: CautelaComDecisao, v: "livre" | "entrada") => void;
  onClickCard: (
    c: CautelaComDecisao,
    origem: "recebidas" | "historico",
  ) => void;
  onClickHistorico: (c: CautelaComDecisao) => void;
  onAprovar: (id: string) => void;
  onDescartar: (id: string) => void;
  statusHistorico: (c: CautelaComDecisao) => StatusCautela;
  mostrarBolinhaGestor: boolean;
}) {
  return (
    <>
      <div className="relative mx-3 mt-20 h-[56px] flex-shrink-0">
        {/* Aba Em saída */}
        <button
          onClick={() => onAbaChange("emSaida")}
          className={`w-full h-[56px] text-[16px] rounded-t-lg transition-all relative ${
            abaAtivaMobile === "emSaida"
              ? "bg-[#22592A] text-white font-bold"
              : "bg-[#C4EEC9] text-[#2B8E37]"
          }`}
        >
          <div
            className="w-full h-full flex items-center justify-center gap-2"
            style={{ paddingLeft: "50%" }}
          >
            <span
              style={{ fontWeight: abaAtivaMobile === "emSaida" ? 600 : 400 }}
            >
              Em saída
            </span>
            <div className="relative">
              <div className="min-w-[26px] h-[26px] px-1 rounded-full bg-[#0E9F6E] flex items-center justify-center text-white text-[13px] font-bold">
                {cautelas.filter((c) => c.status === "Saída Autorizada")
                  .length > 9
                  ? "9+"
                  : cautelas.filter((c) => c.status === "Saída Autorizada")
                      .length}
              </div>
              {cautelas.some((c) => c.status === "Saída Autorizada") && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
              )}
            </div>
          </div>
        </button>

        {/* Aba Solicitadas */}
        <button
          onClick={() => onAbaChange("solicitadas")}
          className={`absolute top-0 left-0 w-[50%] h-[56px] text-[16px] rounded-t-lg transition-all flex items-center justify-center gap-2 ${
            abaAtivaMobile === "solicitadas"
              ? "bg-[#22592A] text-white"
              : "bg-[#C4EEC9] text-[#22592A]"
          }`}
        >
          <span
            style={{ fontWeight: abaAtivaMobile === "solicitadas" ? 600 : 400 }}
          >
            Solicitadas
          </span>
          <div className="relative">
            <div className="min-w-[26px] h-[26px] px-1 rounded-full bg-[#0E9F6E] flex items-center justify-center text-white text-[13px] font-bold">
              {recebidas.length > 9 ? "9+" : recebidas.length}
            </div>
            {mostrarBolinhaGestor && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </div>
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="mx-3 bg-[#E5E7EB] rounded-b-lg border border-[#E5E7EB]">
          {abaAtivaMobile === "solicitadas" && (
            <div className="py-2 px-3">
              {recebidas.length === 0 ? (
                <p className="text-[13px] text-[#6B7280] text-center mt-6 py-4">
                  Nenhuma cautela pendente.
                </p>
              ) : (
                recebidas.map((c, i) => (
                  <CardCautelaRecebida
                    key={c.id}
                    cautela={c}
                    index={i}
                    isNaoLida={c.badgeGestor === "NOVA_CAUTELA_SOLICITADA"}
                    isMobile={true}
                    livreAcesso={livreAcesso}
                    onLivreAcessoChange={onLivreAcessoChange}
                    onClick={() => onClickCard(c, "recebidas")}
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
          )}

          {abaAtivaMobile === "emSaida" && (
            <AbaSaida
              cautelas={cautelas}
              historico={historico}
              livreAcesso={livreAcesso}
              onLivreAcessoChange={onLivreAcessoChange}
              onClickCard={(c) => onClickCard(c, "historico")}
              onTipoAcessoChange={onTipoAcessoChange}
              onClickHistorico={onClickHistorico}
              onAprovar={onAprovar}
              onDescartar={onDescartar}
              statusHistorico={statusHistorico}
            />
          )}
        </div>
      </div>
    </>
  );
}
