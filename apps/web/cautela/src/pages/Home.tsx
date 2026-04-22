import { useState } from "react";
import StatusBadge from "../components/StatusBadge";
import { mockCautelas, tiposCautela, type TipoCautela } from "../data/mockData";

const tipoIlustracoes: Record<TipoCautela, React.ReactNode> = {
  comida: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect
        x="8"
        y="40"
        width="48"
        height="14"
        rx="4"
        stroke="#2B8E37"
        strokeWidth="2.5"
      />
      <rect
        x="16"
        y="28"
        width="32"
        height="12"
        rx="3"
        stroke="#2B8E37"
        strokeWidth="2.5"
      />
      <circle cx="22" cy="26" r="4" stroke="#2B8E37" strokeWidth="2.5" />
      <circle cx="32" cy="24" r="4" stroke="#2B8E37" strokeWidth="2.5" />
      <circle cx="42" cy="26" r="4" stroke="#2B8E37" strokeWidth="2.5" />
      <line
        x1="22"
        y1="22"
        x2="22"
        y2="16"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="20"
        x2="32"
        y2="14"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="42"
        y1="22"
        x2="42"
        y2="16"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  equipamento: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect
        x="8"
        y="12"
        width="48"
        height="32"
        rx="4"
        stroke="#2B8E37"
        strokeWidth="2.5"
      />
      <rect
        x="16"
        y="20"
        width="32"
        height="18"
        rx="2"
        stroke="#2B8E37"
        strokeWidth="2"
      />
      <line
        x1="20"
        y1="50"
        x2="44"
        y2="50"
        stroke="#2B8E37"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="44"
        x2="32"
        y2="50"
        stroke="#2B8E37"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  smt: (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect
        x="10"
        y="10"
        width="44"
        height="44"
        rx="4"
        stroke="#2B8E37"
        strokeWidth="2.5"
      />
      <rect
        x="20"
        y="20"
        width="24"
        height="24"
        rx="2"
        stroke="#2B8E37"
        strokeWidth="2"
      />
      <rect x="26" y="26" width="12" height="12" rx="1" fill="#2B8E37" />
      <line
        x1="10"
        y1="20"
        x2="6"
        y2="20"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="32"
        x2="6"
        y2="32"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="10"
        y1="44"
        x2="6"
        y2="44"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="54"
        y1="20"
        x2="58"
        y2="20"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="54"
        y1="32"
        x2="58"
        y2="32"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="54"
        y1="44"
        x2="58"
        y2="44"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="20"
        y1="10"
        x2="20"
        y2="6"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="10"
        x2="32"
        y2="6"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="44"
        y1="10"
        x2="44"
        y2="6"
        stroke="#2B8E37"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
};

type Tab = "enviados" | "recebidos";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("enviados");

  return (
    <div className="flex h-screen pt-12 pl-14 bg-[#F5F7F6] overflow-hidden">
      {/* Painel esquerdo — lista de cautelas */}
      <div className="w-md flex-shrink-0 px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
          {/* Abas */}
          <div className="flex">
            <button
              onClick={() => setActiveTab("enviados")}
              className={`flex-1 py-2 text-sm font-semibold rounded-t-lg transition-all
                ${
                  activeTab === "enviados"
                    ? "bg-[#22592A] text-white"
                    : "bg-[#C4EEC9] text-[#22592A]"
                }`}
            >
              Enviados
            </button>

            <button
              onClick={() => setActiveTab("recebidos")}
              className={`flex-1 py-2 text-sm font-medium rounded-tr-lg transition-all
                ${
                  activeTab === "recebidos"
                    ? "bg-[#22592A] text-white"
                    : "bg-[#C4EEC9] text-[#22592A]"
                }`}
            >
              Recebidos
            </button>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {mockCautelas.map((cautela) => (
              <div
                key={cautela.id}
                className="px-3 py-3 border-b border-gray-200 last:border-none hover:bg-gray-50 rounded-md"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">
                    Id Cautela:{" "}
                    <span className="font-medium text-gray-700">
                      {cautela.id}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400">{cautela.data}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">
                    Ciente:{" "}
                    <span className="font-bold text-gray-700">
                      {cautela.gestor.toUpperCase()}
                    </span>
                  </span>
                  <StatusBadge status={cautela.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel direito — seleção de tipo */}
      <div className="flex-1 overflow-y-auto px-10 py-8">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-gray-700 leading-snug">
            Escolha a{" "}
            <strong className="font-bold text-gray-700">cautela</strong>
            <br />
            que se adequa a necessidade da pessoa
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Informações que possam ajudar a pessoa a fazer
            <br />a decisão correta.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
          {tiposCautela.map((tipo) => (
            <div
              key={tipo.id}
              className="bg-[#f0f7f3] rounded-2xl border border-[#A7D3AE] p-5 flex flex-col items-center hover:shadow-md transition-shadow"
            >
              <p className="text-xs text-gray-400 mb-0.5">Cautela para</p>
              <h2 className="text-base font-bold text-gray-700 mb-4 text-center">
                {tipo.titulo}
              </h2>

              {/* Ilustração */}
              <div className="mb-4">{tipoIlustracoes[tipo.id]}</div>

              {/* Itens */}
              <div className="w-full mb-5">
                <p className="text-xs text-gray-500 mb-2">{tipo.descricao}</p>
                <ul className="space-y-1">
                  {tipo.itens.map((item) => (
                    <li
                      key={item}
                      className="text-xs text-gray-700 flex items-start gap-1.5"
                    >
                      <span className="text-[#2B8E37] mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Botão */}
              <button className="w-full mt-auto py-2 px-4 rounded-lg border border-gray-400 text-sm font-medium bg-white text-gray-700 hover:bg-[#2B8E37] hover:text-white hover:border-[#2B8E37] transition-all cursor-pointer">
                Solicitar cautela
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
