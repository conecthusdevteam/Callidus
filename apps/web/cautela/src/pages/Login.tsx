import { useState } from "react";
import { login, type User } from "../lib/api";

interface Props {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session = await login(email, senha);
      onLogin(session.user);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível fazer login.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7F6] flex items-center justify-center px-6">
      <section className="w-full max-w-sm bg-white border border-[#D4D4D4] rounded-lg shadow-sm p-8">
        <h1 className="text-2xl font-bold text-black">Controle de Cautelas</h1>
        <p className="mt-2 text-sm text-[#404040]">
          Entre com seu usuário para acessar as cautelas.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-black">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full border-2 border-[#D4D4D4] bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              className="mt-1 w-full border-2 border-[#D4D4D4] bg-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-600 focus:outline-none"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-[#22592A] text-white text-sm font-medium hover:bg-[#2B8E37] disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
