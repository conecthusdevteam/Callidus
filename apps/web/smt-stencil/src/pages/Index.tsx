import logoIsq from "@/assets/logo-isq.svg";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import type { UserArea } from "@/lib/authApi";
import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

const areaOptions: Array<{ value: UserArea; label: string }> = [
  { value: "operacao", label: "Operação" },
  { value: "engenharia", label: "Engenharia" },
  { value: "qualidade", label: " Controle de Qualidade" },
  { value: "admin", label: "Admin" },
];

export default function Index() {
  const navigate = useNavigate();
  const { user, loading, login } = useAuth();
  const [area, setArea] = useState<UserArea>("operacao");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login({ area, email, password, rememberMe });
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Área, e-mail ou senha inválidos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-container">
      <section
        className="login-sidebar"
        aria-label="Intelligent Stencil Quality"
      >
        <div className="brand-lockup">
          <img src={logoIsq} alt="ISQ" className="brand-logo" />
          <h1 className="brand-title">
            Intelligent
            <br />
            Stencil
            <br />
            Quality
          </h1>
        </div>

        <div className="stats-container" aria-hidden="true">
          <div className="stat-card">
            <span className="label">Stencils cadastrados</span>
            <strong className="value">369</strong>
          </div>
          <div className="stat-card">
            <span className="label">Stencils ativos</span>
            <strong className="value">336</strong>
          </div>
          <div className="stat-card">
            <span className="label">Linhas rastreáveis</span>
            <strong className="value">8</strong>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2 className="form-title">Login</h2>

        <form className="form-wrapper" onSubmit={handleSubmit}>
          <div className="form-group">
            <Label htmlFor="area">Selecione sua área</Label>
            <Select
              value={area}
              onValueChange={(value) => setArea(value as UserArea)}
            >
              <SelectTrigger id="area" className="form-input h-9">
                <SelectValue placeholder="Operação" />
              </SelectTrigger>
              <SelectContent>
                {areaOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="form-group">
            <Label htmlFor="email">E-mail corporativo</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="form-input"
              placeholder="nome.sobrenome@callidus.ind.br"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="form-input"
              placeholder="******"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <div className="form-options">
            <Label htmlFor="remember" className="remember-option">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <span>Permanecer conectado</span>
            </Label>
            <button type="button" className="forgot-password">
              Recuperar senha
            </button>
          </div>

          {error && <p className="login-error">{error}</p>}

          <Button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Entrando..." : "Login"}
          </Button>
        </form>
      </section>
    </main>
  );
}
