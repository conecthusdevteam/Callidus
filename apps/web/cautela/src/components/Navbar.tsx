/**
 * Navbar.tsx
 *
 * A barra de pesquisa emite um CustomEvent "cautela-search" com o termo digitado.
 * O Home.tsx escuta esse evento e aplica o filtro.
 * Isso evita prop drilling ou context desnecessário.
 */

import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function emitSearch(term: string) {
    window.dispatchEvent(
      new CustomEvent("cautela-search", { detail: { term } }),
    );
  }

  function handlePesquisar() {
    emitSearch(inputRef.current?.value ?? "");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handlePesquisar();
    // Limpa ao apagar tudo
    if (e.key === "Backspace" && e.currentTarget.value.length <= 1) {
      emitSearch("");
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Pesquisa em tempo real enquanto digita
    emitSearch(e.target.value);
  }

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
        {/* Ícone menu + título */}
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

        {/* Campo de pesquisa — fiel ao design */}
        <div className="ml-4 flex items-center gap-2 flex-1 max-w-[480px]">
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
              placeholder="Pesquise por nome, solicitante, Id de cautela ou status"
              className="w-full pl-9 pr-3 py-1.5 text-[13px] border border-[#D1D5DB] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#2B8E37] focus:border-transparent"
              onChange={handleChange}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            onClick={handlePesquisar}
            className="px-2 py-1.5 rounded-md bg-[#3BB14A] text-white text-[13px] font-semibold hover:bg-[#22592A] transition-colors whitespace-nowrap"
          >
            Pesquisar
          </button>
        </div>

        {/* Usuário + Sair */}
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
        {/* Linha título */}
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
        {/* Linha pesquisa mobile */}
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
              placeholder="Pesquisar..."
              className="w-full pl-9 pr-3 py-1.5 text-[12px] border border-[#D1D5DB] rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-[#2B8E37]"
              onChange={(e) => emitSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") emitSearch(e.currentTarget.value);
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
