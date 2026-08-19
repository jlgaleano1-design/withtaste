# Criterio de crítica de UI — Bitácora de Crítica UI

**Versión:** 1.11 · **Última actualización:** 19 de agosto de 2026
**Estado:** vivo — se actualiza cada vez que el equipo aprueba sumar o ajustar una fuente.

Este documento es la fuente de verdad de qué principios usa Claude para evaluar cada
captura subida a la Bitácora. Cada categoría del reporte (`findings[].category`) está
respaldada por uno o más de estos marcos. Cuando cambie este documento, hay que
actualizar también el `RUBRIC_PROMPT` dentro de `ui-critique-repo.jsx` para que el
comportamiento real coincida con lo documentado acá.

---

## Estado del MVP (v1.11 — consolidado)

**MVP funcional de punta a punta**, con 4 capas de conocimiento activas antes de
cada crítica. Flujo: subir → clasificar pantalla → matchear documentación (179
criterios) + referencias externas de UICrit (mobile-only) + críticas propias ya
aprobadas → generar crítica con blocks/tipos epistémicos/fallo crítico → revisar
humano → aprobar (lo cual retroalimenta la próxima crítica).

**Contenido base:**
- **179 criterios de documentación (categoría 1)**, curados con workflow de
  puntaje ≥9/12 — 70 biblioteca de componentes (batch1) + 57 de escalado inicial
  (batch2) + 29 de la primera ronda de curación (batch3) + 7 de WCAG 2.2 AAA
  (batch4, v1.10) + 16 del catálogo de reglas de Impeccable (batch5, v1.11,
  verificado contra el código fuente real, no de memoria). Este número (179) es
  el conteo real verificado contra el código (`SEED_CRITERIA*.length` en el
  `.jsx`) — versiones anteriores de este documento decían 175, que no coincidía
  con lo efectivamente sembrado; se corrige acá para que la doc no mienta.
  Backlog de candidatos evaluados y no promovidos en `CRITERIA-BACKLOG.md`.
- 151 pantallas / 547 comentarios de UICrit (categoría 2), filtrados a `human`+`both`
  (10.286 de 11.344 elegibles en el dataset completo, preservado en
  `docs/research/uicrit-filtered-human-both.json`). Uso gateado a mobile-only.
- Círculo de alimentación de categoría 3: críticas propias aprobadas por un humano
  calibran automáticamente las próximas.

**Gobernanza:** versionado completo v1.0→v1.9 en este documento, taxonomía de 3
categorías madre, workflow de curación repetible y documentado, estructura de repo
lista para GitHub.

Ver las listas completas ("Qué tiene el MVP" / "Qué queda en Balde 2") en la
conversación del 19 ago 2026 para el detalle turno a turno.

---

## Sistema de puntuación por bloques (desde v1.3)

Cada crítica ya no tiene un único puntaje holístico — se descompone en tres bloques
ponderados sobre 100 puntos totales, para que la estética nunca pueda "tapar" un
problema de usabilidad real:

| Bloque | Peso | Qué evalúa |
|---|---|---|
| **A — Usabilidad y arquitectura funcional** | 50 pts | Heurísticas de Nielsen, accesibilidad (contraste, áreas de toque), prevención de errores, affordance, claridad del propósito. |
| **B — Consistencia sistémica y lógica de producto** | 30 pts | Reutilización de patrones, jerarquía de información coherente, consistencia con el sistema de diseño de la plataforma. |
| **C — Dirección de arte y refinamiento** | 20 pts | Espacio negativo, tipografía, color con propósito, micro-interacciones. |

**Regla de fallo crítico:** si el Bloque A queda por debajo de 30/50, la crítica se
marca como **FALLO CRÍTICO** automáticamente — sin importar qué tan bien puntúen B o
C. Este cálculo se hace de forma determinística en el código (no se confía en que el
modelo sume bien o marque el fallo correctamente), así que es una regla dura, no una
sugerencia que el modelo pueda interpretar distinto cada vez.

Cada hallazgo individual también indica a qué bloque pertenece (`finding.block`:
`"A"`, `"B"` o `"C"`), además de su categoría, severidad y principio de origen.

## Etiquetas de contexto

Al subir una imagen, quien la sube puede marcar 0 o más etiquetas de contexto, que
ajustan cómo Claude pesa la evaluación:

- **Onboarding** — prioriza progreso visible y baja carga inicial.
- **Flujo transaccional** — prioriza prevención de errores y confianza por sobre
  creatividad visual; más estricto en Bloque A.
- **Alta carga cognitiva** — prioriza Ley de Miller y agrupación Gestalt.
- **Dashboard / datos densos** — evalúa contra patrones de IBM Carbon para tablas.
- **Exploración / descubrimiento** — el Bloque C tiene más margen.
- **Marketing / landing** — el Bloque C pesa más en la impresión general, pero el
  Bloque A sigue siendo innegociable.

## Compatibilidad con críticas anteriores

Las críticas generadas antes de v1.3 quedaron con el formato viejo (`overallScore`
sobre 10, sin bloques). La app las sigue mostrando correctamente — no se pierden ni
se migran automáticamente — pero no tienen desglose por bloque ni fallo crítico
calculado.

---

## Tipos epistémicos por hallazgo (desde v1.4 — "Balde 1", implementado)

Cada hallazgo ahora lleva un campo `type` que separa **qué tan seguro es el
hallazgo**, no solo qué tan grave:

| Type | Qué significa | Ejemplo de fuente |
|---|---|---|
| `violacion` | Contradice un criterio normativo claro | WCAG AA, comportamiento de teclado de ARIA APG |
| `riesgo` | Evidencia empírica sugiere un problema, no es regla absoluta | Baymard, estudios de aesthetics-usability |
| `hipotesis` | Sospecha razonable que requiere interacción/datos para confirmarse | — |
| `convencion` | Se aparta de una convención madura de plataforma, no de una ley universal | Apple HIG, GOV.UK, Fluent 2 |
| `preferencia` | Es gusto/dirección de arte, nunca se mezcla con Bloque A | — |

Además cada hallazgo tiene un campo `confidence` (alta/media/baja) — independiente
de `severity`. `severity` mide impacto si el hallazgo es real; `confidence` mide qué
tan seguro está el modelo de que la observación y su aplicación del criterio son
correctas.

## Disciplina de observabilidad (desde v1.4)

Regla dura: el modelo ve una única imagen estática, nunca puede afirmar como hecho
algo que solo se confirmaría con interacción, analítica o datos de producto (ej.
"esto aumenta el abandono", "el foco de teclado funciona mal"). Si un hallazgo
requiere ese tipo de evidencia, se marca `type: "hipotesis"` y se completa
`validationNeeded` explicando qué habría que observar para confirmarlo. Esto viene
directo del "Design Judgment Knowledge Base Handoff" (sección 11, "screenshot-only
is not enough").

## Anti-patrones prohibidos (desde v1.4)

Reglas explícitas en el prompt para que el modelo nunca:
- Confunda prevalencia con calidad ("la mayoría lo hace así, por lo tanto está bien").
- Trate una convención de plataforma como ley universal ("Apple dice X, por lo tanto todos deben hacer X").
- Confunda "poco convencional" con "inutilizable".
- Invente comportamiento de teclado, tiempos de respuesta o datos de embudo desde una imagen.
- Proponga una solución antes de establecer el problema y su evidencia.
- Use relleno genérico ("mejorá la jerarquía") sin objetivo concreto ni criterio citado.
- Afirme causalidad de negocio ("esto va a aumentar la conversión") sin evidencia real.
- Reduzca accesibilidad solo a contraste de color.
- Cite una "ley" popular de UX como verdad establecida sin respaldo.

## Arquitectura de retrieval por tags (desde v1.5)

Hasta v1.4, la biblioteca de componentes vivía como texto fijo pegado dentro del
`RUBRIC_PROMPT` — se mandaba entera en cada crítica, sin importar qué había en la
imagen. Desde v1.5 eso cambió:

1. **La base de criterios es un dato real**, no texto de prompt. Cada criterio es un
   registro individual guardado en el storage compartido del artefacto
   (`criterion:{id}`), con campos: `statement`, `dimension`, `component`,
   `evidenceTier`, `principle`, `sourceUrl`.
2. **Antes de cada crítica, un primer llamado barato clasifica la imagen**:
   `screenType` (checkout, dashboard, formulario, etc.), `components` visibles
   (select, modal, tabs, form, etc.) y `platform`.
3. **Se matchea esa clasificación contra la base** (filtrado por etiqueta — no hay
   embeddings todavía, no es RAG semántico) y se arma un bloque de "criterios
   aplicables a esta pantalla" con máximo 40 resultados.
4. **Recién ahí se manda la crítica real**, con el prompt base (heurísticas
   generales, bloques de puntaje, anti-patrones, disciplina de observabilidad) más
   solo los criterios que matchearon — no la base entera.
5. Cada crítica guarda `detectedScreen` y `matchedCriteriaIds` para que quede
   trazable qué se detectó y qué criterios se usaron.

**Por qué esto no es RAG "de verdad" todavía:** no hay embeddings ni búsqueda
semántica — es coincidencia exacta de etiqueta (`component` detectado vs.
`component` del criterio). Para nuestro volumen actual alcanza y es gratis de
mantener; si la base crece mucho o las etiquetas dejan de alcanzar, ahí sí
correspondería un vector store real (ver Balde 2 más abajo).

**Semilla inicial (`SEED_CRITERIA`):** 65 criterios atómicos, migrados 1 a 1 desde
el PDF "UX Component Critique Criteria" (Open UI, ARIA APG, GOV.UK, SLDS, Atlassian,
Uber Base Web, Fluent 2), cada uno con su URL de origen real. Se siembran una sola
vez en el storage la primera vez que alguien abre la pestaña "Ver criterio" o sube
una imagen (chequeo idempotente, no se duplican).

## Biblioteca de componentes (contenido migrado a la base de criterios en v1.5)

Síntesis de **Open UI, WAI-ARIA APG, GOV.UK, Salesforce Lightning, Atlassian, Uber
Base Web y Microsoft Fluent 2**, con regla-por-regla citando URL de origen. Cubre 12
familias: Select/Dropdown, Combobox/Autocomplete, Dialog/Modal, Tabs, Accordion,
Forms, Validación/errores, Buttons, Notifications/Toasts, Data tables, Empty states,
Menús/Navegación — más un catálogo de estados transversales (default, hover, focus,
active, selected, expanded/collapsed, disabled, loading, empty, error, warning,
success).

**Jerarquía de confianza propia del corpus** (adoptada tal cual, guardada en el
campo `evidenceTier` de cada registro):
1. **Alta** — WAI-ARIA APG para accesibilidad, foco, semántica y teclado.
2. **Media-alta** — GOV.UK y Fluent 2 para uso y anti-patrones; Atlassian/Base
   Web/SLDS cuando la documentación pública es explícita.
3. **Media** — recomendaciones específicas de un único design system.
4. **Contextual** — Open UI research comparativo; nunca se convierte en regla
   universal.

**Limitaciones que el propio corpus reconoce** (se respetan tal cual): algunas
páginas de Salesforce Lightning cargan contenido dinámicamente y no se completa por
inferencia; Base Web y Atlassian tienen documentación pública parcial en algunas
áreas; el Audi Brand Styleguide no expone documentación técnica verificable de
anatomía/estados/configurador, así que no se le atribuyen reglas de selección o
pricing inferidas solo por observar su configurador.

El corpus original con las reglas completas se conserva en
`UX_Component_Critique_Criteria.pdf` (ver `docs/research/`).

---

## 1. Jerarquía visual
- **Principios de Gestalt** (proximidad, región común, similitud, cierre): cómo el ojo
  agrupa elementos relacionados.
- **Refactoring UI** (Wathan & Schoger): peso visual, tamaño relativo y contraste como
  herramientas para guiar la atención.
- **Ley de Fitts**: elementos más importantes deben ser más grandes y estar más cerca
  del punto de interacción esperado.

## 2. Consistencia y sistema de diseño
- **Heurística de Nielsen #4** — Consistencia y estándares.
- **Ley de Jakob** — las personas pasan la mayor parte de su tiempo en otros
  productos; esperan que el tuyo se comporte parecido a los que ya conocen.
- **Apple HIG / Material Design 3 / Fluent Design** — cuando la interfaz vive en una
  plataforma específica, se evalúa contra las convenciones de esa plataforma.
- **IBM Carbon Design System** — referencia para interfaces empresariales o con alta
  densidad de datos: rigor en tokens, estados de componentes (disabled, error, focus)
  y coherencia en grillas complejas.

## 3. Tipografía
- **Refactoring UI** — escala tipográfica, jerarquía por peso y tamaño, line-height.
- **Butterick's Practical Typography / Thinking with Type (Lupton)** — legibilidad,
  medida de línea, espaciado, jerarquía editorial.

## 4. Color y contraste
- **WCAG 2.2 (nivel AA)** — ratio mínimo 4.5:1 para texto normal, 3:1 para texto
  grande y componentes de UI.
- **Material Design — sistema de roles de color** (primario, secundario, superficie)
  como referencia de coherencia y jerarquía por color.
- **Refactoring UI** — uso de color con propósito, no decorativo.

## 5. Espaciado y alineación
- **Gestalt — ley de proximidad** — el espacio en blanco comunica relación o
  separación entre elementos.
- **Refactoring UI** — sistemas de espaciado consistentes (escalas, grillas).

## 6. Componentes y affordance
- **Heurística de Nielsen #1** — Visibilidad del estado del sistema.
- **Heurística de Nielsen #6** — Reconocer antes que recordar.
- **Don Norman, "The Design of Everyday Things"** — affordances y signifiers: un
  elemento debe comunicar visualmente cómo se usa.
- **Ley de Fitts / WCAG** — tamaño mínimo de objetivos táctiles (44×44px).
- **IBM Carbon Design System** — patrones documentados para tablas de datos
  (ordenamiento, filtrado, paginación), notificaciones con severidad clara, y
  componentes densos en información — útil específicamente para dashboards y
  herramientas internas/enterprise.

## 7. Copy y microcopy
- **Heurística de Nielsen #2** — Coincidencia entre el sistema y el mundo real
  (lenguaje familiar para la persona usuaria, no términos técnicos internos).
- **Steve Krug, "Don't Make Me Think"** — claridad ante todo; si hay que pensar para
  entender un texto, ya perdió.
- Voz activa, mensajes de error específicos y accionables (no genéricos).
- **Shopify Polaris** — guías de voz y tono ampliamente citadas como referencia de
  industria; catálogo de estados de error y estados vacíos particularmente maduro,
  útil para evaluar mensajes de error, validaciones y pantallas sin contenido.

## 8. Accesibilidad
- **WCAG 2.2 nivel AA** en su totalidad para lo evaluable desde una imagen estática:
  contraste, tamaño de texto, tamaño de objetivos táctiles, uso de color como único
  indicador de estado, jerarquía visual de encabezados.
- Nota: una imagen no permite evaluar accesibilidad técnica real (lectores de
  pantalla, orden del DOM, navegación por teclado) — el reporte solo cubre lo
  observable visualmente.

## 9. Claridad del propósito
- **Heurísticas de Nielsen #1 y #6.**
- **Ley de Hick** — más opciones visibles aumentan el tiempo de decisión; se marca
  cuando una pantalla ofrece demasiadas alternativas sin priorización.
- **Baymard Institute** — patrones de fricción conocidos en flujos de e-commerce,
  checkout y formularios, cuando aplica al tipo de pantalla evaluada.
- **Shopify Polaris** — enfoque en confianza y baja fricción en flujos
  transaccionales; útil para evaluar si una pantalla genera dudas o vacilación antes
  de una acción importante (pagar, confirmar, eliminar).

---

## Consideraciones transversales (no son categoría propia, pero pueden aparecer en cualquier hallazgo)
- **Efecto Zeigarnik** — procesos multi-paso sin indicador de progreso generan
  fricción percibida.
- **Ley de Miller (7±2)** — exceso de elementos simultáneos sin agrupar sobrecarga
  la memoria de trabajo.

---

## Fuentes completas

| Fuente | Tipo | Acceso |
|---|---|---|
| Nielsen's 10 Usability Heuristics (NN/G) | Heurísticas | Gratis |
| Shneiderman's 8 Golden Rules | Heurísticas | Gratis |
| Laws of UX (Jon Yablonski / lawsofux.com) | Leyes de psicología aplicada | Gratis (sitio) / libro pago |
| Principios de Gestalt | Psicología de la percepción | Gratis |
| Apple Human Interface Guidelines | Guía de plataforma | Gratis, oficial |
| Google Material Design 3 | Guía de plataforma | Gratis, oficial |
| Microsoft Fluent Design System | Guía de plataforma | Gratis, oficial |
| WCAG 2.2 (W3C) | Estándar de accesibilidad | Gratis, oficial |
| Baymard Institute | Investigación aplicada (e-commerce) | Mixto (blog gratis / reportes pagos) |
| The Design of Everyday Things — Don Norman | Libro fundacional | Pago |
| Don't Make Me Think — Steve Krug | Libro fundacional | Pago |
| Refactoring UI — Wathan & Schoger | Libro práctico | Pago |
| Universal Principles of Design — Lidwell | Libro de referencia | Pago |
| Butterick's Practical Typography | Tipografía | Gratis (online) |
| Nielsen & Molich (1990), CHI '90 | Paper académico fundacional | Gratis (ACM/citado en arXiv) |
| IBM Carbon Design System | Guía de plataforma (enterprise / datos densos) | Gratis, oficial |
| Shopify Polaris | Guía de plataforma (producto de conversión, voz y tono) | Gratis, oficial |
| `ehmo/platform-design-skills` (GitHub) | Repo open source, no importado literalmente todavía | Open source |
| Impeccable (impeccable.style / `pbakaus/impeccable`) | Skill de diseño para agentes de código, 47 reglas determinísticas evaluadas en v1.11 | Open source (Apache 2.0) |

*Nota:* de los libros con derechos de autor, se aplican los **principios/conceptos**
(que no son propiedad de nadie), nunca se reproduce texto textual de esas obras.

---

## Alcance: mobile / producto — web pausado (desde v1.6, resuelto en v1.7)

Decisión final:
- **Categoría 1 (Documentación):** lo que ya tenemos de fuentes web se queda tal
  cual está — no se poda ni se despriorizan las 65 entradas actuales aunque su
  fuente técnica sea web (GOV.UK, Fluent 2 React, ARIA). El concepto de fondo suele
  aplicar igual a mobile. Extracción futura de documentación nueva prioriza mobile,
  pero no excluye web si aparece.
- **Categoría 2 (Referencias visuales externas):** regla estricta, sin excepciones.
  Se omite el 100% de lo que sea web o desktop. Solo entra contenido mobile/app
  (ej. UICrit, que ya es 100% mobile por venir de RICO — cumple la regla de por sí).

## Las 3 categorías madre (formalizado en v1.6)

No es "escrito vs. visual" — es **si pasó o no por nuestro control humano**:

| # | Categoría | Qué es | Namespace en storage | ¿Pasó por nuestro ojo? |
|---|---|---|---|---|
| 1 | **📚 Documentación** | Reglas escritas de fuentes externas (WCAG, Nielsen, GOV.UK, dark patterns, i18n, IA, data viz, estética) | `criterion:` | No |
| 2 | **🖼️ Referencias visuales externas** | Datasets de críticas visuales de terceros sobre pantallas reales (ej. UICrit) | `external-reference:` (namespace nuevo, sin implementar en la app todavía) | No |
| 3 | **✅ Nuestro corpus propio** | Cada pantalla que subimos, criticamos, y un humano del equipo aprobó | `critique:`, filtrado por `status: "approved"` | **Sí** |

Ninguna categoría se mezcla con otra. Categoría 2 nunca entra a `criterion:` ni a
`critique:` — necesita su propio namespace.

### Categoría 2 — estado actual (v1.8: importado de verdad)

**UICrit (Google Research).** Estado: 🟢 **Importado.** El CSV real fue subido a la
conversación (`uicrit_public.csv`, 4,9 MB, 2.981 filas) y procesado:
- Total de comentarios en el dataset: **11.344**.
- Filtrados a `human` + `both` (regla de inclusión): **10.286** (91%).
- Excluidos por ser `llm` puro: **1.058** (9%).
- Pantallas únicas con al menos un comentario elegible: **2.972** de 1.000 rico_id.

**Dataset filtrado completo** (10.286 comentarios, 5,2 MB) guardado íntegro en
`docs/research/uicrit-filtered-human-both.json` — es la fuente completa, sin
recortar.

**Muestra viva en la app** (`external-reference:` namespace, separado de
`criterion:` y `critique:`): **151 pantallas, 547 comentarios** — una porción
representativa, no el dataset completo. Elegida por estratificación de
`design_quality_rating` (para cubrir pantallas de baja y alta calidad, no solo las
primeras del CSV). Motivo de no embeber las 10.286 completas: el archivo de la app
ya pesa ~300 KB con esta muestra; las 10.286 completas equivaldrían a varios MB
embebidos directo en el código del artefacto, lo cual degrada el rendimiento del
artefacto y el costo de cada carga — no es una limitación arbitraria, es una
decisión de ingeniería. Se puede ampliar la muestra en rondas futuras si hace
falta más cobertura.

**Cómo se usa hoy:** antes de cada crítica, si la pantalla detectada es mobile (**nunca
si es web o desktop — regla dura, sin excepciones**), se buscan hasta 2 referencias
de UICrit cuyo `task` se relacione con el tipo de pantalla detectado, y se inyectan
como inspiración explícitamente marcada como "no normativa, no es nuestro criterio
oficial" — nunca se confunden con documentación (categoría 1) ni con nuestro propio
corpus aprobado (categoría 3).

Licencia: CC BY 4.0 (confirmada). Ver snapshot del repo en
`UICRIT-SNAPSHOT-2026-08-19.md`.

### Categoría 3 — el círculo de alimentación (v1.8: construido)

Ya no es solo un plan — está implementado. Antes de cada crítica nueva, la app:
1. Busca en `critique:` solo los registros con `status === "approved"`.
2. Matchea por similitud de pantalla/componentes detectados (mismo mecanismo de
   retrieval por tags que usamos para documentación).
3. Inyecta hasta 4 críticas propias aprobadas como calibración de tono y nivel de
   detalle — explícitamente marcadas como referencia de estilo, no una lista a
   repetir literalmente.
4. Cada crítica nueva guarda `matchedPastCritiqueIds` para trazabilidad de qué
   ejemplos propios la calibraron.

Nunca se usan críticas pendientes o rechazadas — solo lo que un humano aprobó
explícitamente, como se decidió desde el principio.

---

## Decisiones de arquitectura evaluadas

**19 ago 2026 — Propuesta de base de datos relacional (Airtable/Notion) + sistema de
pesos con fail crítico.** Otro colaborador del proyecto sugirió migrar a 4 tablas
relacionadas (`UI Patterns`, `HCI & Heurísticas`, `Dirección de Arte & UI`,
`Criterios de Evaluación`) en Airtable, con tagging de contexto
(`Alta Carga Cognitiva`, `Flujo Transaccional`, `Onboarding`) y un sistema de
puntuación en tres bloques ponderados (Usabilidad 50% / Consistencia 30% /
Dirección de arte 20%) con un "fail crítico" si Usabilidad < 30/50.

Decisión: **se adopta el sistema de pesos y el tagging de contexto** — implementado
en v1.3 (ver sección "Sistema de puntuación por bloques" arriba). **Se difiere la
migración a Airtable/Notion**: hoy el storage nativo de artefactos alcanza para el
volumen actual y no requiere gestionar una cuenta ni una API key externa. Se
reevaluará si el equipo necesita cruzar patrones entre críticas de formas que el
JSON plano ya no permita.

---

## 🔵 BALDE 2 — CTA para el futuro (avance real en v1.11)

- 🟡 **Base de criterios atómicos** — de 65 a **179 registros reales**
  (verificado contra el código: 70 biblioteca de componentes + 57 de escalado
  inicial + 29 de la primera ronda del workflow de curación + 7 de WCAG 2.2 AAA
  (v1.10) + 16 del catálogo de reglas de Impeccable (v1.11)). Objetivo
  original: 1.500-2.000. **Se adoptó un workflow de curación en vez de
  perseguir el número a la fuerza** (ver `CRITERIA-BACKLOG.md`): encuestar el
  universo completo de cada fuente, puntuar cada candidato 1-3 en
  observabilidad / evidencia / aplicabilidad mobile / accionabilidad (máx 12), y
  promover solo lo que puntúa ≥9/12. Lo que no pasa el corte queda documentado
  en el backlog, no se pierde. Cada ronda de este tamaño suma ~7-35 criterios
  reales — llegar a 1.500-2.000 con este rigor son varias decenas de rondas, no
  una sola sesión.
- ✅ **Retrieval antes de generar** — funcionando, ahora con tres tipos de
  contenido: criterios "core" (WCAG/Nielsen fundamentales, siempre elegibles),
  criterios por tag de contexto (dark patterns, i18n, IA, data viz, estética — solo
  si el usuario marcó el tag relevante), y criterios por componente (biblioteca
  original). Ver "Arquitectura de retrieval por tags" arriba.
- ✅ **Categoría 2 (UICrit)** — importado con filtro real (10.286 de 11.344
  comentarios, ver sección de categorías arriba). Muestra de 151 pantallas viva en
  la app; dataset completo filtrado preservado en `docs/research/`.
- ✅ **Circulo de alimentación de categoría 3** — construido y funcionando (ver
  sección de categorías arriba). Solo críticas propias aprobadas por un humano.
- 🔴 **RAG semántico real** (embeddings + vector store) — **replanteado en
  v1.10, luego bloqueado por red.** La premisa de "necesita backend propio" no
  era del todo cierta: al volumen actual (163 criterios) se puede precalcular un
  embedding por criterio UNA vez y guardarlo como dato estático, y comparar por
  similaridad coseno en JS puro al momento de la crítica — sin vector DB, sin
  servidor. Se probó con una API key real de Voyage AI (partner de embeddings de
  Anthropic) y **`api.voyageai.com` está bloqueado por la política de egress de
  red de este entorno de ejecución** (403 en el CONNECT). No es un problema de
  la key ni del diseño — hace falta habilitar ese host a nivel de organización,
  o generar los embeddings desde otro entorno con acceso real a internet. El
  script de generación (`scripts/generate-embeddings.mjs`) y la función de
  similaridad coseno ya están escritos y listos para correr en cuanto haya
  acceso — ver `scripts/generate-embeddings.mjs` y su comentario de cabecera.
- 🟡 **Grafo de criterios relacionados/en conflicto** — infraestructura creada
  en v1.10 (`CRITERION_CONFLICTS` en el `.jsx`), con una primera entrada real
  documentada a mano (seed-002 vs seed-003 — ver historial de versiones). Sin
  generación automática todavía (dependía del RAG semántico de arriba para
  sugerir candidatos, que está bloqueado) y sin UI propia para verlo/editarlo —
  próximo paso cuando se retome el punto anterior.
- ⏳ **Fine-tuning / preference learning** — Anthropic no ofrece fine-tuning público
  de Claude vía API estándar (solo acuerdos empresariales). Alternativa realista:
  few-shot con los datos de revisión humana que ya guardamos (`reviewedBy`,
  `reviewNotes`, `status`) + prompt caching, una vez que haya volumen suficiente
  (cientos de críticas revisadas).
- ⏳ **Suite formal de evaluación** — no arrancada. Es trabajo humano (armar un set
  de pantallas con defectos conocidos y etiquetarlas), no infraestructura — se puede
  construir en paralelo a cualquier otro punto.
- ⏳ **Base de datos relacional real** (Airtable/Notion/Postgres) — diferida. El
  storage nativo de artefactos sigue alcanzando con el filtrado por tags actual.

**Orden recomendado si se retoma:** más rondas de extracción real para la base de
criterios (1) — cada ronda suma ~60-90 criterios verificables, así que llegar a
1.500-2.000 son varias rondas más, no una — en paralelo se puede armar la suite de
evaluación (5) porque no depende de nada más. RAG semántico (2), grafo (3) y base
relacional (6) solo se justifican si el volumen de criterios y críticas crece lo
suficiente como para que el filtrado por tags empiece a quedarse corto.

**Fuente completa de este roadmap:** `Design_Judgment_Knowledge_Base_Handoff_2026-08-19.docx`
(~130 fuentes, modelo epistémico de 6 niveles S/A/B/C/D/E, esquema de criterio
atómico, arquitectura de sistema completa). Documento producido por otro agente
(ChatGPT), verificado por muestreo — las citas específicas chequeadas (UICrit UIST
2024, UXBench 2026) son reales.

---

## Historial de versiones
- **v1.11 (19 ago 2026):** ronda de curación sobre el catálogo de reglas
  determinísticas de Impeccable (impeccable.style /
  github.com/pbakaus/impeccable, Apache 2.0, skill de diseño para agentes de
  código). **A diferencia de la ronda WCAG AAA, esta sí se verificó contra el
  código fuente real** — se clonó el repo y se leyó el umbral exacto de cada
  regla en `cli/engine/rules/checks.mjs`, cada URL de origen apunta a la línea
  real en GitHub. Se evaluó explícitamente si Impeccable "encaja" como fuente
  antes de sumar nada (pedido directo del equipo): se descartó poder "correr"
  la herramienta dentro de la Bitácora (necesita código fuente + servidor vivo
  + navegador automatizado; nuestra app solo recibe una captura estática, nunca
  el código), pero su catálogo de 47 reglas sí sirvió como fuente para el mismo
  workflow de curación de siempre. De esas 47, se promovieron **16** (≥9/12) —
  todas con una razón real de legibilidad/contraste/renderizado detrás
  (tamaño mínimo de texto funcional, interlineado, largo de línea, contraste
  de texto gris sobre color, desborde de texto, etc.). Se rechazaron a
  propósito las reglas que son puro patrón "esto parece IA genérica" sin
  respaldo normativo (paleta violeta en headings, tile de ícono redondeado,
  glow oscuro, fondo crema, chip "eyebrow" sobre hero) — tratarlas como
  criterio normativo habría violado la regla de no confundir preferencia del
  autor de una herramienta con principio de diseño establecido. Base total:
  163 → **179**. Detalle completo (promovidas + rechazadas con puntaje) en
  `CRITERIA-BACKLOG.md`.
- **v1.10 (19 ago 2026):** avance paralelo en 3 frentes de Balde 2. (1) Ronda de
  curación sobre WCAG 2.2 nivel AAA: ~30 criterios encuestados, 7 promovidos
  (≥9/12) — contraste reforzado, indicador de ubicación en flujos, propósito de
  link autodescriptivo, target size 44×44, ayuda contextual, prevención de
  errores extendida, autenticación sin puzzle cognitivo. El resto documentado en
  `CRITERIA-BACKLOG.md` con su puntaje. **Advertencia real:** esta ronda no tuvo
  acceso de red en vivo a w3.org (bloqueado por política de egress del entorno
  de ejecución) — los números/URLs vienen de conocimiento entrenado, no de
  verificación en esta sesión; pendiente un spot-check manual. (2) Grafo de
  criterios en conflicto: infraestructura creada (`CRITERION_CONFLICTS` en el
  `.jsx`) con una primera entrada real documentada (seed-002 vs seed-003, límite
  de contexto entre "no preselecciones en preguntas" y "un default de config
  puede reflejar estado real"). Sin UI propia todavía, sin generación
  automática. (3) RAG semántico real: **bloqueado en este entorno** — se probó
  una API key de Voyage AI real, pero `api.voyageai.com` está bloqueado por la
  política de egress de red de esta sesión (403 en el CONNECT, mismo bloqueo
  que sufrió w3.org). No es un problema de la key ni del código: hace falta que
  un administrador habilite ese host, o generar los embeddings desde otro
  entorno con acceso real. Ver sección "RAG semántico real" más abajo para el
  plan técnico ya diseñado, listo para ejecutar en cuanto haya acceso.
- **v1.9 (19 ago 2026):** primera ronda del workflow de curación para escalar la
  base de criterios — se encuestaron ~55 candidatos nuevos, se puntuaron con la
  rúbrica de 4 ejes (observabilidad/evidencia/aplicabilidad mobile/accionabilidad,
  máx 12), y se promovieron los 30 que puntuaron ≥9/12 (WCAG adicional, Nielsen más
  atomizado, dark patterns expandido, i18n, IA/HAX, data viz, estética). Base total:
  145 → 175. Candidatos no promovidos y categorías sin encuestar todavía quedaron
  documentados en `CRITERIA-BACKLOG.md`, sin perderse.
- **v1.8 (19 ago 2026):** avance real en los 3 puntos pedidos como "clave". (1)
  Base de criterios: 65 → 145 (WCAG desglosado, Nielsen atomizado, dark patterns,
  i18n, IA, data viz, estética) — lejos de 1.500-2.000, honesto sobre por qué
  (calidad real toma varias rondas). (2) UICrit importado con filtro real: CSV
  subido y procesado, 10.286/11.344 comentarios califican (`human`+`both`), dataset
  completo preservado, muestra de 151 pantallas viva en la app, uso gateado a
  mobile-only. (3) Círculo de alimentación de categoría 3 construido: críticas
  propias aprobadas por humano ahora calibran las próximas.
- **v1.7 (19 ago 2026):** se resuelve la decisión pendiente sobre fuentes web —
  categoría 1 (documentación) conserva lo que ya tiene aunque la fuente sea web;
  categoría 2 (referencias visuales externas) excluye 100% web/desktop, solo mobile.
  Se declara el MVP funcional de punta a punta — ver "Estado del MVP" al inicio de
  este documento.
- **v1.6 (19 ago 2026):** se formaliza la taxonomía de 3 categorías madre
  (Documentación / Referencias visuales externas / Corpus propio), separadas por
  namespace y por si pasaron o no por control humano. UICrit queda registrado como
  primera entrada de "Referencias visuales externas", en estado pendiente de
  aprobación manual gradual, con snapshot del repo guardado (archivado desde
  22 ene 2026; CSV real de 11.344 filas todavía no descargado por limitación del
  entorno). Se documenta la decisión de pausar fuentes específicamente web y
  priorizar mobile/producto. Se deja anotado que el "círculo de alimentación" de
  críticas propias aprobadas hacia futuras críticas todavía no está construido.
- **v1.5 (19 ago 2026):** arranca "Balde 2" en dos frentes de bajo costo — la
  biblioteca de componentes deja de ser texto fijo en el prompt y pasa a ser una
  base de 65 criterios atómicos individuales en storage; se agrega un paso de
  clasificación (screenType/components/platform) antes de cada crítica y un
  filtrado por tags que solo manda al prompt los criterios que matchean. Cada
  crítica guarda `detectedScreen` y `matchedCriteriaIds` para trazabilidad.
- **v1.4 (19 ago 2026):** "Balde 1" implementado — tipos epistémicos por hallazgo
  (violación/riesgo/hipótesis/convención/preferencia), campo de confianza
  independiente de severidad, disciplina de observabilidad (no afirmar nada
  interactivo/empírico solo desde una imagen), anti-patrones explícitos, y la
  biblioteca de componentes (12 familias, ~80 reglas con URL de origen, síntesis de
  Open UI/ARIA APG/GOV.UK/SLDS/Atlassian/Base Web/Fluent 2). "Balde 2" queda
  documentado como CTA explícito para más adelante — ver sección arriba.
- **v1.3 (19 ago 2026):** se reemplaza el puntaje único por un sistema de tres
  bloques ponderados (Usabilidad 50 / Consistencia 30 / Dirección de arte 20) con
  fallo crítico automático si Usabilidad < 30/50, calculado de forma determinística
  en el código. Se agregan etiquetas de contexto opcionales al subir cada imagen.
  Las críticas anteriores a esta versión mantienen su formato viejo y se siguen
  mostrando sin desglose por bloque.
- **v1.2 (19 ago 2026):** se suman IBM Carbon Design System (consistencia enterprise
  y componentes de datos densos) y Shopify Polaris (voz y tono, estados de error,
  claridad transaccional). Apple HIG, Material Design 3 y Laws of UX ya estaban
  incorporados desde v1.1 — no se duplicaron.
- **v1.1 (19 ago 2026):** se incorpora este documento completo como criterio oficial;
  se agrega el campo `principle` a cada hallazgo del reporte para trazabilidad.
- **v1.0 (19 ago 2026):** versión inicial, solo con heurísticas de Nielsen básicas.
