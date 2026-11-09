import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthProvider";
import { PinField } from "./PinField";
import "./Auth.css";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(loginName, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError && err.status === 400 ? err.message : "Não foi possível entrar. Tente novamente.");
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={handleSubmit}>
        <div className="auth__brand">
          <span className="auth__mark" aria-hidden="true">
            M
          </span>
          <span>Moneta</span>
        </div>
        <h1>Entrar</h1>

        <label className="field">
          <span className="field__label">Login</span>
          <input
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={loginName}
            onChange={(e) => setLoginName(e.target.value)}
            required
          />
        </label>

        <PinField label="Senha" value={password} onChange={setPassword} autoComplete="current-password" />

        {error && <p className="auth__error">{error}</p>}

        <button type="submit" className="btn btn--primary auth__submit" disabled={submitting}>
          {submitting ? "Entrando…" : "Entrar"}
        </button>

        <p className="auth__switch">
          Não tem conta? <Link to="/cadastro">Criar conta</Link>
        </p>
      </form>
    </div>
  );
}
