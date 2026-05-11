import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCautelas } from "../lib/api";
import type { Cautela } from "../data/cautelaTypes";

function statusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case "Aprovado":
      return { label: "APROVADO", color: "#0E9F6E" };
    case "Reprovado":
      return { label: "REPROVADO", color: "#E02424" };
    case "Em análise":
      return { label: "EM ANÁLISE", color: "#D97706" };
    case "Saída Autorizada":
      return { label: "SAÍDA AUTORIZADA", color: "#D97706" };
    case "Encerrada":
      return { label: "ENCERRADA", color: "#6B7280" };
    default:
      return { label: status.toUpperCase(), color: "#6B7280" };
  }
}

function statusSearchTerms(cautela: Cautela, papel?: string) {
  if (cautela.status !== "Saída Autorizada") return [cautela.status];
  if (papel === "GESTOR") {
    return [cautela.status, "aguardando saída", "aguardando saida"];
  }
  return [
    cautela.status,
    "atenção",
    "atencao",
    "ação necessária",
    "acao necessaria",
  ];
}

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [termo, setTermo] = useState("");
  const [todasCautelas, setTodasCautelas] = useState<Cautela[]>([]);
  const [dropdownAberto, setDropdownAberto] = useState(false);

  useEffect(() => {
    getCautelas()
      .then(setTodasCautelas)
      .catch(() => setTodasCautelas([]));
  }, []);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function emitSearch(term: string) {
    window.dispatchEvent(
      new CustomEvent("cautela-search", { detail: { term } }),
    );
  }

  function emitSelecionar(cautela: Cautela) {
    window.dispatchEvent(
      new CustomEvent("cautela-selecionar", { detail: { cautela } }),
    );
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setTermo(val);
    emitSearch(val);
    setDropdownAberto(val.trim().length > 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      emitSearch(e.currentTarget.value);
      setDropdownAberto(false);
    }
    if (e.key === "Escape") setDropdownAberto(false);
    if (e.key === "Backspace" && e.currentTarget.value.length <= 1) {
      emitSearch("");
      setDropdownAberto(false);
    }
  }

  function handlePesquisar() {
    emitSearch(inputRef.current?.value ?? "");
    setDropdownAberto(false);
  }

  function handleSelecionarCautela(cautela: Cautela) {
    setDropdownAberto(false);
    setTermo("");
    emitSearch("");

    const isHistorico =
      location.pathname === "/historico" ||
      location.pathname === "/gestor/historico";

    if (isHistorico) {
      const destino = user?.papel === "GESTOR" ? "/gestor" : "/";
      navigate(destino, { state: { cautelaSelecionada: cautela } });
    } else {
      emitSelecionar(cautela);
    }
  }

  function handleVerHistorico() {
    setDropdownAberto(false);
    if (user?.papel === "GESTOR") {
      navigate("/gestor/historico");
    } else {
      navigate("/historico");
    }
  }

  const resultadosDropdown = termo.trim()
    ? todasCautelas
        .filter((c) => {
          const q = termo.toLowerCase();
          return (
            c.id.toLowerCase().includes(q) ||
            c.visitante?.toLowerCase().includes(q) ||
            c.gestor?.toLowerCase().includes(q) ||
            c.empresa?.toLowerCase().includes(q) ||
            statusSearchTerms(c, user?.papel).some(
              (term) =>
                term.toLowerCase().includes(q) ||
                q.includes(term.toLowerCase()),
            )
          );
        })
        .slice(0, 3)
    : [];

  const mostrarDropdown = dropdownAberto && termo.trim().length > 0;

  return (
    <>
      {/* DESKTOP */}
      <header
        className="hidden md:flex fixed top-0 left-[70px] right-0 z-10 items-center gap-4 px-4 border-b-[6px]"
        style={{
          height: "60px",
          backgroundColor: "#FFFFFF",
          borderColor: "#2B8E37",
          boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
        }}
      >
        <div className="ml-2 flex items-center gap-5 flex-shrink-0">
          <svg
            width="20"
            height="11"
            viewBox="0 0 15 11"
            fill="none"
            className="text-black"
          >
            <path
              d="M0.5 5.5H13.8333M0.5 0.5H13.8333M0.5 10.5H13.8333"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-black font-bold text-xl tracking-wide whitespace-nowrap">
            Controle de Cautelas
          </span>
        </div>

        <div className="ml-4 flex items-center gap-2 flex-1 max-w-[480px] relative">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
            </span>
            <input
              ref={inputRef}
              type="text"
              value={termo}
              placeholder="Pesquise por nome, proprietário, Id de cautela ou status"
              className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-[#D1D5DB] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#2B8E37] focus:border-transparent"
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => termo.trim() && setDropdownAberto(true)}
            />

            {mostrarDropdown && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-[#E5E7EB] z-50 overflow-hidden"
                style={{ minWidth: "360px" }}
              >
                {resultadosDropdown.length === 0 ? (
                  <div className="px-4 py-4 text-[13px] text-[#6B7280] text-center">
                    Nenhum resultado encontrado.
                  </div>
                ) : (
                  resultadosDropdown.map((cautela) => {
                    const { label, color } = statusLabel(cautela.status);
                    return (
                      <button
                        key={cautela.id}
                        onClick={() => handleSelecionarCautela(cautela)}
                        className="w-full text-left px-4 py-3 hover:bg-[#F9FAFB] transition-colors border-b border-[#F3F4F6] last:border-0"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[12px] text-[#6B7280]">
                              Id Cautela:{" "}
                              <span className="font-mono">{cautela.id}</span>
                            </p>
                            <p className="text-[13px] text-[#111827] mt-0.5">
                              Ciente:{" "}
                              <span className="font-bold">
                                {(cautela.gestor || "—").toUpperCase()}
                              </span>
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-[12px] text-[#6B7280]">
                              Data: {cautela.data}
                            </p>
                            <p
                              className="text-[13px] font-bold mt-0.5"
                              style={{ color }}
                            >
                              {label}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
                <button
                  onClick={handleVerHistorico}
                  className="w-full px-4 py-3 text-[13px] text-[#6B7280] hover:text-[#2B8E37] hover:bg-[#F9FAFB] transition-colors text-center font-medium border-t border-[#E5E7EB]"
                >
                  Ver histórico completo
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handlePesquisar}
            className="px-2 py-1.5 rounded-md bg-[#3BB14A] text-white text-[13px] font-semibold hover:bg-[#22592A] transition-colors whitespace-nowrap"
          >
            Pesquisar
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          {user && (
            <span className="text-sm text-[#404040] font-medium">
              {user.nome}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-[#F5F5F5] text-[#171717] text-sm font-medium hover:bg-gray-200"
          >
            Sair
          </button>
        </div>
      </header>

      {/* MOBILE */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-10 flex flex-col border-b-[6px]"
        style={{
          backgroundColor: "#FFFFFF",
          borderColor: "#2B8E37",
          boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
        }}
      >
        <div className="flex items-center justify-center h-[50px] relative">
          <span className="font-bold text-[20px] leading-[26px] tracking-[-0.25px]">
            Controle de Cautelas
          </span>
          <button
            onClick={handleLogout}
            className="absolute right-3 text-sm font-medium text-[#171717]"
          >
            Sair
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 pb-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={termo}
              placeholder="Pesquisar..."
              className="w-full pl-9 pr-3 py-1.5 text-[12px] border border-[#D1D5DB] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#2B8E37]"
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  emitSearch(e.currentTarget.value);
                  setDropdownAberto(false);
                }
              }}
            />
          </div>
          <button
            onClick={handlePesquisar}
            className="px-3 py-1.5 rounded-md bg-[#2B8E37] text-white text-[12px] font-semibold"
          >
            Pesquisar
          </button>
        </div>
      </header>
    </>
  );
}
