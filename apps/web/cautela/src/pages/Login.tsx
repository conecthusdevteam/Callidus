import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to={user.papel === "GESTOR" ? "/gestor" : "/"} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      const authUser = await login(email, senha);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || (authUser.papel === "GESTOR" ? "/gestor" : "/"), {
        replace: true,
      });
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F7F6] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
      >
        <h1 className="text-2xl font-bold text-black text-center">
          Controle de Cautelas
        </h1>
        <p className="text-sm text-[#404040] text-center mt-2 mb-8">
          Entre para continuar
        </p>

        <div className="space-y-4">
          <div>
            <label className="block font-medium text-black mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-[#D4D4D4] bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-black mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full border-2 border-[#D4D4D4] bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        {erro && <p className="text-red-500 text-sm mt-4">{erro}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 py-2.5 rounded-lg bg-[#2B8E37] text-white text-sm font-semibold hover:bg-[#22592A] transition-colors disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
