import { useCallback, useEffect, useRef, useState } from "react";
import type { Cautela, StatusCautela } from "../data/cautelaTypes";
import { useAuth } from "../context/AuthContext";
import { createCautela, getCautelas, closeCautela } from "../lib/api";
import FormularioCautela, {
  type FieldErrors,
} from "../components/FormularioCautela";
import { ModalEncerrada } from "../components/ModalGestor";
import { useLocation } from "react-router-dom";

// ─── Avatares ─────────────────────────────────────────────────────────────────

function AvatarAnalise() {
  return (
    <div className="w-12 h-12 rounded-full bg-[#FCE96A] flex items-center justify-center flex-shrink-0">
      <svg
        className="w-7 h-7 text-black"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );
}

function AvatarAtencao() {
  return (
    <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-400 flex items-center justify-center flex-shrink-0">
      <svg
        className="w-6 h-6 text-amber-600"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
    </div>
  );
}

function AvatarAprovado() {
  return (
    <div className="w-12 h-12 rounded-full bg-[#D1FAE5] border border-[#31C48D] flex items-center justify-center flex-shrink-0">
      <svg
        className="w-6 h-6 text-[#2B8E37]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );
}

function AvatarReprovado() {
  return (
    <div className="w-12 h-12 rounded-full bg-[#FEE2E2] border border-[#F05252] flex items-center justify-center flex-shrink-0">
      <svg
        className="w-6 h-6 text-[#E02424]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );
}

function AvatarEncerrada() {
  return (
    <div className="w-12 h-12 rounded-full bg-[#F4F4F4] border border-[#A3A3A3] flex items-center justify-center flex-shrink-0">
      <svg
        className="w-6 h-6 text-[#525252]"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function BadgeAnalise() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium bg-[#FCE96A] text-[#111827] border border-[#FACA15]">
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" strokeWidth="2" />
        <path d="M12 8v5" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="0.8" fill="currentColor" stroke="none" />
      </svg>
      Em análise
    </span>
  );
}

function BadgeAtencao() {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-medium bg-amber-100 text-amber-800 border border-amber-400">
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        Atenção
      </span>
      <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-[13px] font-medium bg-amber-400 text-amber-900">
        Ação necessária
      </span>
    </div>
  );
}

function BadgeAprovado() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-medium bg-[#BCF0DA] text-[#065F46] border border-[#31C48D]">
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Aprovado
    </span>
  );
}

function BadgeReprovado() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-medium bg-[#FBD5D5] text-[#9B1C1C] border border-[#F05252]">
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      Reprovado
    </span>
  );
}

function BadgeEncerrada() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[13px] font-medium bg-[#F4F4F4] text-[#525252] border border-[#A3A3A3]">
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      Encerrada
    </span>
  );
}

// ─── Card de cautela ──────────────────────────────────────────────────────────

function CardCautelaPortaria({
  cautela,
  isNaoLida,
  onClick,
}: {
  cautela: Cautela;
  isNaoLida: boolean;
  onClick: () => void;
}) {
  const status = cautela.status as StatusCautela;

  const avatar =
    status === "Saída Autorizada" ? (
      <AvatarAtencao />
    ) : status === "Aprovado" ? (
      <AvatarAprovado />
    ) : status === "Reprovado" ? (
      <AvatarReprovado />
    ) : status === "Encerrada" ? (
      <AvatarEncerrada />
    ) : (
      <AvatarAnalise />
    );

  const badge =
    status === "Saída Autorizada" ? (
      <BadgeAtencao />
    ) : status === "Aprovado" ? (
      <BadgeAprovado />
    ) : status === "Reprovado" ? (
      <BadgeReprovado />
    ) : status === "Encerrada" ? (
      <BadgeEncerrada />
    ) : (
      <BadgeAnalise />
    );

  const borderClass = isNaoLida
    ? "border-2 border-amber-400 bg-[#FFFBEB]"
    : status === "Saída Autorizada"
      ? "border border-amber-300 bg-amber-50"
      : "border border-[#D1D5DB] bg-white";

  return (
    <div
      onClick={onClick}
      className={`rounded-lg p-5 cursor-pointer transition-all hover:shadow-md mb-3 ${borderClass}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {avatar}
          <p className="text-[18px] font-bold leading-tight text-[#404040]">
            {cautela.visitante || "Nome do proprietário"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 mt-1">
          {badge}
          {isNaoLida && (
            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold bg-[#FCE96A] text-black mt-0.5">
              Nova
            </span>
          )}
        </div>
      </div>

      <p className="text-[15px] text-[#404040] mt-1">
        Data: {cautela.data || "00/00/0000"}
      </p>
      <p className="text-[15px] text-[#404040] mt-0.5">
        Ciente:{" "}
        <span className="font-bold">
          {(cautela.gestor || "").toUpperCase()}
        </span>
      </p>

      <div className="border-t border-black my-3" />

      <p className="text-[14px] font-medium text-[#404040] mb-1">Cautelados:</p>
      <ul className="space-y-0.5 mb-3">
        {cautela.equipamentos?.slice(0, 3).map((eq, i) => (
          <li
            key={i}
            className="text-[14px] text-[#404040] flex items-center gap-1.5"
          >
            <span className="text-[#6B7280]">•</span>
            {eq.descricao} - {eq.quantidade ?? 1}
          </li>
        ))}
        {(cautela.equipamentos?.length ?? 0) > 3 && (
          <li className="text-[12px] text-[#9CA3AF]">
            +{cautela.equipamentos.length - 3} item(ns)
          </li>
        )}
      </ul>

      <div className="flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="text-[13px] px-4 py-2 bg-gray-100 rounded-lg text-[#171717] font-medium hover:underline"
        >
          Ver detalhes
        </button>
      </div>
    </div>
  );
}

function validarDocumento(documento: string) {
  const valor = documento.replace(/\D/g, "");
  if (valor.length === 11) return true;
  if (valor.length >= 7 && valor.length <= 14) return true;
  return false;
}

// ─── Painel de detalhes ───────────────────────────────────────────────────────

function DetalhesCautelaPortaria({
  cautela,
  onFechar,
  onLiberarSaida,
}: {
  cautela: Cautela;
  onFechar: () => void;
  onLiberarSaida?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-4">
          {cautela.status === "Saída Autorizada" ? (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-amber-100 border border-amber-400 text-amber-800 text-[13px] font-medium">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Atenção — Ação necessária
            </div>
          ) : cautela.status === "Aprovado" ? (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#BCF0DA] border border-[#31C48D] text-[#065F46] text-[13px] font-medium">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Aprovado {cautela.aprovadoEm ? `em ${cautela.aprovadoEm}` : ""}
            </div>
          ) : cautela.status === "Encerrada" ? (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#F4F4F4] border border-[#A3A3A3] text-[#525252] text-[13px] font-medium">
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Encerrada {cautela.encerradaEm ? `em ${cautela.encerradaEm}` : ""}
            </div>
          ) : cautela.status === "Reprovado" ? (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#FBD5D5] border border-[#F05252] text-[#9B1C1C] text-[13px] font-medium">
              Reprovado {cautela.reprovadoEm ? `em ${cautela.reprovadoEm}` : ""}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#FCE96A] border border-[#FACA15] text-[#111827] text-[13px] font-medium">
              Em análise
            </div>
          )}
        </div>

        {cautela.status === "Reprovado" && cautela.motivoNegativa && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-700 mb-1">
              Justificativa:
            </p>
            <p className="text-sm text-red-700">{cautela.motivoNegativa}</p>
          </div>
        )}

        <div className="mb-3">
          <p className="text-sm font-bold text-black">Id da cautela</p>
          <p className="text-sm text-gray-700 break-all">{cautela.id}</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-bold text-black">Setor:</p>
          <p className="text-sm text-gray-700">{cautela.empresa || "-"}</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-bold text-black">Data e hora de entrada</p>
          <p className="text-sm text-gray-700">{cautela.data || "-"}</p>
        </div>
        <div className="mb-3">
          <p className="text-sm font-bold text-black">Proprietário</p>
          <p className="text-sm text-gray-700">{cautela.visitante || "-"}</p>
        </div>
        {cautela.proprietarioEmail && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black">
              E-mail do proprietário
            </p>
            <p className="text-sm text-gray-700">{cautela.proprietarioEmail}</p>
          </div>
        )}
        {cautela.validade && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black">Válido até:</p>
            <p className="text-sm text-gray-700">{cautela.validade}</p>
          </div>
        )}
        {cautela.aprovadoEm && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black">Aprovado em:</p>
            <p className="text-sm text-gray-700">{cautela.aprovadoEm}</p>
          </div>
        )}
        {cautela.status === "Encerrada" && cautela.encerradaEm && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black">
              Data e hora de saída:
            </p>
            <p className="text-sm text-gray-700">{cautela.encerradaEm}</p>
          </div>
        )}

        {cautela.equipamentos?.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-bold text-black mb-2">Cautelados:</p>
            <table className="w-full overflow-hidden rounded-lg">
              <thead>
                <tr style={{ backgroundColor: "#0E9F6E" }}>
                  <th className="px-4 py-2 text-left text-white text-sm font-bold">
                    Descrição
                  </th>
                  <th className="px-4 py-2 text-center text-white text-sm font-bold">
                    Quantidade
                  </th>
                </tr>
              </thead>
              <tbody>
                {cautela.equipamentos.map((eq, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 even:bg-[#F4F4F4]"
                  >
                    <td className="px-4 py-2 text-sm text-[#0A0A0A]">
                      {eq.descricao}
                    </td>
                    <td className="px-4 py-2 text-center text-sm text-[#0A0A0A]">
                      {eq.quantidade ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="px-6 pb-6 pt-2 flex flex-col gap-2">
        {cautela.status === "Saída Autorizada" && onLiberarSaida && (
          <button
            onClick={onLiberarSaida}
            className="w-full py-2.5 rounded-lg bg-[#F5F5F5] text-black text-sm font-semibold hover:bg-gray-300 transition-colors"
          >
            Liberar saída
          </button>
        )}
        <button
          onClick={onFechar}
          className="w-full py-2.5 rounded-lg bg-[#2B8E37] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors"
        >
          Fechar detalhes
        </button>
      </div>
    </div>
  );
}

// ─── Helpers de pesquisa ──────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string[]> = {
  "Em análise": ["em análise", "analise", "análise", "pendente"],
  Aprovado: ["aprovado", "aprovada"],
  Reprovado: ["reprovado", "reprovada", "negado", "recusado"],
  "Saída Autorizada": [
    "saída autorizada",
    "saida autorizada",
    "atenção",
    "atencao",
    "ação necessária",
    "acao necessaria",
  ],
  Encerrada: ["encerrada", "encerrado", "finalizada", "concluida"],
};

function matchesSearch(cautela: Cautela, term: string): boolean {
  if (!term.trim()) return true;
  const q = term.toLowerCase().trim();
  if (cautela.id.toLowerCase().includes(q)) return true;
  if (cautela.visitante?.toLowerCase().includes(q)) return true;
  if (cautela.gestor?.toLowerCase().includes(q)) return true;
  if (cautela.empresa?.toLowerCase().includes(q)) return true;
  const variants = STATUS_LABELS[cautela.status] ?? [];
  if (variants.some((v) => v.includes(q) || q.includes(v))) return true;
  return false;
}

const STATUS_RECEBIDOS: StatusCautela[] = [
  "Aprovado",
  "Reprovado",
  "Saída Autorizada",
  "Encerrada",
];

type Tab = "enviados" | "recebidos";

export default function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const canCreateCautela =
    user?.papel === "ADMIN" || user?.papel === "PORTARIA";

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const state = location.state as { cautelaSelecionada?: Cautela } | null;
    return state?.cautelaSelecionada ? "recebidos" : "enviados";
  });

  const [cautelaSelecionada, setCautelaSelecionada] = useState<Cautela | null>(
    () => {
      const state = location.state as { cautelaSelecionada?: Cautela } | null;
      if (state?.cautelaSelecionada) {
        window.history.replaceState({}, "");
        return state.cautelaSelecionada;
      }
      return null;
    },
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [documento, setDocumento] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState<string>("");
  const [items, setItems] = useState<
    { descricao: string; quantidade: number }[]
  >([]);
  const [retornado, setRetornado] = useState<null | boolean>(null);
  const [dataInicio] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState<string>("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [setorId, setSetorId] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [loadingCautelas, setLoadingCautelas] = useState(true);
  const [listError, setListError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState<number | null>(null);
  const [showItemDeletedModal, setShowItemDeletedModal] = useState(false);
  const [modalEncerrada, setModalEncerrada] = useState(false);

  const [cautelasLidas, setCautelasLidas] = useState<Set<string>>(new Set());
  const cautelasConhecidasRef = useRef<Map<string, string>>(new Map());

  const cautelasRef = useRef<Cautela[]>([]);
  const cautelaSelecionadaRef = useRef<Cautela | null>(null);

  useEffect(() => {
    cautelasRef.current = cautelas;
  }, [cautelas]);
  useEffect(() => {
    cautelaSelecionadaRef.current = cautelaSelecionada;
  }, [cautelaSelecionada]);

  const carregarCautelas = useCallback(async () => {
    try {
      const data = await getCautelas();

      const isPrimeiraCarrega = cautelasConhecidasRef.current.size === 0;

      if (!isPrimeiraCarrega) {
        data.forEach((c) => {
          if (STATUS_RECEBIDOS.includes(c.status as StatusCautela)) {
            const anterior = cautelasConhecidasRef.current.get(c.id);
            const isNova = anterior === undefined;
            const mudouStatus = anterior !== undefined && anterior !== c.status;
            if (isNova || mudouStatus) {
              setCautelasLidas((prev) => {
                const novo = new Set(prev);
                novo.delete(c.id);
                return novo;
              });
            }
          }
        });
      }

      cautelasConhecidasRef.current = new Map(
        data.map((c) => [c.id, c.status]),
      );

      setCautelas(data);

      const sel = cautelaSelecionadaRef.current;
      if (sel) {
        const atualizada = data.find((c) => c.id === sel.id);
        if (atualizada && atualizada.status !== sel.status)
          setCautelaSelecionada(atualizada);
      }
    } catch (error) {
      console.error("Erro ao carregar cautelas.", error);
      setCautelas([]);
      setListError(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as cautelas.",
      );
    } finally {
      setLoadingCautelas(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarCautelas();
    const interval = setInterval(() => void carregarCautelas(), 5000);
    return () => clearInterval(interval);
  }, [carregarCautelas]);

  useEffect(() => {
    function onSelecionar(e: Event) {
      const cautela = (e as CustomEvent<{ cautela: Cautela }>).detail.cautela;
      setCautelaSelecionada(cautela);
      setActiveTab("recebidos");
      setCautelasLidas((prev) => new Set([...prev, cautela.id]));
    }
    window.addEventListener("cautela-selecionar", onSelecionar);
    return () => window.removeEventListener("cautela-selecionar", onSelecionar);
  }, []);

  useEffect(() => {
    function onSearch(e: Event) {
      const term = (e as CustomEvent<{ term: string }>).detail.term;
      setSearchTerm(term);
      if (term.trim()) setActiveTab("recebidos");
    }
    window.addEventListener("cautela-search", onSearch);
    return () => window.removeEventListener("cautela-search", onSearch);
  }, []);

  function marcarComoLida(cautela: Cautela) {
    setCautelaSelecionada((prev) => (prev?.id === cautela.id ? null : cautela));
    if (STATUS_RECEBIDOS.includes(cautela.status as StatusCautela)) {
      setCautelasLidas((prev) => new Set([...prev, cautela.id]));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FieldErrors = {};
    setSubmitError("");
    if (!setorId) newErrors.setor = "Selecione um setor.";
    if (!nome.trim()) newErrors.nome = "O campo Proprietário é obrigatório.";
    if (!documento.trim())
      newErrors.documento = "O campo Documento é obrigatório.";
    if (!empresa.trim()) newErrors.empresa = "O campo Empresa é obrigatório.";
    const emailRegex = /^[A-Za-z0-9._%+-]+@(callidus|conecthus)\.org\.br$/i;
    if (!emailRegex.test(email))
      newErrors.email = "Use apenas e-mail institucional.";
    if (!validarDocumento(documento))
      newErrors.documento = "Informe um CPF ou identidade válida";
    if (items.length === 0) newErrors.items = "Adicione pelo menos um item.";
    if (retornado === null)
      newErrors.retornado = "Selecione se o item será retornado.";
    if (retornado === true && !dataFim)
      newErrors.dataFim = "Informe a data de retorno.";
    else if (retornado === true && dataFim.length < 10)
      newErrors.dataFim = "Data inválida.";
    const dataFimISO = dataFim
      ? dataFim.split("/").reverse().join("-")
      : undefined;
    setFieldErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setSubmitting(true);
      try {
        await createCautela({
          itens: items.map((i) => ({
            nomeItem: i.descricao,
            quantidade: i.quantidade,
          })),
          proprietarioEmail: email,
          proprietarioNome: nome,
          documentoProprietario: documento,
          empresa,
          retornoItem: retornado === true,
          setorId,
          validade: retornado ? dataFimISO : undefined,
        });
        await carregarCautelas();
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);
        handleCancel();
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Não foi possível enviar.",
        );
      } finally {
        setSubmitting(false);
      }
    }
  };

  function handleCancel() {
    setSetorId("");
    setNome("");
    setEmail("");
    setDocumento("");
    setEmpresa("");
    setDescricao("");
    setQuantidade("");
    setItems([]);
    setRetornado(null);
    setDataFim("");
    setFieldErrors({});
    setSubmitError("");
  }

  function confirmarExclusaoItem() {
    if (itemParaExcluir === null) return;
    setItems((prev) => prev.filter((_, i) => i !== itemParaExcluir));
    setItemParaExcluir(null);
    setShowItemDeletedModal(true);
    setTimeout(() => setShowItemDeletedModal(false), 3000);
  }

  async function handleConfirmarSaida() {
    if (!cautelaSelecionada) return;
    try {
      const encerrada = await closeCautela(cautelaSelecionada.id);
      setCautelas((prev) =>
        prev.map((c) => (c.id === encerrada.id ? encerrada : c)),
      );
      setCautelaSelecionada(encerrada);
    } catch (error) {
      console.error("Erro ao encerrar cautela.", error);
    }
    setModalEncerrada(true);
  }

  // ── Filtros e contagens ───────────────────────────────────────────────────

  const cautelasPorAba = cautelas.filter((c) => {
    if (activeTab === "enviados") return c.status === "Em análise";
    return STATUS_RECEBIDOS.includes(c.status as StatusCautela);
  });

  const pool = searchTerm.trim() ? cautelas : cautelasPorAba;
  const cautelasFiltradas = pool.filter((c) => matchesSearch(c, searchTerm));

  // Cautelas em Recebidos que ainda não foram lidas
  const cautelasNaoLidas = cautelas.filter(
    (c) =>
      STATUS_RECEBIDOS.includes(c.status as StatusCautela) &&
      !cautelasLidas.has(c.id),
  );
  const totalNaoLidas = cautelasNaoLidas.length;
  // Bolinha vermelha: há não lidas e o usuário não está na aba Recebidos
  const mostrarBolinha = totalNaoLidas > 0 && activeTab !== "recebidos";

  const formularioProps = {
    canCreateCautela,
    setorId,
    setSetorId,
    nome,
    setNome,
    email,
    setEmail,
    documento,
    setDocumento,
    empresa,
    setEmpresa,
    descricao,
    setDescricao,
    quantidade,
    setQuantidade,
    items,
    setItems,
    retornado,
    setRetornado,
    dataInicio,
    dataFim,
    setDataFim,
    fieldErrors,
    submitError,
    submitting,
    handleSubmit,
    setItemParaExcluir,
    onCancel: handleCancel,
  };

  const listaCards = (
    <div className="py-2 px-3">
      {loadingCautelas && cautelas.length === 0 && (
        <p className="text-[13px] text-[#6B7280] text-center mt-6 py-4">
          Carregando...
        </p>
      )}
      {listError && (
        <p className="text-[13px] text-red-500 text-center mt-6">{listError}</p>
      )}
      {!loadingCautelas && !listError && cautelasFiltradas.length === 0 && (
        <p className="text-[13px] text-[#6B7280] text-center mt-6 py-4">
          {searchTerm
            ? `Nenhum resultado para "${searchTerm}".`
            : "Nenhuma cautela encontrada."}
        </p>
      )}
      {cautelasFiltradas.map((cautela) => (
        <CardCautelaPortaria
          key={cautela.id}
          cautela={cautela}
          isNaoLida={
            STATUS_RECEBIDOS.includes(cautela.status as StatusCautela) &&
            !cautelasLidas.has(cautela.id)
          }
          onClick={() => marcarComoLida(cautela)}
        />
      ))}
    </div>
  );

  const painelDetalhes = cautelaSelecionada ? (
    <div className="absolute top-4 left-0 w-[380px] bg-white border border-gray-200 rounded-xl shadow-2xl z-10 max-h-[90%] overflow-y-auto">
      <DetalhesCautelaPortaria
        cautela={cautelaSelecionada}
        onFechar={() => setCautelaSelecionada(null)}
        onLiberarSaida={
          cautelaSelecionada.status === "Saída Autorizada"
            ? handleConfirmarSaida
            : undefined
        }
      />
    </div>
  ) : null;

  const abaRecebidos = (isMobile = false) => (
    <button
      onClick={() => {
        setActiveTab("recebidos");
        setCautelaSelecionada(null);
        setSearchTerm("");
      }}
      className={`${isMobile ? "w-full h-[56px] text-[16px]" : "w-full h-[68px] text-[18px]"} font-normal rounded-t${isMobile ? "-lg" : "-xl"} transition-all relative ${
        activeTab === "recebidos"
          ? "bg-[#22592A] text-white"
          : "bg-[#C4EEC9] text-[#2B8E37]"
      }`}
    >
      <div
        className="w-full h-full flex items-center justify-center gap-2"
        style={{ paddingLeft: "50%" }}
      >
        <span>Recebidos</span>
        {totalNaoLidas > 0 && (
          <div className="relative flex-shrink-0">
            <div
              className="min-w-[28px] h-[28px] px-1.5 rounded-full flex items-center justify-center text-white text-[13px] font-bold leading-none"
              style={{ backgroundColor: "#0E9F6E" }}
            >
              {totalNaoLidas > 9 ? "9+" : totalNaoLidas}
            </div>
            {mostrarBolinha && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
            )}
          </div>
        )}
      </div>
    </button>
  );

  const abaEnviados = (isMobile = false) => (
    <button
      onClick={() => {
        setActiveTab("enviados");
        setCautelaSelecionada(null);
        setSearchTerm("");
      }}
      className={`absolute top-0 left-0 w-[50%] ${isMobile ? "h-[56px] text-[16px]" : "h-[68px] text-[18px]"} font-bold rounded-tl${isMobile ? "-lg" : "-xl"} transition-all ${
        activeTab === "enviados"
          ? "bg-[#22592A] text-white"
          : "bg-[#C4EEC9] text-[#22592A]"
      }`}
    >
      Enviados
    </button>
  );

  return (
    <div className="min-h-screen md:h-screen pt-[60px] pl-0 md:pl-[70px] bg-[#F5F7F6] relative overflow-x-hidden md:overflow-hidden">
      {/* ══ DESKTOP ══ */}
      <div className="hidden md:flex h-[calc(100vh-60px)]">
        <div className="w-[560px] flex-shrink-0 px-8 pt-8 pb-4 flex flex-col h-full">
          <div
            className="flex flex-col h-full bg-white rounded-xl border border-[#E5E7EB] overflow-hidden"
            style={{ boxShadow: "4px 0 8px rgba(0,0,0,0.25)" }}
          >
            <div className="relative flex-shrink-0">
              {abaRecebidos()}
              {abaEnviados()}
            </div>
            <div className="flex-1 overflow-y-auto bg-[#E5E7EB]">
              {listaCards}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col items-center py-8 px-6 relative">
          {painelDetalhes}
          <div className="w-full max-w-[580px] text-center mb-6">
            <h1 className="text-[28px] font-bold text-black leading-snug">
              Cautela para equipamentos externos
            </h1>
            <p className="text-sm text-black mt-2">
              Esta cautela funciona para qualquer tipo de equipamento
              <br />
              eletroeletrônico que venha de terceiros que irão entrar e sair.
            </p>
            <h3 className="text-[18px] font-semibold text-black mt-1">
              Notebooks, Mouses, Teclados, Etc...
            </h3>
          </div>
          <div className="w-full max-w-[650px] bg-[#F2FBF3] rounded-sm shadow-sm border border-[#22592A] p-8">
            <FormularioCautela {...formularioProps} />
          </div>
        </div>
      </div>

      {/* ══ MOBILE ══ */}
      <div className="md:hidden flex flex-col pb-8">
        <div className="relative mx-3 mt-16">
          {abaRecebidos(true)}
          {abaEnviados(true)}
        </div>
        <div className="mx-3 bg-[#E5E7EB] rounded-b-xl border border-[#E5E7EB] mb-4 max-h-72 overflow-y-auto">
          {listaCards}
        </div>
        {cautelaSelecionada ? (
          <div className="px-3 w-full">
            <div className="bg-white border border-gray-300 rounded-lg">
              <DetalhesCautelaPortaria
                cautela={cautelaSelecionada}
                onFechar={() => setCautelaSelecionada(null)}
                onLiberarSaida={
                  cautelaSelecionada.status === "Saída Autorizada"
                    ? handleConfirmarSaida
                    : undefined
                }
              />
            </div>
          </div>
        ) : activeTab === "enviados" ? (
          <div className="px-3 w-full">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-black">
                Cautela para equipamentos externos
              </h1>
              <p className="text-xs text-black mt-1">
                Qualquer equipamento eletroeletrônico de terceiros.
              </p>
            </div>
            <div className="bg-[#F2FBF3] rounded-sm shadow-sm border border-[#22592A] p-4">
              <FormularioCautela {...formularioProps} />
            </div>
          </div>
        ) : (
          <div className="px-3 text-center">
            <p className="text-sm text-gray-500 mt-4">
              Selecione uma cautela para ver os detalhes.
            </p>
          </div>
        )}
      </div>

      {/* ══ MODAIS ══ */}
      {showModal && (
        <div
          className="fixed inset-0 md:left-[70px] flex items-center justify-center bg-black/20 backdrop-blur-sm z-30"
          style={{ top: "60px" }}
        >
          <div className="bg-white rounded-2xl shadow-xl px-12 py-10 flex flex-col items-center gap-4 min-w-[320px]">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ backgroundColor: "#EEF5EE" }}
            >
              <div className="w-9 h-9 rounded-full border-2 border-[#2B8E37] flex items-center justify-center">
                <svg
                  className="w-7 h-7 text-[#2B8E37]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <p className="text-base font-bold text-black text-center">
              Sua solicitação foi enviada ao gestor
            </p>
          </div>
        </div>
      )}

      {itemParaExcluir !== null && (
        <div
          className="fixed inset-0 md:left-[70px] flex items-center justify-center bg-black/20 backdrop-blur-sm z-30"
          style={{ top: "60px" }}
        >
          <div className="bg-white rounded-2xl shadow-xl px-14 py-10 flex flex-col items-center gap-4 min-w-[320px]">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#FEE2E2" }}
            >
              <svg
                className="w-5 h-5 text-red-500"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M3 6h18M9 6V4h6v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-base font-bold text-black text-center">
              Você deseja excluir este item?
            </p>
            <p className="text-xs text-[#404040] text-center">
              Os dados serão removidos permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
                className="px-4 py-2 rounded-lg bg-[#F5F5F5] text-[#171717] text-sm font-medium hover:bg-gray-300"
              >
                Não
              </button>
              <button
                type="button"
                onClick={confirmarExclusaoItem}
                className="px-4 py-2 rounded-lg bg-[#3BB14A] text-white text-sm font-medium hover:bg-[#2B8E37]"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {showItemDeletedModal && (
        <div
          className="fixed inset-0 md:left-[70px] flex items-center justify-center bg-black/20 backdrop-blur-sm z-30"
          style={{ top: "60px" }}
        >
          <div className="bg-white rounded-2xl shadow-xl px-12 py-10 flex flex-col items-center gap-4 min-w-[320px]">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: "#EEF5EE" }}
            >
              <div className="w-9 h-9 rounded-full border-2 border-[#2B8E37] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#2B8E37]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <p className="text-base font-bold text-black text-center">
              O item foi EXCLUÍDO com sucesso.
            </p>
          </div>
        </div>
      )}

      {modalEncerrada && (
        <ModalEncerrada onClose={() => setModalEncerrada(false)} />
      )}
    </div>
  );
}
