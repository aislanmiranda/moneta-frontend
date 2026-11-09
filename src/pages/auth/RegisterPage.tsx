import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/client";
import { useAuth } from "../../auth/AuthProvider";
import { PinField } from "./PinField";
import "./Auth.css";

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length !== 6) {
      setError("A senha deve ter exatamente 6 números.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ fullName, email, login: loginName, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError && err.status === 400 ? err.message : "Não foi possível criar a conta. Tente novamente.");
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
        <h1>Criar conta</h1>

        <label className="field">
          <span className="field__label">Nome completo</span>
          <input
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            minLength={3}
            maxLength={150}
          />
        </label>

        <label className="field">
          <span className="field__label">E-mail</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={200}
          />
        </label>

        <label className="field">
          <span className="field__label">Login</span>
          <input
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={loginName}
            onChange={(e) => setLoginName(e.target.value.toLowerCase())}
            required
            minLength={3}
            maxLength={50}
            pattern="[a-z0-9._\-]{3,50}"
            title="Letras minúsculas, números, ponto, hífen ou sublinhado"
          />
        </label>

        <div className="field-row">
          <PinField label="Senha (6 números)" value={password} onChange={setPassword} autoComplete="new-password" />
          <PinField label="Confirmar senha" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        </div>

        {error && <p className="auth__error">{error}</p>}

        <button type="submit" className="btn btn--primary auth__submit" disabled={submitting}>
          {submitting ? "Criando conta…" : "Criar conta"}
        </button>

        <p className="auth__switch">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
