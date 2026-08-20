# Bitácora de Crítica UI

Herramienta de crítica de interfaces asistida por IA: se sube una captura
(JPG/PNG), Claude la evalúa contra un criterio documentado y versionado, y
queda como propuesta hasta que una persona del equipo la aprueba, rechaza o
edita. Es una web app propia (Vite + React), desplegada en Vercel, con
Supabase como backend (auth por magic link + storage clave-valor) y una
función serverless propia (`api/critique.js`) que guarda la API key de
Anthropic del lado del servidor. Ya no corre como artefacto de Claude.ai.

## Estado del proyecto

**Versión del criterio:** v1.15 (20 ago 2026) — 212 criterios de
documentación (categoría 1), 14 heurísticas con pesos contextuales, taxonomía
de contexto de dos capas (tipo de experiencia + consideraciones), severidad
de 4 niveles, y una dimensión nueva de Patrones oscuros. Ver
`docs/CRITERIOS-DE-CRITICA.md` para el historial completo — es la fuente de
verdad real, este README es solo el overview.

La app usa un pipeline de varios pasos antes de generar una crítica:
clasifica la pantalla, matchea contra la base de criterios (filtrado por
tags, no RAG semántico todavía) + referencias externas de UICrit +
críticas propias ya aprobadas, calcula pesos heurísticos según el contexto
elegido, y recién ahí genera la crítica con solo lo relevante.

## Cómo correrlo

1. `npm install`
2. Variables de entorno (ver `.env.local`, gitignoreado — pedirle al equipo
   los valores reales, no inventarlos): `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_PUBLISHABLE_KEY` (cliente), `ANTHROPIC_API_KEY` (solo
   servidor, la usa `api/critique.js`, nunca debe llegar al bundle del
   cliente).
3. `npm run dev` levanta el front. Para que el proxy serverless
   (`/api/critique`) funcione en local hace falta correr con `vercel dev` en
   vez de `vite` solo, o apuntar a la instancia ya desplegada.
4. Login por magic link (Supabase Auth) — cualquiera con acceso de email
   entra, sin roles todavía (ver "Limitaciones conocidas").

## Estructura

```
app/
  ui-critique-repo.jsx      → la app completa (React, un solo archivo, ~530KB)

api/
  critique.js                → función serverless de Vercel: guarda
                                ANTHROPIC_API_KEY del lado del servidor y
                                hace de proxy hacia la API de Claude.

src/
  main.jsx, Auth.jsx,
  supabaseClient.js,
  supabaseStorage.js         → bootstrap de la app, login por magic link, y
                                el shim de storage que expone window.storage
                                sobre Supabase (kv_store).

docs/
  CRITERIOS-DE-CRITICA.md   → fuente de verdad del criterio: qué usa Claude
                               para evaluar, por qué, y el historial de
                               versiones. Editar ESTE archivo Y el
                               RUBRIC_PROMPT/SEED_CRITERIA* dentro del .jsx
                               cuando cambie algo — deben quedar
                               sincronizados.

  research/CRITERIA-BACKLOG.md
                               → workflow de curación de criterios (rúbrica
                                 de 4 ejes, corte de promoción ≥9/12),
                                 candidatos evaluados y no promovidos, y
                                 próximas rondas sugeridas.

  prompts/
    PROMPT-EXTRACCION-ANATOMIA.md
                               → prompt reutilizable para pedirle a un agente
                                 con acceso web que extraiga secciones de
                                 Anatomy/Usage/States de design systems
                                 públicos, en un formato que se pueda
                                 indexar y aprobar antes de sumarlo al
                                 criterio.

  research/
    Design_Judgment_Knowledge_Base_Handoff_2026-08-19.docx
                               → investigación de ~130 fuentes (roadmap para
                                 una versión más madura del sistema — "Balde
                                 2": base de criterios versionada, RAG, grafo
                                 de conflictos, fine-tuning, evaluación
                                 formal). No implementado, documentado como
                                 backlog explícito.

    UX_Component_Critique_Criteria.pdf
                               → corpus de ~80 reglas a nivel de componente
                                 (select, modal, tabs, forms, etc.), cada una
                                 con su URL de origen. Parcialmente
                                 incorporado al RUBRIC_PROMPT en v1.4.
```

## Cómo funciona

1. Alguien del equipo entra con magic link y sube una captura mobile.
2. La imagen se comprime en el navegador. Un primer llamado clasifica la
   pantalla (plataforma, tipo, componentes visibles); eso se usa para
   matchear contra la base de criterios (categoría 1), referencias externas
   de UICrit (categoría 2) y críticas propias ya aprobadas (categoría 3), y
   para calcular los pesos heurísticos según el contexto elegido.
3. Un segundo llamado (`claude-sonnet-4-6`, con visión) recibe la imagen +
   `RUBRIC_PROMPT` + solo lo relevante de las tres bases, y devuelve un JSON
   estructurado: resumen, tres bloques de puntaje ponderados (Usabilidad 50 /
   Consistencia 30 / Dirección de arte 20), y una lista de hallazgos — cada
   uno con categoría, bloque, tipo epistémico
   (violación/riesgo/hipótesis/convención/preferencia), severidad (4
   niveles), heurística más relevante, confianza, principio de origen, y
   recomendación.
4. Si Usabilidad < 30/50, se marca fallo crítico automáticamente (calculado
   en el código, no depende de que el modelo lo marque bien).
5. Todo se guarda en Supabase (`kv_store`, namespaces separados por
   categoría). Cualquiera logueado puede aprobar, rechazar o dejar
   pendiente, con su nombre y notas — al aprobar, retroalimenta la próxima
   crítica.

## Limitaciones conocidas (léase antes de asumir más de lo que hay)

- **Auth es binaria, sin roles.** Cualquiera que entre con magic link ve y
  puede modificar todo — no hay permisos diferenciados todavía.
- **No es una base de datos relacional.** Es almacenamiento clave-valor
  sobre una sola tabla de Supabase (`kv_store`) — funciona bien al volumen
  actual, pero no tiene queries relacionales ni un grafo de criterios.
- **El criterio vive en una base de registros con retrieval por tags**, no
  en un RAG semántico real (embeddings). Es intencional por ahora — ver
  "Balde 2" en `docs/CRITERIOS-DE-CRITICA.md` para el plan de cuándo y por
  qué migrar.
- **La categoría 4 (feedback real de clientes) está reservada en la
  taxonomía pero no implementada** — sin modelo de datos, sin UI de carga,
  sin namespace activo. Ver `docs/CRITERIOS-DE-CRITICA.md`.

## Estado del despliegue

- **GitHub:** `github.com/jlgaleano1-design/withtaste` (público).
- **Vercel:** proyecto `withtaste` (team `vendonar`), auto-deploy en cada
  push a `main`. Dominio: `withtaste.vercel.app`.
- **Supabase:** proyecto `WithTaste`, tabla `kv_store` (auth por magic link +
  storage). La base de criterios se siembra sola la primera vez que alguien
  abre la app después de un deploy con criterios nuevos — no hace falta
  cargarla a mano.
