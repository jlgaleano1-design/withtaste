import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";

// Login del equipo por magic link (sin passwords que gestionar). Gatea toda
// la app: nadie ve ni edita nada sin haber entrado con su email. v1: acceso
// binario (adentro = todo permitido), sin roles — mismo modelo de permisos
// que ya tenía el artifact ("cualquiera con el link"), ahora al menos detrás
// de una identidad real por persona.
export default function Auth({ children }) {
  const [session, setSession] = useState(undefined); // undefined = cargando
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const sendMagicLink = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setSending(false);
    if (err) setError(err.message);
    else setSent(true);
  };

  if (session === undefined) {
    return (
      <div style={authStyles.wrap}>
        <p style={authStyles.muted}>Cargando…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={authStyles.wrap}>
        <div style={authStyles.card}>
          <h1 style={authStyles.h1}>Bitácora de Crítica UI</h1>
          <p style={authStyles.sub}>Acceso solo para el equipo. Entrá con tu email.</p>
          {sent ? (
            <p style={authStyles.sentMsg}>
              Te mandamos un link a <strong>{email}</strong>. Abrilo desde este mismo navegador.
            </p>
          ) : (
            <form onSubmit={sendMagicLink} style={authStyles.form}>
              <input
                type="email"
                required
                placeholder="vos@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={authStyles.input}
              />
              <button type="submit" disabled={sending} style={authStyles.button}>
                {sending ? "Enviando…" : "Mandarme el link"}
              </button>
              {error && <p style={authStyles.error}>{error}</p>}
            </form>
          )}
        </div>
      </div>
    );
  }

  return children;
}

const authStyles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#fafafa",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    background: "#fff",
    border: "1px solid rgba(24,24,27,0.09)",
    borderRadius: 16,
    boxShadow: "0 4px 14px rgba(24,24,27,0.08)",
    padding: "32px 28px",
    width: 340,
  },
  h1: { fontSize: 18, fontWeight: 650, margin: "0 0 6px", color: "#18181b" },
  sub: { fontSize: 13, color: "#71717a", margin: "0 0 20px" },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  input: {
    fontSize: 14,
    padding: "9px 11px",
    borderRadius: 8,
    border: "1px solid rgba(24,24,27,0.16)",
  },
  button: {
    fontSize: 13,
    fontWeight: 600,
    padding: "9px 14px",
    borderRadius: 8,
    border: "none",
    background: "#5b45e0",
    color: "#fff",
    cursor: "pointer",
  },
  sentMsg: { fontSize: 13.5, color: "#3b4038", lineHeight: 1.5 },
  error: { fontSize: 12.5, color: "#c0392b", margin: 0 },
  muted: { color: "#71717a", fontFamily: "-apple-system, sans-serif" },
};
