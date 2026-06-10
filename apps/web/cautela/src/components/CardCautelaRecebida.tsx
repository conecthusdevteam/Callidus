import { AvatarStatus } from "../components/AvatarStatus";
import { BadgeStatus } from "../components/BadgeStatus";
import { type Cautela, type StatusCautela } from "../data/cautelaTypes";
import vector from "../assets/Vector.svg";

interface CautelaComDecisao extends Cautela {
  decisaoLocal?: "aprovado" | "reprovado";
  livreAcesso?: "livre" | "entrada";
}

export function CardCautelaRecebida({
  cautela,
  onClick,
  onAprovar,
  onDescartar,
  isNaoLida,
  isMobile = false,
  livreAcesso,
  onLivreAcessoChange,
}: {
  cautela: CautelaComDecisao;
  index: number;
  isNaoLida: boolean;
  onClick: () => void;
  onAprovar: (id: string) => void;
  onDescartar: (id: string) => void;
  isMobile?: boolean;
  livreAcesso?: "livre" | "entrada";
  onLivreAcessoChange?: (valor: "livre" | "entrada") => void;
}) {
  const isAtencao = cautela.status === "Saída Autorizada";
  const status = cautela.status as StatusCautela;

  if (isMobile) {
    return (
      <div
        onClick={onClick}
        className={`rounded-[8px] border cursor-pointer mb-3 overflow-hidden ${
          isAtencao
            ? "border-red-300 bg-[#FFF5F5]"
            : isNaoLida
              ? "border-[#E5C97E] bg-[#FFFDE7]"
              : "border-[#E5C97E] bg-white"
        }`}
      >
        {/* Tracker */}
        <div className="px-4 pt-4 pb-4">
          {(() => {
            const progresso = [
              {
                label: "Em aprovação",
                data: cautela.data,
                complete: true,
              },
              {
                label:
                  cautela.status === "Reprovado" ? "Reprovado" : "Em validação",
                data:
                  cautela.status === "Reprovado"
                    ? cautela.reprovadoEm
                    : cautela.aprovadoEm,
                complete:
                  cautela.status !== "Em análise" ||
                  cautela.etapaFluxo !== "SOLICITADA",
              },
              {
                label:
                  cautela.status === "Encerrada"
                    ? "Encerrada"
                    : cautela.status === "Saída Autorizada"
                      ? "Saída Autorizada"
                      : "Ativa",
                data: cautela.entradaValidadaEm,
                complete:
                  (cautela.status === "Aprovado" &&
                    cautela.etapaFluxo !== "APROVADA_PELO_GESTOR") ||
                  cautela.status === "Saída Autorizada" ||
                  cautela.status === "Encerrada",
              },
            ];

            return (
              <>
                {/* Labels */}
                <div className="relative pt-2">
                  {/* Labels posicionados sobre as bolinhas */}
                  <div className="relative h-4 mb-4">
                    <span
                      className={`absolute left-0 text-[11px] font-normal ${progresso[0].complete ? "text-[#000000]" : "text-[#000000]"}`}
                    >
                      {progresso[0].label}
                    </span>
                    <span
                      className={`absolute left-1/2 -translate-x-1/2 text-[11px] font-normal text-center ${progresso[1].complete ? "text-[#000000]" : "text-[#000000]"}`}
                    >
                      {progresso[1].label}
                    </span>
                    <span
                      className={`absolute right-0 text-[11px] font-normal ${progresso[2].complete ? "text-[#000000]" : "text-[#000000]"}`}
                    >
                      {progresso[2].label}
                    </span>
                  </div>

                  {/* Barra + bolinhas */}
                  <div className="relative h-[4px] bg-[#D1D5DB] rounded-full mx-2 mt-1">
                    <div
                      className="absolute left-0 top-0 h-full bg-[#2B8E37] rounded-full transition-all"
                      style={{
                        width: progresso[2].complete
                          ? "100%"
                          : progresso[1].complete
                            ? "calc(50% + 8px)"
                            : "8%",
                      }}
                    />
                    {progresso.map((item, index) => (
                      <div
                        key={item.label}
                        className={`absolute -top-[10px] w-6 h-6 rounded-full shadow-sm ${
                          item.complete ? "bg-[#2B8E37]" : "bg-[#D1D5DB]"
                        }`}
                        style={{
                          left:
                            index === 0 ? "0%" : index === 1 ? "50%" : "100%",
                          transform: "translateX(-50%)",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-[#0A0A0A] mt-3">
                    {progresso.map((item, index) => (
                      <span
                        key={item.label}
                        className={
                          index === 0
                            ? "text-left"
                            : index === 1
                              ? "text-center"
                              : "text-right"
                        }
                      >
                        {item.data || "00/00/0000 às"}
                        {!item.data && (
                          <>
                            <br />
                            00:00h
                          </>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Banner */}
        <div className="px-4 mb-3">
          <span
            className={`w-full block text-center px-3 py-1.5 rounded-lg text-[13px] font-bold ${
              isAtencao
                ? "bg-red-100 border border-red-300 text-red-600"
                : "bg-[#FCE96A] text-[#111827]"
            }`}
          >
            {isAtencao
              ? "Atenção - Solicitação de saída"
              : "Nova cautela solicitada"}
          </span>
        </div>

        {/* Nome + badge */}
        <div className="px-4 flex items-center gap-2 mb-2">
          <div className="w-12 h-12 rounded-full bg-[#FCE96A] flex items-center justify-center flex-shrink-0">
            <img src={vector} alt="Dashboard" className="h-6 w-6" />
          </div>
          <p className="text-[14px] font-bold text-[#404040] leading-tight flex-1 min-w-0">
            {cautela.visitante || "Nome do solicitante"}
          </p>
          <div className="flex-shrink-0">
            <BadgeStatus status={isAtencao ? "Aprovado" : "Em análise"} />
          </div>
        </div>

        {/* Data e Setor */}
        <div className="px-4 mb-1">
          <p className="text-[14px] text-[#404040]">
            Data: {cautela.data || "00/00/0000"}
          </p>
        </div>
        <div className="px-4 mb-3">
          <p className="text-[14px] text-[#404040]">
            Setor:{" "}
            <span className="font-bold uppercase">
              {cautela.setorId || "—"}
            </span>
          </p>
        </div>

        <hr className="border-[#000000] mx-4 mb-3" />

        {/* Cautelados */}
        <div className="px-4 mb-3">
          <p className="text-[14px] font-medium text-[#404040] mb-1">
            Cautelados:
          </p>
          <ul className="space-y-0.5">
            {cautela.equipamentos.slice(0, 3).map((eq, i) => (
              <li
                key={i}
                className="text-[14px] text-[#404040] flex items-start gap-1"
              >
                <span>•</span>
                {eq.descricao} - {eq.quantidade ?? 1}
              </li>
            ))}
            {cautela.equipamentos.length > 3 && (
              <li className="text-[11px] text-[#9CA3AF]">
                +{cautela.equipamentos.length - 3} item(ns)
              </li>
            )}
          </ul>
        </div>

        {/* Livre acesso */}
        <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-[13px] text-[#404040] mb-2">
            Esta cautela tem livre acesso?
          </p>
          <div className="flex gap-8 mb-4">
            <label className="flex items-center gap-8 text-[14px] text-[#404040] cursor-pointer">
              <input
                type="checkbox"
                checked={livreAcesso === "livre"}
                onChange={() => onLivreAcessoChange?.("livre")}
                className="w-4 h-4 rounded accent-black"
              />
              Sim
            </label>
            <label className="flex items-center gap-8 text-[14px] text-[#404040] cursor-pointer">
              <input
                type="checkbox"
                checked={livreAcesso === "entrada"}
                onChange={() => onLivreAcessoChange?.("entrada")}
                className="w-4 h-4 rounded accent-black"
              />
              Não
            </label>
          </div>

          {/* Botões só aparecem quando NÃO é saída autorizada */}
          {!isAtencao && (
            <>
              <button
                onClick={() => onAprovar(cautela.id)}
                className="w-full py-3 rounded-lg bg-[#111827] text-white text-[14px] font-semibold mb-2"
              >
                Aprovar entrada
              </button>
              <button
                onClick={() => onDescartar(cautela.id)}
                className="w-full py-2 text-[#737373] bg-[#F5F5F5] text-[14px] font-medium"
              >
                Reprovar
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ══ DESKTOP ══
  return (
    <div className="flex justify-center">
      <div
        onClick={onClick}
        className={`rounded-[5px] p-4 cursor-pointer transition-all hover:shadow-md mb-3 w-[385px] min-h-[369px] border flex flex-col gap-2 ${
          isAtencao
            ? "border-red-300 bg-[#FFF5F5]"
            : isNaoLida
              ? "border-amber-300 bg-[#FFFBEB]"
              : "border-amber-200 bg-white"
        }`}
      >
        {/* Banner */}
        <div className="flex justify-center mb-3">
          <span
            className={`w-full text-center px-3 py-1.5 rounded-lg text-[13px] font-bold tracking-wide font-[Geist] ${
              isAtencao
                ? "bg-red-100 border border-red-300 text-red-600"
                : "bg-[#FCE96A] text-[#111827]"
            }`}
          >
            {isAtencao
              ? "Atenção - Solicitação de saída"
              : "Nova cautela solicitada"}
          </span>
        </div>

        {/* Nome + Badge */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <AvatarStatus status={status} />
            <p className="text-[14px] font-bold leading-tight text-[#404040] break-words text-left font-[Geist]">
              {cautela.visitante || "Nome do solicitante"}
            </p>
          </div>
          <div className="flex-shrink-0 mt-1 font-[Geist]">
            <BadgeStatus status={isAtencao ? "Aprovado" : "Em análise"} />
          </div>
        </div>

        {/* Data e Setor */}
        <p className="text-[14px] text-[#404040] mt-1 font-[Geist]">
          Data: {cautela.data || "00/00/0000"}
        </p>
        <p className="text-[14px] text-[#404040] mt-0.5 font-[Geist]">
          Setor: <span className="font-bold">{cautela.setorId || "—"}</span>
        </p>

        <hr className="border-black my-3" />

        {/* Cautelados */}
        <p className="text-[14px] font-medium text-[#404040] mb-1 font-[Geist]">
          Cautelados:
        </p>
        <ul className="mb-4 space-y-0.5 font-[Geist]">
          {cautela.equipamentos.slice(0, 3).map((eq, i) => (
            <li
              key={i}
              className="text-[14px] text-[#404040] flex items-start gap-1 font-[Geist]"
            >
              <span>•</span>
              {eq.descricao} - {eq.quantidade ?? 1}
            </li>
          ))}
          {cautela.equipamentos.length > 3 && (
            <li className="text-[11px] text-[#9CA3AF] font-[Geist]">
              +{cautela.equipamentos.length - 3} item(ns)
            </li>
          )}
        </ul>

        {/* Botões */}
        <div
          className="flex items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {!isAtencao ? (
            <div className="flex gap-2">
              <button
                onClick={() => onAprovar(cautela.id)}
                className="px-3 py-2 rounded-lg bg-[#3BB14A] text-white text-[14px] font-semibold hover:bg-[#22592A] transition-colors"
              >
                Aprovar
              </button>
              <button
                onClick={() => onDescartar(cautela.id)}
                className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-black text-[14px] font-medium hover:bg-gray-100 transition-colors"
              >
                Reprovar
              </button>
            </div>
          ) : (
            <div />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="h-8 px-2 py-1 rounded-lg bg-gray-100 text-[#171717] text-[12px] font-medium leading-[16px] whitespace-nowrap hover:underline"
          >
            Ver detalhes
          </button>
        </div>
      </div>
    </div>
  );
}
