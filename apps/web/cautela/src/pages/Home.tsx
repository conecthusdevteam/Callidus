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
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tampa */}
      <path
        d="M0.666626 3.33366V2.00033C0.666626 1.6467 0.807102 1.30756 1.05715 1.05752C1.3072 0.807468 1.64634 0.666992 1.99996 0.666992H4.66663C5.02025 0.666992 5.35939 0.807468 5.60943 1.05752C5.85948 1.30756 5.99996 1.6467 5.99996 2.00033V3.33366"
        stroke="black"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Linha da tampa */}
      <path
        d="M0.666626 0.666992H12.6666"
        stroke="black"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Corpo */}
      <path
        d="M9.99996 0.666992V10.0003C9.99996 10.3539 9.85948 10.6931 9.60944 10.9431C9.35939 11.1932 9.02025 11.3337 8.66663 11.3337H1.99996C1.64634 11.3337 1.3072 11.1932 1.05715 10.9431C0.807102 10.6931 0.666626 10.3539 0.666626 10.0003V0.666992"
        stroke="black"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type Tab = "enviados" | "recebidos";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("enviados");

  const [descricao, setDescricao] = useState("");
  const [quantidade, setQuantidade] = useState<number>(0);
  const [items, setItems] = useState<
    { descricao: string; quantidade: number }[]
  >([]);

  return (
    <div className="flex h-screen pt-12 pl-14 bg-[#F5F7F6] overflow-hidden ">
      {/* Painel esquerdo — lista de cautelas */}
      <div className="w-2xl flex-shrink-0 px-20 py-15">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
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
          <div className="flex-1 overflow-y-auto pb-2">
            {mockCautelas.map((cautela, index) => (
              <div key={cautela.id}>
                <div className="px-3 py-3 hover:bg-gray-100 transition-colors">
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
                {index < mockCautelas.length - 1 && <LineSeparator />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito — card com formulário */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        {/* Título */}
        <div className="max-w-2xl ml-30 mb-8 text-center">
          <h1 className="text-3xl font-light text-gray-700 leading-snug">
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
        <div className="bg-[#F2FBF3] rounded-xl shadow-sm border border-[#22592A] p-8 max-w-2xl ml-30">
          <form className="space-y-4">
            <CampoSetor />
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Proprietário
              </label>
              <input
                type="text"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="Nome"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-mail do proprietário
              </label>
              <input
                type="email"
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="@conecthus.org.br"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="value"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quantidade
              </label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
                placeholder="000"
              />
            </div>

            {/* Botão adicionar */}
            <button
              type="button"
              onClick={() => {
                if (descricao && quantidade > 0) {
                  setItems([...items, { descricao, quantidade }]);
                  setDescricao("");
                  setQuantidade(0);
                }
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
                          className="text-gray-600 hover:text-red-600"
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
                  <input type="checkbox" className="h-4 w-4 text-green-600" />
                  Sim
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" className="h-4 w-4 text-green-600" />
                  Não
                </label>
              </div>
            </div>

            {/* Botões finais */}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-400 bg-white text-gray-700 text-sm font-medium hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  // Aqui você pode enviar para o backend ou API
                  console.log("Itens enviados:", items);
                  alert("Itens enviados para o gestor!");
                }}
                className="px-4 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
