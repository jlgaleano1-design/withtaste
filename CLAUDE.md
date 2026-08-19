# CLAUDE.md — Bitácora de Crítica UI

Contexto persistente para Claude Code. Leé esto al empezar cada sesión — no
vuelvas a pedir que se re-explique el proyecto.

## Qué es esto

Herramienta de crítica de interfaces asistida por IA: se sube una captura mobile
(JPG/PNG), Claude la evalúa contra un criterio documentado y versionado, y queda
como propuesta hasta que una persona del equipo la aprueba, rechaza o edita.

**Estado actual:** MVP funcional de punta a punta, v1.9. Corre hoy como un
artefacto de Claude.ai con storage compartido (no hay backend propio todavía).
**Este repo es el primer paso hacia sacarlo de ahí.**

## Dónde está todo (no dupliques esta info, andá a leerla)

- `README.md` — overview y estructura general.
- `docs/CRITERIOS-DE-CRITICA.md` — **la fuente de verdad real.** Historial completo
  de versiones (v1.0→v1.9), taxonomía de 3 categorías, sistema de puntuación,
  decisiones de arquitectura, qué falta ("Balde 2"). Leelo antes de tocar cualquier
  lógica de criterio.
- `docs/research/CRITERIA-BACKLOG.md` — workflow de curación de criterios (rúbrica
  de 4 ejes, corte de promoción ≥9/12) y candidatos evaluados pero no promovidos.
- `docs/research/` — investigación de origen: Design Judgment Handoff,
  UX Component Critique Criteria, snapshot y dataset filtrado de UICrit.
- `app/ui-critique-repo.jsx` — la app completa (React, un solo archivo,
  actualmente ~300KB porque incluye datos de UICrit embebidos).

## Reglas que no se negocian (aprendidas a las malas en la conversación original)

1. **3 categorías de contenido, namespaces separados, nunca se mezclan:**
   - `criterion:` = documentación externa (WCAG, Nielsen, etc.) — no pasó por
     nuestro ojo.
   - `external-reference:` = datasets visuales de terceros (hoy: UICrit) — no pasó
     por nuestro ojo, **100% mobile, cero web/desktop sin excepciones.**
   - `critique:` = nuestro propio corpus — solo cuenta lo que tiene
     `status: "approved"` por un humano real.
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
6. **max_tokens de las llamadas a la API de Claude está fijado en 1000** — es una
   restricción del entorno de artefactos, no la cambies sin saber por qué existe.

## Qué falta (Balde 2 — ver detalle completo en CRITERIOS-DE-CRITICA.md)

RAG semántico real (embeddings), grafo de criterios en conflicto, base de datos
relacional real, suite formal de evaluación, autenticación por usuario. Ninguno es
"siguiente paso obvio" — solo se justifican si el volumen realmente lo exige.

## Estilo de trabajo esperado

- Español, directo, sin relleno — así se escribió toda la documentación del
  proyecto, mantené el tono.
- Antes de asumir algo sobre el estado del proyecto, leé `CRITERIOS-DE-CRITICA.md`
  primero — probablemente ya está documentado ahí.
