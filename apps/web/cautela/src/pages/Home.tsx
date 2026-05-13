import { useCallback, useEffect, useRef, useState } from "react";
import type { Cautela, StatusCautela } from "../data/cautelaTypes";
import { useAuth } from "../context/AuthContext";
import { createCautela, getCautelas, closeCautela } from "../lib/api";
import FormularioCautela, {
  type FieldErrors,
} from "../components/FormularioCautela";
import { ModalEncerrada } from "../components/ModalGestor";
import { useLocation } from "react-router-dom";
import { AvatarStatus } from "../components/AvatarStatus";
import { BadgeStatus } from "../components/BadgeStatus";
import { BannerStatus, JustificativaBox } from "../components/BannerStatus";
import {
  TabelaCautelados,
  ListaCautelados,
} from "../components/TabelaCautelados";
import { matchesSearch, validarDocumento } from "../lib/cautelaUtils";

const STATUS_RECEBIDOS: StatusCautela[] = [
  "Aprovado",
  "Reprovado",
  "Saída Autorizada",
  "Encerrada",
];

type Tab = "enviados" | "recebidos";
type MobileView = "lista" | "detalhe";

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
          <AvatarStatus status={status} />

          <div>
            <p className="text-[18px] font-bold leading-tight text-[#404040]">
              {cautela.visitante || "Nome do proprietário"}
            </p>

            <p className="text-[15px] text-[#404040] mt-1">
              Data: {cautela.data || "00/00/0000"}
            </p>

            <p className="text-[15px] text-[#404040] mt-0.5">
              Ciente:{" "}
              <span className="font-bold">
                {(cautela.gestor || "").toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0 mt-1">
          <BadgeStatus status={status} />

          {isNaoLida && (
            <span className="inline-flex items-center rounded-lg px-2 py-0.5 text-[12px] font-semibold bg-[#FCE96A] text-black mt-0.5">
              Nova
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-black my-3" />

      <div className="flex justify-between items-end gap-4">
        <div className="flex-1">
          <p className="text-[14px] font-medium text-[#404040] mb-1">
            Cautelados:
          </p>

          <ListaCautelados equipamentos={cautela.equipamentos ?? []} max={3} />
        </div>

        <div className="flex-shrink-0">
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
    </div>
  );
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
          <BannerStatus cautela={cautela} />
        </div>
        {cautela.status === "Reprovado" && cautela.motivoNegativa && (
          <div className="mb-4">
            <JustificativaBox motivo={cautela.motivoNegativa} />
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
        <div className="mb-3">
          <p className="text-sm font-bold text-black mb-2">Cautelados:</p>
          <TabelaCautelados equipamentos={cautela.equipamentos ?? []} />
        </div>
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

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 md:left-[70px] flex items-center justify-center bg-black/20 backdrop-blur-sm z-30"
      style={{ top: "60px" }}
    >
      {children}
    </div>
  );
}

function ContadorNaoLidas({
  total,
  mostrarBolinha,
}: {
  total: number;
  mostrarBolinha: boolean;
}) {
  if (total === 0) return null;
  return (
    <div className="relative flex-shrink-0">
      <div
        className="min-w-[28px] h-[28px] px-1.5 rounded-full flex items-center justify-center text-white text-[13px] font-bold leading-none"
        style={{ backgroundColor: "#0E9F6E" }}
      >
        {total > 9 ? "9+" : total}
      </div>
      {mostrarBolinha && (
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
      )}
    </div>
  );
}

// ─── Home ─────────────────────────────────────────────────────────────────────

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
  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [loadingCautelas, setLoadingCautelas] = useState(true);
  const [listError, setListError] = useState("");
  const [cautelasLidas, setCautelasLidas] = useState<Set<string>>(new Set());
  const cautelasConhecidasRef = useRef<Map<string, string>>(new Map());
  const cautelaSelecionadaRef = useRef<Cautela | null>(null);

  // Formulário
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
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState<number | null>(null);
  const [showItemDeletedModal, setShowItemDeletedModal] = useState(false);
  const [modalEncerrada, setModalEncerrada] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("lista");
  const cautelasRef = useRef<Cautela[]>([]);
  const painelDetalhesRef = useRef<HTMLDivElement | null>(null);

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
                const n = new Set(prev);
                n.delete(c.id);
                return n;
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        cautelaSelecionada &&
        painelDetalhesRef.current &&
        !painelDetalhesRef.current.contains(event.target as Node)
      ) {
        setCautelaSelecionada(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cautelaSelecionada]);

  function marcarComoLida(cautela: Cautela) {
    setCautelaSelecionada((prev) => (prev?.id === cautela.id ? null : cautela));
    if (STATUS_RECEBIDOS.includes(cautela.status as StatusCautela)) {
      setCautelasLidas((prev) => new Set([...prev, cautela.id]));
    }
    setMobileView("detalhe");
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FieldErrors = {};
    setSubmitError("");
    if (!setorId) newErrors.setor = "Selecione um setor.";
    if (!nome.trim()) {
      newErrors.nome = "O campo Proprietário é obrigatório.";
    } else if (nome.trim().length < 3) {
      newErrors.nome = "O nome deve ter no mínimo 3 caracteres.";
    }
    if (!documento.trim())
      newErrors.documento = "O campo Documento é obrigatório.";
    if (!empresa.trim()) newErrors.empresa = "O campo Empresa é obrigatório.";
    const emailRegex = /^[A-Za-z0-9._%+-]+@(callidus|conecthus)\.org\.br$/i;
    if (!emailRegex.test(email))
      newErrors.email = "Use apenas e-mail institucional.";
    if (!validarDocumento(documento))
      newErrors.documento = "Informe um CPF ou identidade válida";
    if (!descricao.trim()) {
      newErrors.descricao = "A descrição do material é obrigatória.";
    } else if (descricao.trim().length < 3) {
      newErrors.descricao = "A descrição deve ter no mínimo 3 caracteres.";
    }

    if (!quantidade) {
      newErrors.quantidade = "A quantidade é obrigatória.";
    } else if (Number(quantidade) <= 0) {
      newErrors.quantidade = "A quantidade deve ser maior que 0.";
    }
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

  // ── Filtros ──
  const cautelasPorAba = cautelas.filter((c) =>
    activeTab === "enviados"
      ? c.status === "Em análise"
      : STATUS_RECEBIDOS.includes(c.status as StatusCautela),
  );
  const pool = searchTerm.trim() ? cautelas : cautelasPorAba;
  const cautelasFiltradas = pool.filter((c) => matchesSearch(c, searchTerm));

  const totalNaoLidas = cautelas.filter(
    (c) =>
      STATUS_RECEBIDOS.includes(c.status as StatusCautela) &&
      !cautelasLidas.has(c.id),
  ).length;
  const mostrarBolinha = totalNaoLidas > 0;

  // ── Props formulário ──
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

  // ── Sub-elementos ──
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
    <div
      ref={painelDetalhesRef}
      className="fixed top-22 left-[630px] w-[380px] bg-white border border-gray-200 rounded-xl shadow-2xl z-10 max-h-[90%] overflow-y-auto"
    >
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
      className={`${isMobile ? "w-full h-[56px] text-[16px]" : "w-full h-[68px] text-[18px]"} font-normal rounded-t${isMobile ? "-lg" : "-xl"} transition-all relative ${activeTab === "recebidos" ? "bg-[#22592A] text-white" : "bg-[#C4EEC9] text-[#2B8E37]"}`}
    >
      <div
        className="w-full h-full flex items-center justify-center gap-2"
        style={{ paddingLeft: "50%" }}
      >
        <span>Recebidos</span>
        <ContadorNaoLidas
          total={totalNaoLidas}
          mostrarBolinha={mostrarBolinha}
        />
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
      className={`absolute top-0 left-0 w-[50%] ${isMobile ? "h-[56px] text-[16px]" : "h-[68px] text-[18px]"} font-bold rounded-tl${isMobile ? "-lg" : "-xl"} transition-all ${activeTab === "enviados" ? "bg-[#22592A] text-white" : "bg-[#C4EEC9] text-[#22592A]"}`}
    >
      Enviados
    </button>
  );

  const formularioSection = (
    <div className="w-full max-w-[800px] mx-auto">
      <div className="text-center mb-4 md:mb-6">
        <h1 className="text-xl font-bold text-black md:text-[28px] md:leading-snug">
          Cautela para equipamentos externos
        </h1>
        <p className="text-xs text-black mt-1 md:text-sm md:mt-2">
          Esta cautela funciona para qualquer tipo de equipamento
          eletroeletrônico que venha de terceiros.
        </p>
        <h3 className="hidden md:block text-[18px] font-semibold text-black mt-1">
          Notebooks, Mouses, Teclados, Etc...
        </h3>
      </div>
      <div className="bg-[#F2FBF3] rounded-sm shadow-sm border border-[#22592A] p-4 md:p-8"> 
        <FormularioCautela
          {...formularioProps}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          validarDocumento={validarDocumento}
        />
      </div>
    </div>
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
            <FormularioCautela
              {...formularioProps}
              fieldErrors={fieldErrors}
              setFieldErrors={setFieldErrors}
              validarDocumento={validarDocumento}
            />
          </div>
        </div>
      </div>

      {/* ══ MOBILE ══ */}
      <div className="md:hidden flex flex-col h-[calc(100vh-60px)] pt-[40px] overflow-hidden">
        {mobileView === "lista" && (
          <>
            <div className="relative mx-3 mt-2 flex-shrink-0">
              {abaRecebidos(true)}
              {abaEnviados(true)}
            </div>
            <div
              className="mx-3 bg-[#E5E7EB] rounded-t-[5px] border border-[#E5E7EB] flex-shrink-0"
              style={{ maxHeight: "35vh" }}
            >
              <div className="overflow-y-auto h-full">{listaCards}</div>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
              {formularioSection}
            </div>
          </>
        )}

        {mobileView === "detalhe" && cautelaSelecionada && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="relative flex items-center justify-center px-4 py-3 mt-2 flex-shrink-0">
              <button
                onClick={() => {
                  setMobileView("lista");
                  setCautelaSelecionada(null);
                }}
                className="absolute left-4 text-gray-600"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 12H5M5 12L12 19M5 12L12 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <span className="font-bold text-[20px] text-center">
                Visualização de Cautela
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2">
              <div className="bg-white rounded-sm border border-black p-6">
                <DetalhesCautelaPortaria
                  cautela={cautelaSelecionada}
                  onFechar={() => {
                    setMobileView("lista");
                    setCautelaSelecionada(null);
                  }}
                  onLiberarSaida={
                    cautelaSelecionada.status === "Saída Autorizada"
                      ? handleConfirmarSaida
                      : undefined
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ MODAIS ══ */}
      {showModal && (
        <ModalOverlay>
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
        </ModalOverlay>
      )}

      {itemParaExcluir !== null && (
        <ModalOverlay>
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
        </ModalOverlay>
      )}

      {showItemDeletedModal && (
        <ModalOverlay>
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
        </ModalOverlay>
      )}

      {modalEncerrada && (
        <ModalEncerrada onClose={() => setModalEncerrada(false)} />
      )}
    </div>
  );
}
