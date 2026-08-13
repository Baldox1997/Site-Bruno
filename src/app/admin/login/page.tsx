"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "@/components/bruno-zarath/bruno-zarath.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@brunozarath.app");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Falha no login");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="bz" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <form className="form" style={{ width: "min(420px, 92vw)", padding: 32, border: "1px solid var(--line)", borderRadius: 4 }} onSubmit={onSubmit}>
        <div className="eyebrow">ACESSO RESTRITO</div>
        <h1 className="page__title" style={{ fontSize: 36, marginBottom: 8 }}>Painel Admin</h1>
        <p className="page__lead" style={{ marginBottom: 24 }}>Upload de fotos, eventos, preços e configurações de pagamento.</p>
        {error && <p style={{ color: "#e57373", fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <label>E-mail<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></label>
        <label>Senha<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></label>
        <button className="btn btn--primary btn--full" type="submit" disabled={loading} style={{ justifyContent: "center" }}>
          {loading ? "ENTRANDO…" : "ENTRAR"}
        </button>
        <a href="/" className="btn btn--ghost btn--full" style={{ justifyContent: "center", textAlign: "center" }}>Voltar ao site</a>
      </form>
    </div>
  );
}
