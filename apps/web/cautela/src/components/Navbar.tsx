import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getCautelas } from "../lib/api";
import type { Cautela } from "../data/cautelaTypes";
import menuIcon from "../assets/menu.svg";

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

  function handleSelecionarCautela(cautela: Cautela) {
    setDropdownAberto(false);
    setTermo("");
    emitSearch("");

    const isHistorico =
      location.pathname === "/historico" ||
      location.pathname === "/gestor/historico" ||
      location.pathname === "/portaria/historico";

    if (isHistorico) {
      const destino =
        user?.papel === "GESTOR"
          ? "/gestor"
          : user?.papel === "PORTARIA"
            ? "/portaria"
            : "/";
      navigate(destino, { state: { cautelaSelecionada: cautela } });
    } else {
      emitSelecionar(cautela);
    }
  }

  function handleVerHistorico() {
    setDropdownAberto(false);
    if (user?.papel === "GESTOR") {
      navigate("/gestor/historico");
    } else if (user?.papel === "PORTARIA") {
      navigate("/portaria/historico");
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
        className="hidden md:flex fixed top-0 left-[60px] right-0 z-10 items-center px-4 border-b-[6px]"
        style={{
          height: "60px",
          backgroundColor: "#FFFFFF",
          borderColor: "#2B8E37",
          boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
        }}
      >
        <div className="ml-2 flex items-center gap-5 flex-shrink-0">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#27272A] transition-colors hover:bg-muted">
            <img src={menuIcon} alt="Menu" className="h-40 w-40" />
          </div>
          <span className="text-black font-bold text-xl tracking-wide whitespace-nowrap">
            Controle de Cautelas
          </span>
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
          <span className="font-bold text-[24px] leading-[26px] tracking-[-0.25px] font-['Montserrat']">
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
            {mostrarDropdown && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-[#E5E7EB] z-50 overflow-hidden"
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
                              Id:{" "}
                              <span className="font-mono">{cautela.customId}</span>
                            </p>
                            <p className="text-[13px] text-[#111827] mt-0.5">
                              {cautela.visitante}
                            </p>
                          </div>
                          <p
                            className="text-[12px] font-bold flex-shrink-0"
                            style={{ color }}
                          >
                            {label}
                          </p>
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
        </div>
      </header>
    </>
  );
}
