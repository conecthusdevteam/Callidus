import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import FormularioCautela, {
  type FieldErrors,
} from "../components/FormularioCautela";
import { useAuth } from "../context/AuthContext";
import type { Cautela, StatusCautela } from "../data/cautelaTypes";
import { createCautela, getCautelas, markCautelaAsRead } from "../lib/api";
import { matchesSearch, validarDocumento } from "../lib/cautelaUtils";
import { CardCautelaSolicitante } from "../components/CardCautelaSolicitante";
import { DetalhesCautelaSolicitante } from "../components/DetalhesCautelaSolicitante";
import {
  ModalSolicitacaoEnviada,
  ModalConfirmarExclusao,
  ModalItemExcluido,
} from "../components/Modais";

const STATUS_RECEBIDOS: StatusCautela[] = [
  "Aprovado",
  "Reprovado",
  "Saída Autorizada",
  "Encerrada",
];

type Tab = "enviados" | "recebidos";
type MobileView = "lista" | "detalhe";

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

export default function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const canCreateCautela = user?.papel === "SOLICITANTE";

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
  const cautelaSelecionadaRef = useRef<Cautela | null>(null);
  const [actionError, setActionError] = useState("");

  const [documento, setDocumento] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState<string>("");
  const [items, setItems] = useState<
    { descricao: string; quantidade: number }[]
  >([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [setorId, setSetorId] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [itemParaExcluir, setItemParaExcluir] = useState<number | null>(null);
  const [showItemDeletedModal, setShowItemDeletedModal] = useState(false);
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
      setCautelas(data);

      setCautelaSelecionada((prev) => {
        if (!prev) return prev;
        const atualizada = data.find((c) => c.id === prev.id);
        return atualizada ?? prev;
      });
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
      void markCautelaAsRead(cautela.id)
        .then((atualizada) => {
          setCautelas((prev) =>
            prev.map((c) => (c.id === atualizada.id ? atualizada : c)),
          );
        })
        .catch((error) => {
          console.error("Erro ao marcar cautela como lida.", error);
        });
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
      if (window.innerWidth < 768) return;
      if (
        cautelaSelecionada &&
        painelDetalhesRef.current &&
        !painelDetalhesRef.current.contains(event.target as Node)
      ) {
        setCautelaSelecionada(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [cautelaSelecionada]);

  useEffect(() => {
    if (!actionError) return;
    const timer = setTimeout(() => setActionError(""), 6000);
    return () => clearTimeout(timer);
  }, [actionError]);

  function marcarComoLida(cautela: Cautela) {
    setCautelaSelecionada((prev) => (prev?.id === cautela.id ? null : cautela));
    void markCautelaAsRead(cautela.id)
      .then((atualizada) => {
        setCautelas((prev) =>
          prev.map((c) => (c.id === atualizada.id ? atualizada : c)),
        );
      })
      .catch((error) => {
        console.error("Erro ao marcar cautela como lida.", error);
      });
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
    if (items.length === 0) {
      newErrors.items = "Adicione ao menos um item à lista.";
    }
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
          setorId,
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
      c.badgeSolicitante,
  ).length;
  const mostrarBolinha = totalNaoLidas > 0;

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
    fieldErrors,
    setFieldErrors,
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
        <CardCautelaSolicitante
          key={cautela.id}
          cautela={cautela}
          isNaoLida={
            STATUS_RECEBIDOS.includes(cautela.status as StatusCautela) &&
            Boolean(cautela.badgeSolicitante)
          }
          onClick={() => marcarComoLida(cautela)}
        />
      ))}
    </div>
  );

  const painelDetalhes = cautelaSelecionada ? (
    <div
      ref={painelDetalhesRef}
      className="fixed top-22 left-[630px] w-[540px] bg-white border border-gray-200 rounded-xl shadow-2xl z-10 max-h-[90%] overflow-y-auto"
    >
      <DetalhesCautelaSolicitante
        cautela={cautelaSelecionada}
        onFechar={() => setCautelaSelecionada(null)}
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
        <span>Respondido</span>
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
      Solicitadas
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
      <div className="hidden lg:flex h-[calc(100vh-60px)]">
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
      <div className="lg:hidden flex flex-col h-[calc(100vh-60px)] pt-[40px]">
        {mobileView === "lista" && (
          <div className="flex-1 overflow-y-auto">
            <div className="relative mx-3 mt-2 h-[56px] flex-shrink-0">
              {abaRecebidos(true)}
              {abaEnviados(true)}
            </div>
            <div className="mx-3 mt-1 bg-[#E5E7EB] rounded-b-lg border border-[#E5E7EB]">
              {listaCards}
            </div>
            <div className="px-3 pb-4 pt-4">{formularioSection}</div>
          </div>
        )}

        {mobileView === "detalhe" && cautelaSelecionada && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="relative flex items-center justify-center px-4 py-3 mt-2 flex-shrink-0">
              <button
                onClick={() => {
                  setCautelaSelecionada(null);
                  setMobileView("lista");
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
                <DetalhesCautelaSolicitante
                  cautela={cautelaSelecionada}
                  onFechar={() => {
                    setMobileView("lista");
                    setCautelaSelecionada(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ MODAIS ══ */}
      {showModal && <ModalSolicitacaoEnviada />}

      {itemParaExcluir !== null && (
        <ModalConfirmarExclusao
          onConfirmar={confirmarExclusaoItem}
          onCancelar={() => setItemParaExcluir(null)}
        />
      )}

      {showItemDeletedModal && <ModalItemExcluido />}
    </div>
  );
}
