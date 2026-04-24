import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "../components/StatusBadge";
import {
  approveCautela,
  createCautela,
  fetchCautelas,
  rejectCautela,
  type CautelaApi,
  type CautelaStatusApi,
  type User,
} from "../lib/api";
import CampoSetor from "./CampoSetor";

function LineSeparator() {
  return (
    <svg
      width="510"
      height="2"
      viewBox="0 0 530 2"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line x1="0" y1="1" x2="530" y2="1" stroke="#404040" />
    </svg>
  );
}

export function IconTrash() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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
  );
}

interface FieldErrors {
  setor?: string;
  nome?: string;
  email?: string;
  items?: string;
  retornado?: string;
  dataFim?: string;
}

type Tab = "enviados" | "recebidos";
type StatusCautela = "Aprovado" | "Reprovado" | "Em análise";

interface Props {
  user: User;
}

const statusLabels: Record<CautelaStatusApi, StatusCautela> = {
  APROVADA: "Aprovado",
  EM_ANALISE: "Em análise",
  REPROVADA: "Reprovado",
};

function formatDate(date: string | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

export default function Home({ user }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("enviados");
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
  const [cautelas, setCautelas] = useState<CautelaApi[]>([]);
  const [loadingCautelas, setLoadingCautelas] = useState(true);
  const [listError, setListError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [decisionError, setDecisionError] = useState("");
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const canCreateCautela = user.papel === "PORTARIA";

  const loadCautelas = useCallback(async () => {
    setListError("");
    setLoadingCautelas(true);

    try {
      setCautelas(await fetchCautelas());
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : "Falha ao carregar cautelas.",
      );
    } finally {
      setLoadingCautelas(false);
    }
  }, []);

  useEffect(() => {
    loadCautelas();
  }, [loadCautelas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: FieldErrors = {};

    if (!setorId) newErrors.setor = "Selecione um setor.";
    if (!nome.trim()) newErrors.nome = "O campo Proprietário é obrigatório.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      newErrors.email = "Informe um e-mail válido.";

    if (items.length === 0)
      newErrors.items = "Adicione pelo menos um item antes de enviar.";

    if (retornado === null)
      newErrors.retornado = "Selecione se o item será retornado.";
    if (retornado === true && !dataFim)
      newErrors.dataFim = "Informe a data de retorno.";

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setSubmitError("");
      setSubmitting(true);

      try {
        await createCautela({
          setorId,
          proprietarioNome: nome.trim(),
          proprietarioEmail: email.trim().toLowerCase(),
          retornoItem: Boolean(retornado),
          validade: retornado ? dataFim : undefined,
          itens: items.map((item) => ({
            nomeItem: item.descricao,
            quantidade: item.quantidade,
          })),
        });

        await loadCautelas();
        setShowModal(true);
        setTimeout(() => setShowModal(false), 3000);

        setSetorId("");
        setNome("");
        setEmail("");
        setDescricao("");
        setQuantidade("");
        setItems([]);
        setRetornado(null);
        setDataFim("");
        setFieldErrors({});
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Falha ao enviar cautela.",
        );
      } finally {
        setSubmitting(false);
      }
    }
  };

  const cautelasFiltradas = useMemo(
    () =>
      cautelas.filter((cautela) =>
        activeTab === "enviados"
          ? cautela.solicitadoPorId === user.id
          : cautela.gestorId === user.id,
      ),
    [activeTab, cautelas, user.id],
  );

  async function handleApprove(id: string) {
    setDecisionError("");
    setDecidingId(id);

    try {
      await approveCautela(id);
      await loadCautelas();
    } catch (err) {
      setDecisionError(
        err instanceof Error ? err.message : "Falha ao aprovar cautela.",
      );
    } finally {
      setDecidingId(null);
    }
  }

  async function handleReject(id: string) {
    const justificativa = window.prompt("Informe a justificativa da reprovação:");
    if (!justificativa?.trim()) return;

    setDecisionError("");
    setDecidingId(id);

    try {
      await rejectCautela(id, justificativa.trim());
      await loadCautelas();
    } catch (err) {
      setDecisionError(
        err instanceof Error ? err.message : "Falha ao reprovar cautela.",
      );
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <div className="flex h-screen pt-12 pl-14 bg-[#F5F7F6] overflow-hidden relative">
      {/* Painel esquerdo */}
      <div className="w-2xl flex-shrink-0 px-20 pt-15 pb-0">
        <div
          className="bg-gray-300 rounded-xl border border-gray-200 flex flex-col overflow-hidden h-full"
          style={{ boxShadow: "4px 0 8px rgba(0,0,0,0.25)" }}
        >
          <div className="relative">
            <button
              onClick={() => setActiveTab("recebidos")}
              className={`w-[750px] h-[68px] text-[18px] font-normal leading-[100%] rounded-t-[5px] transition-all ${
                activeTab === "recebidos"
                  ? "bg-[#22592A] text-white"
                  : "bg-[#C4EEC9] text-[#2B8E37]"
              }`}
            >
              Recebidos
            </button>
            <button
              onClick={() => setActiveTab("enviados")}
              className={`absolute top-0 left-0 w-[260px] h-[68px] text-[18px] font-bold leading-[100%] rounded-t-[5px] transition-all ${
                activeTab === "enviados"
                  ? "bg-[#22592A] text-white"
                  : "bg-[#C4EEC9] text-[#22592A]"
              }`}
            >
              Enviados
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pb-2 bg-[#E5E7EB]">
            {decisionError && (
              <div className="px-3 py-3 text-sm text-red-600 bg-white">
                {decisionError}
              </div>
            )}
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
            {cautelasFiltradas.map((cautela, index) => (
              <div key={cautela.id}>
                <div className="px-3 py-3 hover:bg-gray-100 transition-colors bg-white">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[14px] font-normal leading-[100%] text-[#404040]">
                      Id Cautela:{" "}
                      <span className="font-normal text-[#404040]">
                        {cautela.id}
                      </span>
                    </span>
                    <span className="text-[14px] font-normal leading-[100%] text-[#404040]">
                      Data: {formatDate(cautela.criadoEm)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-normal leading-[100%] text-[#404040]">
                      Ciente:{" "}
                      <span className="font-bold text-[14px] leading-[100%] text-[#404040]">
                        {(cautela.gestor?.nome || "-").toUpperCase()}
                      </span>
                    </span>
                    <StatusBadge status={statusLabels[cautela.status]} />
                  </div>
                  {user.papel === "GESTOR" &&
                    activeTab === "recebidos" &&
                    cautela.status === "EM_ANALISE" && (
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          type="button"
                          disabled={decidingId === cautela.id}
                          onClick={() => handleReject(cautela.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#FBD5D5] text-[#171717] text-xs font-medium hover:bg-[#F05252] hover:text-white disabled:opacity-60"
                        >
                          Reprovar
                        </button>
                        <button
                          type="button"
                          disabled={decidingId === cautela.id}
                          onClick={() => handleApprove(cautela.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#BCF0DA] text-[#171717] text-xs font-medium hover:bg-[#31C48D] disabled:opacity-60"
                        >
                          Aprovar
                        </button>
                      </div>
                    )}
                </div>
                {index < cautelasFiltradas.length - 1 && <LineSeparator />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        <div className="max-w-2xl ml-30 mb-8 text-center">
          <h1 className="text-3xl font-light text-gray-700 leading-snug mt-15">
            <strong className="font-bold text-black">
              Cautela para equipamentos externos
            </strong>
          </h1>
          <p className="text-sm text-black mt-2">
            Esta cautela funciona para qualquer tipo de equipamento
            <br />
            eletroeletrônico que venha de terceiros que irão entrar e sair.
          </p>
          <h3 className="text-xl font-light text-black leading-snug">
            <strong className="font-semibold text-black">
              Notebooks, Mouses, Teclados, Etc...
            </strong>
          </h3>
        </div>

        <div className="bg-[#F2FBF3] rounded-sm shadow-sm border border-[#22592A] p-8 max-w-2xl ml-30">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!canCreateCautela && (
              <p className="text-sm text-[#404040]">
                Seu perfil visualiza cautelas, mas não cria novas solicitações.
              </p>
            )}

            {/* Setor */}
            <div>
              <CampoSetor
                value={setorId}
                onSetorChange={(id) => setSetorId(id)}
              />
              {fieldErrors.setor && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.setor}</p>
              )}
            </div>

            {/* Proprietário */}
            <div>
              <label className="block text-nowrap font-medium text-black">
                Proprietário
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={`mt-1 w-full border-2 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none ${
                  fieldErrors.nome ? "border-red-400" : "border-[#D4D4D4]"
                }`}
                placeholder="Nome"
              />
              {fieldErrors.nome && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.nome}</p>
              )}
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-nowrap font-medium text-black">
                E-mail do proprietário
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 w-full border-2 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none ${
                  fieldErrors.email ? "border-red-400" : "border-[#D4D4D4]"
                }`}
                placeholder="@conecthus.org.br"
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Descrição + Quantidade */}
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-nowrap font-medium text-black">
                  Descrição
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="mt-1 w-full border-2 border-[#D4D4D4] bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none h-[42px]"
                  placeholder="value"
                />
              </div>
              <div className="w-32">
                <label className="block text-nowrap font-medium text-black">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="mt-1 w-full border-2 border-[#D4D4D4] bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none h-[42px]"
                  placeholder="000"
                />
              </div>
            </div>

            {/* Botão adicionar */}
            <button
              type="button"
              onClick={() => {
                if (!descricao.trim()) {
                  alert("Descrição obrigatória");
                  return;
                }
                if (!quantidade || Number(quantidade) <= 0) {
                  alert("Quantidade deve ser maior que 0");
                  return;
                }
                setItems([
                  ...items,
                  { descricao, quantidade: Number(quantidade) },
                ]);
                setDescricao("");
                setQuantidade("");
              }}
              className="flex items-center gap-2 text-sm font-medium text-[#F9F9F9] bg-[#3BB14A] px-3 py-2 rounded-lg hover:bg-[#2B8E37]"
            >
              + Adicionar
            </button>

            {/* Tabela de itens */}
            {items.length > 0 && (
              <table className="w-full mt-4 border border-gray-300 rounded-lg table-fixed">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left w-2/3">Descrição</th>
                    <th className="px-4 py-2 text-left w-1/6">Quantidade</th>
                    <th className="px-4 py-2 text-center w-1/6">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2 break-words">
                        {item.descricao}
                      </td>
                      <td className="py-2 text-center">{item.quantidade}</td>
                      <td className="py-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setItems(items.filter((_, i) => i !== index))
                          }
                          className="text-black hover:text-red-600"
                        >
                          <IconTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {fieldErrors.items && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.items}</p>
            )}

            {/* Retorno */}
            <div>
              <div className="flex items-center gap-6">
                <p className="text-sm font-medium text-gray-700">
                  O item será retornado?
                </p>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={retornado === true}
                    onChange={() =>
                      setRetornado(retornado === true ? null : true)
                    }
                    className="h-4 w-4 text-green-600"
                  />
                  Sim
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={retornado === false}
                    onChange={() =>
                      setRetornado(retornado === false ? null : false)
                    }
                    className="h-4 w-4 text-green-600"
                  />
                  Não
                </label>
              </div>
              {fieldErrors.retornado && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.retornado}
                </p>
              )}

              {retornado === true && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Validade da Cautela
                  </p>
                  <div className="flex gap-2">
                    <div className="w-40">
                      <input
                        type="date"
                        value={dataInicio}
                        readOnly
                        className="mt-1 w-35 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        placeholder="00/00/0000"
                        className={`mt-1 w-35 border bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none ${
                          fieldErrors.dataFim
                            ? "border-red-400"
                            : "border-gray-300"
                        }`}
                      />
                      {fieldErrors.dataFim && (
                        <p className="text-red-500 text-xs mt-1">
                          {fieldErrors.dataFim}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botões finais */}
            {submitError && (
              <p className="text-sm text-red-600 text-center">{submitError}</p>
            )}
            <div className="flex justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
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
                }}
                className="px-4 py-2 rounded-lg bg-[#F5F5F5] text-[#171717] text-sm font-medium hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!canCreateCautela || submitting}
                className="px-4 py-2 rounded-lg bg-[#FAFAFA] text-[#171717] text-sm font-medium hover:bg-[#3BB14A] hover:text-white disabled:opacity-60 disabled:hover:bg-[#FAFAFA] disabled:hover:text-[#171717]"
              >
                {submitting ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed flex items-center justify-center bg-black/20 backdrop-blur-sm z-30"
          style={{ top: "60px", left: "70px", right: 0, bottom: 0 }}
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
    </div>
  );
}
