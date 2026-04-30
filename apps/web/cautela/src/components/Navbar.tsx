import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      {/* DESKTOP */}
      <header
        className="hidden md:flex fixed top-0 left-[70px] right-0 z-10 items-center justify-between px-4 border-b-[6px]"
        style={{
          height: "60px",
          backgroundColor: "#FFFFFF",
          borderColor: "#2B8E37",
          boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
        }}
      >
        <div className="flex items-center gap-2">
          <svg
            width="80"
            height="20"
            viewBox="0 0 15 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-black"
          >
            <path
              d="M0.5 5.5H13.8333M0.5 0.5H13.8333M0.5 10.5H13.8333"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-black font-bold text-2xl tracking-wide">
            Controle de Cautelas
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
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
        className="md:hidden fixed top-0 left-0 right-0 z-10 flex items-center justify-center border-b-[6px]"
        style={{
          height: "60px",
          backgroundColor: "#FFFFFF",
          borderColor: "#2B8E37",
          boxShadow: "0px 4px 4px rgba(0,0,0,0.25)",
        }}
      >
        <span className="font-bold text-[24px] leading-[26px] tracking-[-0.25px] text-center">
          Controle de Cautelas
        </span>
        <button
          onClick={handleLogout}
          className="absolute right-3 text-sm font-medium text-[#171717]"
        >
          Sair
        </button>
      </header>
    </>
  );
}
