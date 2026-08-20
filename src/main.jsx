import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { installSupabaseStorage } from "./supabaseStorage.js";
import Auth from "./Auth.jsx";
import App from "../app/ui-critique-repo.jsx";

// Atajo SOLO para desarrollo local: ?preview=1 salta el login Y reemplaza el
// storage de Supabase por uno en memoria (nunca toca la base real). Gateado
// con import.meta.env.DEV, así que NUNCA existe en el build de producción
// (vite build) — no es un agujero de seguridad real. Sirve para ver/clickear
// la UI (checks, edición, agregar hallazgo, analizar una imagen nueva) sin
// login y sin escribir nada en Supabase; se pierde todo al recargar.
const skipAuthForPreview =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has("preview");

if (skipAuthForPreview) {
  const mem = new Map();
  // Hallazgos reales de una crítica ya guardada (bajados de la base solo
  // como texto, sin la imagen) — para poder ver la lista de hallazgos con
  // datos de verdad y no un lorem ipsum.
  mem.set(
    "critique:demo-preview-1",
    JSON.stringify({
      id: "demo-preview-1",
      title: "Test (vista previa local, sin login)",
      createdBy: "jos",
      createdAt: Date.now(),
      status: "pending",
      reviewedBy: "",
      reviewedAt: null,
      reviewNotes: "",
      criteriaVersion: "v1.11 · 19 ago 2026",
      contextTags: ["Dashboard / datos densos"],
      detectedScreen: { platform: "ios", components: ["navigation", "menu", "buttons"], screenType: "configuracion" },
      imageDataUrl: "",
      critique: {
        blocks: { usability: 35, consistency: 20, artDirection: 14 },
        summary:
          "Pantalla de cuenta con estructura reconocible y navegación inferior clara. El problema funcional principal es la duplicación de 'Payment methods' en dos zonas distintas sin diferenciación contextual, más una agrupación de secciones con criterio de organización poco claro.",
        criticalFailReason: "",
        findings: [
          {
            type: "riesgo", block: "A", category: "Componentes y affordance", severity: "alta", confidence: "alta",
            principle: "Heurística de Nielsen #6 — Reconocer antes que recordar",
            issue: "'Payment methods' aparece como acceso rápido superior Y como ítem de lista en 'My account', sin distinción de propósito.",
            recommendation: "Eliminá la duplicación: dejá 'Payment methods' solo en la sección 'My account' o diferenciá explícitamente las dos instancias con contexto.",
            validationNeeded: "",
            anchor: { x: 78, y: 22 },
          },
          {
            type: "riesgo", block: "A", category: "Jerarquía visual", severity: "media", confidence: "alta",
            principle: "Fluent 2 — button usage; Gestalt — similitud",
            issue: "Las tres tarjetas superiores (Orders, Help, Payment methods) tienen igual peso visual sin indicar jerarquía de importancia ni frecuencia de uso.",
            recommendation: "Destacá visualmente el ítem de mayor uso (ej. Orders) con tamaño, color o posición privilegiada respecto a Help y Payment methods.",
            validationNeeded: "",
            anchor: { x: 50, y: 18 },
          },
          {
            type: "riesgo", block: "B", category: "Consistencia y sistema de diseño", severity: "media", confidence: "alta",
            principle: "Gestalt — proximidad; Heurística de Nielsen #4",
            issue: "'Benefits' agrupa Credits, Coupons y Loyalty; 'My account' agrupa RappiPro, Addresses y Payment methods. El criterio de separación no es evidente para el usuario.",
            recommendation: "Renombrá las secciones con criterios claros o reorganizá los ítems por tipo de acción (configuración vs. recompensas) con un criterio explícito y consistente.",
            validationNeeded: "",
            anchor: null,
          },
          {
            type: "hipotesis", block: "A", category: "Accesibilidad", severity: "media", confidence: "media",
            principle: "WCAG 2.2 — 1.4.3; WCAG 2.2 AA — contraste",
            issue: "El texto secundario 'Edit profile' en gris claro sobre fondo gris claro puede no alcanzar contraste 4.5:1 requerido para texto normal.",
            recommendation: "Verificá el ratio de contraste del texto 'Edit profile' y ajustá el color a un gris más oscuro si no supera 4.5:1.",
            validationNeeded: "Medir el ratio de contraste exacto entre el color del texto 'Edit profile' y su fondo usando un analizador de contraste.",
            anchor: { x: 35, y: 8 },
          },
        ],
        wins: [
          {
            category: "Componentes y affordance", confidence: "alta",
            principle: "Apple HIG — tab bar",
            description: "La tab bar inferior usa iconografía estándar y el ítem activo se distingue claramente del resto.",
            anchor: { x: 50, y: 96 },
          },
          {
            category: "Copy y microcopy", confidence: "media",
            principle: "Steve Krug — Don't Make Me Think",
            description: "Los labels de cada acceso rápido (Orders, Help, Payment methods) son cortos y describen la acción sin ambigüedad.",
            anchor: null,
          },
        ],
      },
    })
  );

  window.storage = {
    async get(key) {
      return mem.has(key) ? { value: mem.get(key) } : null;
    },
    async set(key, value) {
      mem.set(key, value);
      return true;
    },
    async delete(key) {
      mem.delete(key);
      return true;
    },
    async list(prefix) {
      return { keys: [...mem.keys()].filter((k) => k.startsWith(prefix)) };
    },
  };
} else {
  installSupabaseStorage();
}

const Root = skipAuthForPreview ? (
  <App />
) : (
  <Auth>
    <App />
  </Auth>
);

createRoot(document.getElementById("root")).render(<StrictMode>{Root}</StrictMode>);
