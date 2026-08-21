# CLAUDE.md — Bitácora de Crítica UI

Contexto persistente para Claude Code. Leé esto al empezar cada sesión — no
vuelvas a pedir que se re-explique el proyecto.

## Qué es esto

Herramienta de crítica de interfaces asistida por IA: se sube una captura mobile
(JPG/PNG), Claude la evalúa contra un criterio documentado y versionado, y queda
como propuesta hasta que una persona del equipo la aprueba, rechaza o edita.

**Estado actual:** MVP funcional de punta a punta, v1.21 (225 criterios de
documentación). Corre como web app propia: Vite + React en Vercel
(`github.com/jlgaleano1-design/withtaste`, auto-deploy en `main`), Supabase
como backend (`kv_store` + auth por magic link), y un proxy serverless propio
(`api/critique.js`) que guarda `ANTHROPIC_API_KEY` del lado del servidor. El
salto fuera del artefacto de Claude.ai ya se hizo — este repo ya no es "el
primer paso hacia sacarlo de ahí", es donde vive ahora.

## Dónde está todo (no dupliques esta info, andá a leerla)

- `README.md` — overview, cómo correrlo local, y estado del despliegue.
- `docs/CRITERIOS-DE-CRITICA.md` — **la fuente de verdad real.** Historial completo
  de versiones (v1.0→v1.21), taxonomía de 4 categorías (la 4ta reservada,
  sin implementar), sistema de puntuación, taxonomía de contexto de dos
  capas, 14 heurísticas, decisiones de arquitectura, qué falta ("Balde 2").
  Leelo antes de tocar cualquier lógica de criterio.
- `docs/research/CRITERIA-BACKLOG.md` — workflow de curación de criterios (rúbrica
  de 4 ejes, corte de promoción ≥9/12), candidatos evaluados pero no promovidos,
  y las próximas rondas sugeridas (ISO 9241-210 desglosado, data viz por tipo
  de gráfico, re-encuestar Holloway si se consigue acceso sin paywall, etc.).
- `docs/research/` — investigación de origen: Design Judgment Handoff,
  UX Component Critique Criteria, snapshot y dataset filtrado de UICrit.
- `app/ui-critique-repo.jsx` — la app completa (React, un solo archivo,
  actualmente ~530KB porque incluye datos de UICrit embebidos — va a seguir
  creciendo con cada ronda de criterios).
- `api/critique.js` — proxy serverless a la API de Anthropic.
- `src/` — bootstrap (`main.jsx`), login (`Auth.jsx`), y el shim de storage
  sobre Supabase (`supabaseStorage.js`).

## Reglas que no se negocian (aprendidas a las malas en la conversación original)

1. **4 categorías de contenido, namespaces separados, nunca se mezclan (la 4ta reservada, sin implementar):**
   - `criterion:` = documentación externa (WCAG, Nielsen, dark patterns, etc.) —
     no pasó por nuestro ojo.
   - `external-reference:` = datasets visuales de terceros (hoy: UICrit) — no pasó
     por nuestro ojo, **100% mobile, cero web/desktop sin excepciones.**
   - `critique:` = nuestro propio corpus — solo cuenta lo que tiene
     `status: "approved"` por un humano real.
   - `client-feedback:` = **reservado, no implementado.** Feedback real de
     clientes (casos reales, no nuestra inferencia sobre una imagen) — sin
     modelo de datos ni UI todavía. Ver categoría 4 en `CRITERIOS-DE-CRITICA.md`
     antes de empezar a construirlo.
2. **El círculo de alimentación solo usa críticas `approved`** — nunca pendientes
   ni rechazadas, para que un hallazgo malo sin revisar no contamine las próximas.
3. **Cuando cambies el criterio, actualizá DOS lugares a la vez**: el
   `RUBRIC_PROMPT`/`SEED_CRITERIA*` en el `.jsx` Y `docs/CRITERIOS-DE-CRITICA.md`
   (con su entrada de changelog). Si quedan desincronizados, la documentación miente.
4. **Nunca inventes contenido de "referencias visuales externas".** Si vas a sumar
   un dataset nuevo a categoría 2, necesita: licencia verificada, filtro explícito
   de qué se incluye/excluye (ej. UICrit excluye `comments_source: llm`), y quedar
   100% acotado a mobile.
5. **Escalar la base de criterios usa el workflow de curación**, no relleno
   genérico: encuestar el universo completo de la fuente, puntuar 1-3 en
   observabilidad/evidencia/aplicabilidad mobile/accionabilidad (máx 12), promover
   solo ≥9/12. Lo que no pasa el corte va a `CRITERIA-BACKLOG.md`, no se descarta
   ni se inventa para llegar a un número.
6. **max_tokens ya no está fijado en 1000.** Esa era una restricción real del
   entorno viejo de artifacts de Claude.ai — dejó de aplicar cuando la app pasó
   a ser una web app propia con su proxy serverless (`api/critique.js`). Con
   criterios reales matcheados (más contexto de entrada), 1000 se quedaba
   corto y truncaba el JSON a mitad de camino (`stop_reason: "max_tokens"`),
   rompiendo el parseo del lado del cliente — causa real de una falla en
   producción, corregida subiendo el límite a 4096 en la llamada de crítica
   (la de clasificación se queda en 1000, le sobra). El paso de clasificación
   (`CLASSIFICATION_PROMPT`) sigue en 1000 porque su salida es chica y nunca
   se acercó al límite.

## Qué falta (Balde 2 — ver detalle completo en CRITERIOS-DE-CRITICA.md)

RAG semántico real (embeddings), grafo de criterios en conflicto, base de datos
relacional real, suite formal de evaluación, y roles/permisos diferenciados (hoy
la auth es binaria: adentro con magic link = todo permitido, sin niveles).
Ninguno es "siguiente paso obvio" — solo se justifican si el volumen realmente
lo exige.

## Estilo de trabajo esperado

- Español, directo, sin relleno — así se escribió toda la documentación del
  proyecto, mantené el tono.
- Antes de asumir algo sobre el estado del proyecto, leé `CRITERIOS-DE-CRITICA.md`
  primero — probablemente ya está documentado ahí.
