import { useCallback, useEffect, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import type { Cautela, StatusCautela } from "../data/cautelaTypes";
import { useAuth } from "../context/AuthContext";
import { createCautela, getCautelas } from "../lib/api";
import FormularioCautela, {
  type FieldErrors,
} from "../components/FormularioCautela";

function LineSeparator() {
  return <div className="w-full h-px bg-[#404040]" />;
}

// ── Painel de detalhes da cautela (portaria) ──
function DetalhesCautelaPortaria({
  cautela,
  onFechar,
}: {
  cautela: Cautela;
  onFechar: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Status no topo */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center justify-center w-full h-[36px] rounded-lg px-2 py-1 text-[14px] font-medium ${
              cautela.status === "Aprovado"
                ? "bg-[#BCF0DA] text-[#171717] border border-[#31C48D]"
                : cautela.status === "Reprovado"
                  ? "bg-[#FBD5D5] text-[#171717] border border-[#F05252]"
                  : "bg-amber-50 text-[#171717] border border-amber-200"
            }`}
          >
            {cautela.status}
          </span>
        </div>

        {/* Justificativa — só quando reprovado */}
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
          <p className="text-sm font-bold text-black">Data</p>
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

        {/* Equipamentos */}
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

      {/* Botão fechar */}
      <div className="px-6 pb-6 pt-2">
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

type Tab = "enviados" | "recebidos";

export default function Home() {
  const { user } = useAuth();
  const canCreateCautela =
    user?.papel === "ADMIN" || user?.papel === "PORTARIA";

  const [activeTab, setActiveTab] = useState<Tab>("enviados");
  const [cautelaSelecionada, setCautelaSelecionada] = useState<Cautela | null>(
    null,
  );
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
  const [recemRespondidos, setRecemRespondidos] = useState<Set<string>>(
    new Set(),
  );

  const carregarCautelas = useCallback(async () => {
    setLoadingCautelas(true);
    setListError("");
    try {
      const data = await getCautelas();
      setCautelas((prev) => {
        const respondidas = data.filter((nova) => {
          const antiga = prev.find((c) => c.id === nova.id);
          return (
            antiga?.status === "Em análise" &&
            (nova.status === "Aprovado" || nova.status === "Reprovado")
          );
        });
        if (respondidas.length > 0) {
          const ids = new Set(respondidas.map((c) => c.id));
          setRecemRespondidos((prev) => new Set([...prev, ...ids]));
          setTimeout(() => {
            setRecemRespondidos((prev) => {
              const novo = new Set(prev);
              ids.forEach((id) => novo.delete(id));
              return novo;
            });
          }, 3000);
        }
        return data;
      });
    } catch (error) {
      console.error("Erro ao carregar cautelas.", error);
      setCautelas([]);
      setListError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar as cautelas.",
      );
    } finally {
      setLoadingCautelas(false);
    }
  }, []);

  useEffect(() => {
    void carregarCautelas();
    const interval = setInterval(() => {
      void carregarCautelas();
    }, 20000);
    return () => clearInterval(interval);
  }, [carregarCautelas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FieldErrors = {};
    setSubmitError("");

    if (!setorId) newErrors.setor = "Selecione um setor.";
    if (!nome.trim()) newErrors.nome = "O campo Proprietário é obrigatório.";

    const emailRegex = /^[A-Za-z0-9._%+-]+@(callidus|conecthus)\.org\.br$/i;
    if (!emailRegex.test(email))
      newErrors.email =
        "Use apenas e-mail institucional (@callidus.org.br ou @conecthus.org.br).";

    if (items.length === 0)
      newErrors.items = "Adicione pelo menos um item antes de enviar.";
    if (retornado === null)
      newErrors.retornado = "Selecione se o item será retornado.";
    if (retornado === true && !dataFim) {
      newErrors.dataFim = "Informe a data de retorno.";
    } else if (retornado === true && dataFim.length < 10) {
      newErrors.dataFim = "Data inválida. Use o formato DD/MM/AAAA.";
    }

    const dataFimISO = dataFim
      ? dataFim.split("/").reverse().join("-")
      : undefined;

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setSubmitError("");
      setSubmitting(true);
      try {
        const created = await createCautela({
          itens: items.map((item) => ({
            nomeItem: item.descricao,
            quantidade: item.quantidade,
          })),
          proprietarioEmail: email,
          proprietarioNome: nome,
          retornoItem: retornado === true,
          setorId,
          validade: retornado ? dataFimISO : undefined,
        });
        setCautelas((prev) => [created, ...prev]);
      } catch (error) {
        console.error("Erro ao criar cautela.", error);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Nao foi possivel enviar a cautela.",
        );
        setSubmitting(false);
        return;
      }
      setShowModal(true);
      setTimeout(() => setShowModal(false), 3000);
      handleCancel();
      setSubmitting(false);
    }
  };

  function handleCancel() {
    setSetorId("");
    setNome("");
    setEmail("");
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

  const cautelasFiltradas = cautelas.filter((c) => {
    if (activeTab === "enviados")
      return c.status === "Em análise" || recemRespondidos.has(c.id);
    return (
      (c.status === "Aprovado" || c.status === "Reprovado") &&
      !recemRespondidos.has(c.id)
    );
  });

  const formularioProps = {
    canCreateCautela,
    setorId,
    setSetorId,
    nome,
    setNome,
    email,
    setEmail,
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

  // Itens da lista — clicáveis quando na aba recebidos
  const listaLeft = (
    <>
      {loadingCautelas && (
        <div className="px-3 py-4 text-sm text-[#404040] bg-white">
          Carregando cautelas...
        </div>
      )}
      {listError && (
        <div className="px-3 py-4 text-sm text-red-600 bg-white">
          {listError}
        </div>
      )}
      {!loadingCautelas && !listError && cautelasFiltradas.length === 0 && (
        <div className="px-3 py-4 text-sm text-[#404040] bg-white">
          Nenhuma cautela encontrada.
        </div>
      )}
      {cautelasFiltradas.map((cautela, index) => {
        const isAberto = cautelaSelecionada?.id === cautela.id;
        const clicavel = activeTab === "recebidos";

        return (
          <div key={cautela.id}>
            {/* Linha do item */}
            <div
              className={`px-3 py-3 transition-colors bg-white ${
                clicavel ? "cursor-pointer hover:bg-gray-200" : ""
              } ${isAberto ? "bg-[#C4EEC9]" : ""}`}
              onClick={() => {
                if (!clicavel) return;
                setCautelaSelecionada((prev) =>
                  prev?.id === cautela.id ? null : cautela,
                );
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-[14px] text-[#404040] break-all flex-1">
                      Id Cautela:{" "}
                      <span className="font-bold">{cautela.id}</span>
                    </span>
                    <span className="text-[14px] text-[#404040] whitespace-nowrap">
                      Data: {cautela.data || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] text-[#404040] truncate flex-1">
                      Ciente:{" "}
                      <span className="font-bold">
                        {(cautela.gestor || "-").toUpperCase()}
                      </span>
                    </span>
                    <div className="flex-shrink-0">
                      <StatusBadge status={cautela.status as StatusCautela} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {index < cautelasFiltradas.length - 1 && <LineSeparator />}
          </div>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen pt-[60px] pl-0 md:pl-[70px] bg-[#F5F7F6] relative overflow-x-hidden">
      {/* ══ DESKTOP ══ */}
      <div className="hidden md:flex h-[calc(100vh-60px)] overflow-hidden">
        {/* Painel esquerdo */}
        <div className="w-[560px] flex-shrink-0 px-8 pt-10 pb-0">
          <div
            className="bg-gray-300 rounded-xl border border-gray-200 flex flex-col overflow-hidden h-full"
            style={{ boxShadow: "4px 0 8px rgba(0,0,0,0.25)" }}
          >
            <div className="relative flex-shrink-0">
              <button
                onClick={() => {
                  setActiveTab("recebidos");
                  setCautelaSelecionada(null);
                }}
                className={`w-full h-[68px] text-[18px] font-normal leading-[100%] rounded-t-[5px] transition-all ${
                  activeTab === "recebidos"
                    ? "bg-[#22592A] text-white"
                    : "bg-[#C4EEC9] text-[#2B8E37]"
                }`}
                style={{ paddingLeft: "55%" }}
              >
                Recebidos
              </button>
              <button
                onClick={() => {
                  setActiveTab("enviados");
                  setCautelaSelecionada(null);
                }}
                className={`absolute top-0 left-0 w-[50%] h-[68px] text-[18px] font-bold leading-[100%] rounded-t-[5px] transition-all ${
                  activeTab === "enviados"
                    ? "bg-[#22592A] text-white"
                    : "bg-[#C4EEC9] text-[#22592A]"
                }`}
              >
                Enviados
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-2 bg-[#E5E7EB]">
              {listaLeft}
            </div>
          </div>
        </div>

        {/* Painel direito */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center py-8 px-6 relative">
          {/* Card flutuante — próximo à lista, alinhado à esquerda */}
          {activeTab === "recebidos" && cautelaSelecionada && (
            <div className="absolute top-4 left-0 w-[360px] bg-white border border-gray-200 rounded-xl shadow-2xl z-10 max-h-[90%] overflow-y-auto">
              <DetalhesCautelaPortaria
                cautela={cautelaSelecionada}
                onFechar={() => setCautelaSelecionada(null)}
              />
            </div>
          )}

          <div className="w-full max-w-[580px] text-center mb-6 mt-6">
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
        {/* Abas mobile */}
        <div className="relative mx-4 mt-4">
          <button
            onClick={() => {
              setActiveTab("recebidos");
              setCautelaSelecionada(null);
            }}
            className={`w-full h-[56px] text-[16px] font-normal leading-[100%] rounded-t-[5px] transition-all ${
              activeTab === "recebidos"
                ? "bg-[#22592A] text-white"
                : "bg-[#C4EEC9] text-[#2B8E37]"
            }`}
            style={{ paddingLeft: "50%" }}
          >
            Recebidos
          </button>
          <button
            onClick={() => {
              setActiveTab("enviados");
              setCautelaSelecionada(null);
            }}
            className={`absolute top-0 left-0 w-1/2 h-[56px] text-[16px] font-bold leading-[100%] rounded-t-[5px] transition-all ${
              activeTab === "enviados"
                ? "bg-[#22592A] text-white"
                : "bg-[#C4EEC9] text-[#22592A]"
            }`}
          >
            Enviados
          </button>
        </div>

        {/* Lista mobile */}
        <div
          className="mx-4 bg-[#E5E7EB] rounded-b-xl border border-gray-200 mb-6 max-h-64 overflow-y-auto"
          style={{ boxShadow: "0 4px 8px rgba(0,0,0,0.15)" }}
        >
          {listaLeft}
        </div>

        {/* Detalhes mobile — quando recebidos e selecionada */}
        {activeTab === "recebidos" && cautelaSelecionada ? (
          <div className="px-4 w-full">
            <div className="bg-white border border-gray-300 rounded-lg">
              <DetalhesCautelaPortaria
                cautela={cautelaSelecionada}
                onFechar={() => setCautelaSelecionada(null)}
              />
            </div>
          </div>
        ) : activeTab === "enviados" ? (
          /* Formulário mobile — só na aba enviados */
          <div className="px-4 w-full">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-black">
                Cautela para equipamentos externos
              </h1>
              <p className="text-xs text-black mt-1">
                Esta cautela funciona para qualquer tipo de equipamento
                eletroeletrônico que venha de terceiros.
              </p>
              <h3 className="text-sm font-semibold text-black mt-1">
                Notebooks, Mouses, Teclados, Etc...
              </h3>
            </div>
            <div className="bg-[#F2FBF3] rounded-sm shadow-sm border border-[#22592A] p-4 w-full">
              <FormularioCautela {...formularioProps} />
            </div>
          </div>
        ) : (
          /* Aba recebidos sem seleção */
          <div className="px-4 w-full text-center">
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
                  d="M3 6h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M9 6V4h6v2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 11v6M14 11v6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
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
    </div>
  );
}
