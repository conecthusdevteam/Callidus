import { useState } from "react";
import StatusBadge from "../components/StatusBadge";
import { mockCautelas } from "../data/mockData";
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
      {/* Tampa */}
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
      {/* Corpo */}
      <path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Linhas internas */}
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

type Tab = "enviados" | "recebidos";

export default function Home() {
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
  const [errors, setErrors] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    if (!nome.trim()) newErrors.push("O campo Proprietário é obrigatório.");

    const emailRegex = /^[A-Za-z0-9._%+-]+@callidus\.org\.br$/;
    if (!emailRegex.test(email)) {
      newErrors.push(
        "E-mail inválido. Use apenas institucional (@callidus.org.br).",
      );
    }

    if (items.length === 0) {
      newErrors.push("Adicione pelo menos um item antes de enviar.");
    }

    if (retornado === null) {
      newErrors.push("Selecione se o item será retornado (Sim ou Não).");
    }

    if (retornado === true && !dataFim) {
      newErrors.push("Informe a data de retorno.");
    }

    setErrors(newErrors);

    if (newErrors.length === 0) {
      console.log("Itens enviados:", items);
      setShowModal(true);

      setTimeout(() => {
        setShowModal(false);
      }, 3000);

      setNome("");
      setEmail("");
      setDescricao("");
      setQuantidade("");
      setItems([]);
      setRetornado(null);
      setDataFim("");
    }
  };

  const cautelasFiltradas = mockCautelas.filter((c) =>
    activeTab === "enviados"
      ? c.direcao === "enviado"
      : c.direcao === "recebido",
  );

  return (
    <div className="flex h-screen pt-12 pl-14 bg-[#F5F7F6] overflow-hidden relative">
      {/* Painel esquerdo — lista de cautelas */}
      <div className="w-2xl flex-shrink-0 px-20 pt-15 pb-0">
        <div
          className="bg-gray-300 rounded-xl border border-gray-200 flex flex-col overflow-hidden h-full"
          style={{ boxShadow: "4px 0 8px rgba(0,0,0,0.25)" }}
        >
          <div className="relative">
            <button
              onClick={() => setActiveTab("recebidos")}
              className={`w-[750px] h-[68px] text-[18px] font-normal leading-[100%] rounded-t-[5px] transition-all
                ${
                  activeTab === "recebidos"
                    ? "bg-[#22592A] text-white"
                    : "bg-[#C4EEC9] text-[#2B8E37]"
                }`}
            >
              Recebidos
            </button>

            <button
              onClick={() => setActiveTab("enviados")}
              className={`absolute top-0 left-0 w-[260px] h-[68px] text-[18px] font-bold leading-[100%] rounded-t-[5px] transition-all
                ${
                  activeTab === "enviados"
                    ? "bg-[#22592A] text-white"
                    : "bg-[#C4EEC9] text-[#22592A]"
                }`}
            >
              Enviados
            </button>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto pb-2 bg-[#E5E7EB]">
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
                      Data: {cautela.data}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-normal leading-[100%] text-[#404040]">
                      Ciente:{" "}
                      <span className="font-bold text-[14px] leading-[100%] text-[#404040]">
                        {cautela.gestor.toUpperCase()}
                      </span>
                    </span>
                    <StatusBadge status={cautela.status} />
                  </div>
                </div>

                {/* Linha separadora abaixo do hover */}
                {index < cautelasFiltradas.length - 1 && <LineSeparator />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito — card com formulário */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        {/* Título */}
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

        {/* Formulário */}
        <div className="bg-[#F2FBF3] rounded-sm shadow-sm border border-[#22592A] p-8 max-w-2xl ml-30">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <CampoSetor />
            <div>
              <label className="block text-nowrap font-medium text-black">
                Proprietário
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1 w-full border-2 border-[#D4D4D4] bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="Nome"
              />
            </div>
            <div>
              <label className="block text-nowrap font-medium text-black">
                E-mail do proprietário
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border-2 border-[#D4D4D4] bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="@conecthus.org.br"
              />
            </div>
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
            {/* Retorno */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                O item será retornado?
              </p>
              <div className="flex gap-6">
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

              {retornado === true && (
                <div className="mt-4 flex gap-6 w-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700"></label>
                    <input
                      type="date"
                      value={dataInicio}
                      readOnly
                      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700"></label>
                    <input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="mt-1 w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
            {errors.length > 0 && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg">
                <ul className="list-disc pl-5 text-sm">
                  {errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Botões finais */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-[#F5F5F5] text-[#171717] text-sm font-medium hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#FAFAFA] text-[#171717] text-sm font-medium hover:bg-gray-300"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
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
