# Backlog de criterios — candidatos evaluados, no promovidos

**Generado:** 19 de agosto de 2026, como parte del workflow de curación para
escalar la base de criterios (Balde 2, punto 1).

## El workflow (repetible, para las próximas rondas)

1. **Encuestar** el universo completo de la fuente (todos los criterios de éxito de
   WCAG, todas las heurísticas de Nielsen descompuestas, la taxonomía completa de
   dark patterns, etc.) — no una selección arbitraria.
2. **Puntuar cada candidato** en 4 ejes, 1-3 cada uno, máximo 12:
   - **Observabilidad**: ¿se juzga desde una captura estática? (3 = totalmente
     visible, 2 = parcialmente inferible, 1 = necesita interacción real)
   - **Fuerza de evidencia**: normativo/empírico (3) > convención madura (2) >
     heurística/prevalencia (1)
   - **Aplicabilidad mobile**: nativo (3), aplica igual (2), mayormente web (1)
   - **Accionabilidad**: ¿lleva a una recomendación concreta? (3) o es vago (1)
3. **Promover** a la base viva (`SEED_CRITERIA_BATCH*` en el `.jsx`) solo lo que
   puntúa **≥9/12**. Lo demás queda acá, documentado con su puntaje y por qué no
   pasó, para revisión futura — no se descarta, se pospone.

## Candidatos evaluados y NO promovidos (puntaje <9/12)

### WCAG 2.2 — deprioritizados por baja observabilidad (necesitan interacción real)
- **1.4.13 Content on Hover or Focus** (6/12) — requiere interactuar con un tooltip
  para verificar que sea descartable/permanente/hoverable. No se puede confirmar
  desde una imagen.
- **2.5.1 Pointer Gestures** (5/12) — gestos multipunto no son inferibles de una
  captura estática.
- **2.5.2 Pointer Cancellation** (5/12) — necesita probar el evento down/up real.
- **1.3.5 Identify Input Purpose** (8/12) — cerca del corte, pero confirmar que el
  `autocomplete` esté bien programado no se puede ver, solo inferir por tipo de
  campo. Candidato fuerte para la próxima ronda si se suma inspección de DOM.
- **1.3.1 Info and Relationships** (7/12) — la estructura semántica (headings,
  landmarks) no es 100% inferible visualmente, aunque la agrupación visual sí.

### Nielsen — variantes redundantes con lo que ya está en batch1/batch2
- Varias descomposiciones adicionales de "flexibilidad y eficiencia" (heurística
  #7) se solapaban demasiado con criterios de componentes ya cubiertos en la
  biblioteca de componentes — no sumaban cobertura nueva real.

### Dark patterns — variantes de menor evidencia
- **Fake scarcity con countdown real pero engañoso** (8/12) — el límite está en que
  "engañoso" no siempre es observable sin conocer el backend real.
- **Forced continuity** (8/12) — muy similar a "roach motel" ya promovido, no
  suficientemente distinto para justificar entrada separada.

### Categorías completas NO encuestadas todavía (no es que fallaron el corte — directamente no se llegó a revisarlas)
- **WCAG AAA completo** (31 criterios) — deliberadamente fuera de alcance por ahora,
  el propio W3C no lo recomienda como requisito universal.
- **ISO 9241-210 desglosado** — son principios de proceso (contexto de uso,
  iteración), no criterios visuales evaluables desde una captura; necesitan un
  tratamiento distinto (más como checklist de research que como hallazgo de
  crítica).
- **Investigación de Fitts/Hick más allá de lo ya cubierto** en Laws of UX.
- **Localización más profunda** (formatos de calendario no-gregoriano, unidades de
  medida, símbolos monetarios ambiguos).
- **Data viz para tipos de gráfico específicos** (mapas, sankey, treemaps) — solo
  se cubrieron los patrones más generales (barras, líneas, torta).

## Números totales del workflow (ronda 1)

- Candidatos encuestados en esta ronda: ~55
- Promovidos a la base viva (≥9/12): **29** (batch3, verificado contra el código
  — no 30 como decía una versión anterior de este documento; sumados a los 127
  reales de batch1+2 (70+57, no 145 como se dijo antes) = **156 criterios
  activos** antes de la ronda 2).
- Documentados en backlog (candidatos reales, evaluados, por debajo del corte): ~12
- Categorías identificadas pero no encuestadas todavía: 5

**Nota de corrección (v1.10):** los números de arriba (145, 30, 175) no
coincidían con lo que realmente había sembrado en el código — se corrigieron acá
contando directo sobre `SEED_CRITERIA*.length` en `ui-critique-repo.jsx`. Pasa
por no tener un chequeo automático que valide doc vs. código; queda como
candidato a backlog de infraestructura (un test simple que compare el conteo
documentado contra el real).

---

## Ronda 2 — WCAG 2.2 nivel AAA (v1.10, 19 ago 2026)

**Advertencia importante:** esta ronda se hizo **sin poder consultar w3.org en
vivo** — el entorno de ejecución de esta sesión tiene bloqueado por política de
egress de red tanto `www.w3.org` como `api.voyageai.com` (confirmado con un 403
en el CONNECT del proxy, no algo que se pueda evitar desde acá). Los números de
criterio, títulos y URLs de esta ronda vienen de conocimiento entrenado de
Claude, no de una verificación en esta sesión. **Recomendado: alguien con acceso
real a w3.org haga un spot-check de las 7 entradas promovidas antes de
confiar en ellas al 100%** — en particular los slugs de URL (`#contrast-enhanced`,
`#location`, etc.), que son la parte con más chance de estar levemente
desactualizada.

### Candidatos encuestados (~30, universo completo de WCAG 2.2 AAA)

La mayoría de AAA depende de audio/video, timing o interacción de teclado — no
observable desde una imagen estática — así que se rechazaron en bloque por el
mismo motivo que ya rechazó ítems similares en AA (ver arriba, WCAG AA
deprioritizados). Puntajes exactos (Observabilidad / Evidencia / Mobile /
Accionabilidad, máx 12):

**Promovidos (≥9/12):**
| Criterio | Puntaje | Motivo |
|---|---|---|
| 1.4.6 Contrast (Enhanced) | 12/12 | Medible desde imagen, igual que el 1.4.3 AA ya promovido, solo que con umbral más alto. |
| 2.4.8 Location | 11/12 | Breadcrumb/tab activo/indicador de paso son muy visibles. |
| 2.4.9 Link Purpose (Link Only) | 11/12 | Se lee el texto del link directo desde la imagen. |
| 2.5.5 Target Size (Enhanced) | 12/12 | Tamaño de objetivo táctil, altamente relevante en mobile. |
| 3.3.5 Help | 9/12 | Se puede ver si hay ayuda contextual visible cerca de un campo complejo. |
| 3.3.6 Error Prevention (All) | 9/12 | Se puede ver si existe paso de revisión/confirmación antes de enviar. |
| 3.3.9 Accessible Authentication (Enhanced) | 11/12 | Se puede ver si un login pide un puzzle cognitivo (captcha visual, etc.). |

**Rechazados por baja observabilidad (necesitan audio, video, timing o
interacción — 4-8/12, no llegan al corte):**
1.2.6 Sign Language, 1.2.7 Extended Audio Description, 1.2.8 Media Alternative,
1.2.9 Audio-only (Live), 1.4.7 Low or No Background Audio, 2.1.3 Keyboard (No
Exception), 2.2.3 No Timing, 2.2.4 Interruptions, 2.2.5 Re-authenticating, 2.2.6
Timeouts, 2.3.2 Three Flashes, 2.3.3 Animation from Interactions, 2.5.6
Concurrent Input Mechanisms, 3.1.5 Reading Level, 3.1.6 Pronunciation, 2.4.12
Focus Not Obscured (Enhanced), 2.4.13 Focus Appearance.

**Borderline, justo debajo del corte (8/12) — candidatos fuertes para la
próxima ronda si se los atomiza mejor o se suma una segunda opinión:**
- **1.4.8 Visual Presentation** (8/12) — es un bundle de varias reglas
  (ancho de línea, justificación, line-height, resize 200%); atomizarlo en
  sub-reglas separadas probablemente suba el puntaje de cada una.
- **1.4.9 Images of Text (No Exception)** (8/12) — distinguir "imagen de texto"
  vs texto real desde una captura plana es más una hipótesis que un hecho
  observable con certeza.
- **2.4.10 Section Headings** (8/12) — inferible parcialmente por tamaño/peso
  tipográfico, no siempre confirmable sin estructura semántica.
- **3.1.3 Unusual Words** (8/12) y **3.1.4 Abbreviations** (8/12) — legibles
  desde el copy, pero juzgar "inusual" es más subjetivo que las reglas ya
  promovidas.
- **3.2.5 Change on Request** (8/12) — a veces inferible por el flujo visible
  (ej. auto-redirect), pero mayormente requiere interacción para confirmarlo.

### Números de esta ronda

- Candidatos encuestados: ~30 (universo completo de AAA en WCAG 2.2, según
  conocimiento entrenado — no verificado en vivo esta sesión)
- Promovidos (≥9/12): **7**
- Borderline documentados (8/12, candidatos para próxima ronda): **6**
- Rechazados por baja observabilidad: **17**
- Base total después de esta ronda: **163** (156 + 7)

## Ronda 3 — Catálogo de reglas de Impeccable (v1.11, 19 ago 2026)

**A diferencia de la ronda 2 (WCAG AAA), esta sí se verificó contra el código
fuente real** — se clonó `github.com/pbakaus/impeccable` (commit
`f88b2837a7d7c3182e46307bbbb091a1ed547571`) y se leyó el umbral exacto de cada
regla en `cli/engine/rules/checks.mjs`. Cada URL de origen de las promovidas
apunta a la línea real en GitHub, no a una URL recordada de memoria.

**Filtro de encaje aplicado (pedido explícito del equipo):** antes de sumar
nada se evaluó si Impeccable tenía sentido como fuente. Conclusión: **no se
puede "correr" la herramienta dentro de la Bitácora** — necesita código fuente
real, un servidor de desarrollo vivo, y un navegador automatizado inyectando
scripts en el DOM; nuestra app solo recibe una captura estática, nunca el
código ni una URL corriendo. Es un desajuste arquitectónico de raíz. Lo que sí
se aprovechó fue su catálogo de reglas como fuente de candidatos para el mismo
workflow de curación de siempre.

**Criterio de rechazo adicional en esta ronda:** varias reglas de Impeccable
existen para detectar "esto parece una interfaz genérica hecha por IA" (paleta
violeta en headings, tile de ícono redondeado sobre un heading, glow oscuro,
fondo crema, chip "eyebrow" sobre un hero, borde con acento sobre esquina
redondeada) — son observaciones de patrón repetido del autor de la
herramienta, sin respaldo normativo o de investigación formal. Se les asignó
`evidencia = 1` a propósito y NO se promovieron aunque el resto de los ejes
puntuara alto, para no tratar la preferencia estética de un tercero como si
fuera un principio de diseño establecido — mismo espíritu que la regla de
"nunca inventes contenido" de `CLAUDE.md`.

### Candidatos encuestados (47 reglas únicas del detector)

**Promovidas (≥9/12) — ver `SEED_CRITERIA_BATCH5` en el `.jsx` para el texto
completo de cada una:**
| Regla (id en Impeccable) | Puntaje | Motivo real (no genericidad) |
|---|---|---|
| `undersized-ui-text` | 12/12 | Piso de tamaño de texto funcional/interactivo — accesibilidad real. |
| `tiny-text` | 12/12 | Piso de tamaño de texto de cuerpo — legibilidad real. |
| `cramped-padding` | 11/12 | Padding proporcional al tamaño de fuente — muy visible, aplica a casi cualquier pantalla. |
| `line-length` | 11/12 | Medida de línea — refuerza lo que ya citamos de Butterick's/Lupton. |
| `tight-leading` | 11/12 | Interlineado mínimo — refuerza lo que ya citamos de Butterick's/Lupton. |
| `body-text-viewport-edge` | 10/12 | Texto sin margen contra el borde — muy relevante en mobile. |
| `all-caps-body` | 10/12 | Mayúsculas sostenidas en párrafos largos — reduce velocidad de lectura. |
| `clipped-overflow-container` | 9/12 | Elemento posicionado cortado por overflow — defecto de renderizado real. |
| `extreme-negative-tracking` | 9/12 | Tracking negativo extremo — daña legibilidad. |
| `flat-type-hierarchy` | 9/12 | Escala tipográfica sin contraste real entre niveles. |
| `gradient-text` | 9/12 | Reencuadrado como riesgo de contraste en segmentos del gradiente, no como "se ve genérico". |
| `gray-on-color` | 9/12 | Contraste real medible, no solo apariencia. |
| `justified-text` | 9/12 | Ríos de espacio sin hyphenation — problema de legibilidad real. |
| `numbered-section-labels` | 9/12 | Coincide con guía ya existente: numerar solo si el orden es real. |
| `text-overflow` | 9/12 | Texto desbordado/cortado — defecto de renderizado real. |
| `wide-tracking` | 9/12 | Tracking positivo amplio en cuerpo de texto — ralentiza lectura. |

**Rechazadas por baja observabilidad (requieren animación, interacción,
código fuente, o estructura DOM/semántica — no visibles en una imagen estática,
5-8/12):**
`blinking-cursor`, `bounce-easing`, `image-hover-transform`,
`layout-transition`, `marquee`, `pulsing-dot` (todas dependen de animación/
interacción, no de un frame estático) · `content-hidden-at-rest`,
`skipped-heading` (dependen de estructura DOM/semántica, no de lo visible) ·
`monotonous-spacing`, `repeated-container-text` (parcialmente inferibles pero
requieren comparar muchos elementos a la vez, juicio blando, no un umbral
nítido).

**Rechazadas por evidencia insuficiente (puro patrón "parece IA genérica",
sin respaldo normativo — 7-8/12, evidencia forzada a 1 a propósito):**
`ai-color-palette`, `border-accent-on-rounded`, `codex-grid-background`,
`cream-palette`, `dark-glow`, `gpt-thin-border-wide-shadow`, `hero-eyebrow-chip`,
`icon-tile-stack`, `italic-serif-display`, `kicker-above-heading`,
`radial-halo`, `radial-spotlight-glow`, `repeating-stripes-gradient`,
`shape-assembled-illustration`, `side-tab`, `theater-slop-phrase`.

**Rechazada por estar fuera de alcance (no es un problema de interfaz):**
`em-dash-overuse` — es una observación de estilo de escritura/prosa (posible
"tell" de texto generado por IA), no algo que nuestro criterio de crítica de
UI evalúe. No encaja en ninguna de las 9 dimensiones actuales sin forzarlo.

**Duplicada con un criterio ya existente:**
`low-contrast` — mismo umbral que WCAG 1.4.3, ya cubierto por `seed2-001`
(batch2). No se duplica.

### Números de esta ronda

- Candidatos encuestados: **47** (universo completo del detector, verificado
  contra el código real)
- Promovidos (≥9/12): **16**
- Rechazados por baja observabilidad: **16**
- Rechazados por evidencia insuficiente (patrón genérico sin respaldo): **16**
- Fuera de alcance: **1**
- Duplicado: **1**
- Base total después de esta ronda: **179** (163 + 16)

## Ronda 4 — Holloway, "Land Your Dream Design Job" (v1.12, 19 ago 2026)

**Fuente:** 4 secciones del libro de Holloway sobre crítica de apps para
entrevistas de trabajo (`six-frameworks-for-critiquing-apps`,
`establishing-app-critique-objectives`, `acing-the-app-critique`,
`app-critique-in-action`).

**Advertencia de acceso (como la ronda 2 con w3.org):** 3 de las 4 páginas
están detrás de paywall más allá de la vista previa — `six-frameworks` corta
en "Learn More", `acing-the-app-critique` corta antes del walkthrough de Yelp,
`establishing-app-critique-objectives` corta con solo los títulos de los 6
frameworks sin desarrollar. Solo `app-critique-in-action` (el ejemplo
trabajado) llegó relativamente completo, aunque también corta antes del final
("Whiteboard Challenge Format"). **No se pudo encuestar el "universo
completo" de esta fuente** — es una limitación real de acceso, documentada
para no fingir cobertura que no hubo.

**Filtro de encaje aplicado primero (mismo espíritu que con Impeccable):** la
mayoría del contenido accesible son frameworks de PROCESO (Jobs to be Done,
personas, segmentación por familiaridad del usuario, capas estética/
funcional/estratégica, evaluación por experto citando Nielsen/HIG/Material ya
cubiertos genéricamente) o consejos de conducta para quien hace la entrevista
(dar contexto antes de empezar, mantenerse adaptable, criticar en grupo,
comparar apps competidoras bajo el mismo JTBD, evitar elogios sin sustento,
mirar más allá de la app — App Store, emails, notificaciones push). Ninguno
de estos es un hallazgo verificable desde una imagen estática — son
checklist de proceso para la persona que critica, no criterios que nuestra
IA pueda chequear contra una captura. Mismo motivo por el que ya se había
dejado ISO 9241-210 fuera de alcance (ver arriba). Se descartaron en bloque
sin puntuar caso por caso.

### Candidatos atómicos evaluados (~9, de la sección "App Critique in Action" — la única con hallazgos concretos por pantalla)

**Promovidos (≥9/12):**
| Candidato | Puntaje | Motivo |
|---|---|---|
| Claridad de filtros contextuales (pills no deben repetir info ya visible) | 10/12 | Totalmente observable en una imagen, aplica igual en mobile, recomendación concreta (sacar la redundancia). No se solapa con nada ya promovido. |
| Densidad de tácticas de crecimiento (volumen de banners/notis no debe competir con la tarea principal) | 9/12 | Observable contando elementos promocionales en la captura; evidencia = heurística práctica del libro, no normativa — justo en el corte. |

**Rechazados por duplicar un criterio ya promovido (no por bajo puntaje — habrían pasado el corte, pero no suman cobertura nueva):**
- **Consistencia de estilo de ícono** (hairline vs. filled vs. thick) — hubiera puntuado 10/12, pero duplica casi textual el WCAG 3.2.4 ya en `SEED_CRITERIA` (seed-047: "componentes con la misma función deben identificarse de forma consistente") + Nielsen #4 ya en batch1.
- **Estado de selección visible** (tab activo, ítem marcado debe distinguirse) — hubiera puntuado 10/12, pero es casi idéntico a un criterio de batch3 ya promovido (12/12): "un elemento seleccionado (tab activo, ítem marcado) debe distinguirse visualmente de forma inequívoca del resto".
- **Affordance de búsqueda** (sombra/placeholder indicando que se puede tocar/buscar) — 9/12, pero es una restatement de Don Norman/Nielsen #6, ya citado genéricamente en el `RUBRIC_PROMPT` sin aportar una instancia atómica nueva y distinta.
- **Claridad de botón de acción** ("Order Now" debe guiar el siguiente paso) — se solapa fuertemente con Nielsen #2/Krug ya citados y con los criterios de componente `button`/CTA existentes en la biblioteca.

**Rechazados por no ser un hallazgo verificable (son técnicas del crítico o juicios estratégicos/subjetivos, no algo que se marque como violación/riesgo en una imagen):**
Squint test, método de desaturación, "consistency check" de impresión de marca,
análisis de splash screen, prominencia de hero content, qué tab es default
(revela prioridad, no es un error a corregir).

**Rechazados por no ser observables desde una imagen estática (necesitan
flujo multi-pantalla, interacción, o conocimiento del backend):**
método de recolección de preferencias (encuesta vs. incremental), eficacia
real de la personalización, alternativa de aprendizaje implícito de
preferencias, identificación de fricción en flujo (confirmaciones
redundantes), soporte de navegación multi-vista (mapa vs. lista) — solo
aplica a apps con mapa, caso de uso muy angosto además.

### Números de esta ronda

- Candidatos atómicos evaluados: **9** (de la única sección con contenido
  concreto por pantalla; el resto de las ~20 páginas accesibles eran
  framework de proceso, descartado en bloque)
- Promovidos (≥9/12, sin duplicar cobertura existente): **2**
- Rechazados por duplicar un criterio ya promovido: **4**
- Rechazados por no ser hallazgo verificable (técnica del crítico / juicio
  subjetivo): **6**
- Rechazados por requerir interacción/flujo multi-pantalla: **5**
- Frameworks de proceso descartados en bloque (no puntuados individualmente):
  6 frameworks + ~8 consejos de metodología/objetivos
- Base total después de esta ronda: **181** (179 + 2)

## Ronda 7 (20 de agosto de 2026) — Patrones oscuros + relleno de dimensiones existentes

Encuesta enfocada en la taxonomía de dark patterns de Harry Brignull
(deceptive.design, ex darkpatterns.org) y el reporte de la FTC "Bringing Dark
Patterns to Light" (2022), más una pasada de relleno sobre las 9 dimensiones
ya existentes para sumar cobertura donde todavía era delgada. Acotado desde
el inicio a lo **observable en una imagen estática** — la taxonomía completa
de Brignull incluye patrones que solo se detectan con interacción a lo largo
del tiempo (ej. nagging repetido, spam a contactos), explícitamente fuera de
alcance para este producto hasta que exista un modo de crítica multi-sesión.

**Promovidos (≥9/12): 20** — 9 en la nueva dimensión "Patrones oscuros"
(`SEED_CRITERIA_BATCH7`, seed7-001 a seed7-009: confirmshaming,
interferencia visual / preselección, trick questions, publicidad disfrazada,
roach motel, forced continuity, urgencia artificial, prueba social
fabricada, privacy Zuckering) + 11 en dimensiones existentes (seed7-010 a
seed7-020: Jerarquía visual, Consistencia y sistema de diseño, Tipografía,
Color y contraste, Espaciado y alineación, Componentes y affordance ×2, Copy
y microcopy ×2, Accesibilidad, Claridad del propósito).

**Rechazados (no promovidos esta ronda):**

| Candidato | Motivo |
|---|---|
| **Postel's Law** ("sé estricto en lo que emitís, permisivo en lo que aceptás") | Es un principio de diseño de sistemas/APIs, no un hallazgo atómico verificable desde una imagen de UI — no hay nada puntual que marcar como violación en una captura. |
| **Doherty Threshold** (tiempo de respuesta del sistema <400ms) | Requiere medir latencia real; no es observable ni inferible desde una imagen estática. |
| **Aesthetic-Usability Effect** (interfaces más lindas se perciben como más usables) | Es un sesgo cognitivo descriptivo sobre cómo perciben las personas, no una regla normativa que un hallazgo pueda citar como criterio de corrección — usarlo como "principle" sería circular. |
| **Nagging** (parte de la taxonomía de Brignull) | Por definición requiere observar interrupciones repetidas a lo largo del tiempo — imposible de verificar en una sola captura estática. Candidato a re-evaluar si el producto suma un modo de crítica de flujo/sesión. |
| **"Costos ocultos" genérico** (cargo que aparece recién al final del checkout) | Se solapa con el criterio ya promovido de "forced continuity" (seed7-006) y con contenido ya existente sobre claridad de precios; una versión genérica sin especificidad nueva no suma cobertura, solo duplica. |
| **Comparison Prevention estricto** (imposibilitar comparar precios/planes lado a lado) | Válido como patrón, pero tal como está formulado depende de que exista una alternativa de comparación real fuera de la pantalla evaluada — no verificable desde una sola imagen sin ese contexto externo. |
| **Microsoft Inclusive Design Toolkit** (persona spectrum, exclusión situacional/temporal/permanente) | Es un framework de proceso de diseño (cómo pensar la inclusión), no un set de hallazgos atómicos verificables — mismo motivo por el que ISO 9241-210 y los frameworks de proceso de Holloway quedaron fuera en rondas anteriores. |
| **WAI-ARIA Date Picker (patrón de interacción específico)** | El patrón normativo describe comportamiento de teclado/foco, no observable desde una imagen estática — ya cubierto en espíritu por la nota general de "Accesibilidad" sobre limitaciones de evaluar solo desde imagen. |
| **Fake Urgency genérico** ("crea urgencia artificial" sin especificar mecanismo) | Demasiado vago para ser accionable — se descompuso en su lugar en el candidato específico y verificable "temporizador de cuenta regresiva sin fecha límite real" (seed7-007), que sí promovió. |

### Números de esta ronda

- Candidatos evaluados: **29** (20 promovidos + 9 rechazados)
- Promovidos (≥9/12): **20**
- Rechazados por no ser observables desde una imagen estática: 4
  (Doherty Threshold, Nagging, Comparison Prevention estricto, WAI-ARIA Date
  Picker)
- Rechazados por ser framework de proceso, no hallazgo atómico: 2
  (Postel's Law, Microsoft Inclusive Design Toolkit)
- Rechazados por ser descriptivos/circulares, no normativos: 1
  (Aesthetic-Usability Effect)
- Rechazados por duplicar cobertura ya promovida: 1 (costos ocultos genérico)
- Rechazados por ser demasiado vagos, resueltos como versión específica en su
  lugar: 1 (Fake Urgency genérico → reemplazado por countdown sin fecha real)
- Base total después de esta ronda: **201** (181 + 20)

## Ronda 8 (20 de agosto de 2026) — Vercel Design Guidelines

Fuente: vercel.com/design/guidelines. Pedido explícito del equipo: aunque es
una guía nominalmente de diseño **web**, se encuestó igual porque una porción
real de sus reglas (tipografía, color, composición visual) son agnósticas de
plataforma y aplican tal cual a interfaces mobile nativas — no así las
secciones de implementación técnica (Interactions, Animations, Performance,
partes de Forms), que dependen de CSS/JS específico o de interacción real,
fuera de alcance por el mismo motivo que siempre: no observable desde una
imagen estática.

**Encuesta completa:** las 8 secciones de la guía (~130 reglas atómicas
listadas). La mayoría es implementación de código (ej. `touch-action:
manipulation`, `aria-live`, virtualización de listas) o requiere estados
dinámicos/interacción (ej. loading states, hover/focus, drag) — quedaron
fuera en bloque, mismo criterio que "Interactions"/"Performance" en rondas
anteriores.

**Promovidos (≥9/12): 11** — todos a dimensiones ya existentes (`SEED_CRITERIA_BATCH8`,
seed8-001 a seed8-011): radios anidados/concéntricos, safe areas en mobile,
balance de peso en lockups ícono+texto, bordes semitransparentes + sombra,
consistencia de matiz sobre fondos de color, paletas accesibles para
daltonismo en gráficos, viudas/huérfanas, números tabulares, ningún estado
como callejón sin salida, formato de moneda consistente, separación de
números y unidades.

**Rechazados (no promovidos esta ronda):**

| Candidato | Motivo |
|---|---|
| **Title Case en headings/botones** | Es una decisión de estilo de marca propia de Vercel, no un principio universal — Apple HIG y Material 3 suelen preferir sentence case en botones. Promoverlo como regla normativa contradiría otras fuentes ya en la base. |
| **Ajuste óptico de ±1px cuando la percepción le gana a la geometría** | Es una técnica/heurística de proceso para quien diseña ("ajustá a ojo"), no un hallazgo verificable y accionable sobre una interfaz ya construida — no hay nada puntual que marcar en una imagen. |
| **Sombras en al menos dos capas (luz ambiental + directa)** | Contar capas de sombra con precisión desde una captura comprimida no es confiablemente observable — se descarta por bajo puntaje en observabilidad (2/3), queda debajo del corte. |
| **Mayor contraste en :hover/:active/:focus que en el resto** | Requiere ver múltiples estados de un mismo elemento; una sola imagen estática solo muestra un estado a la vez — no verificable sin una segunda captura de comparación. |
| **Explicit width/height + preload para evitar layout shift** | Es un problema que ocurre durante la carga (tiempo), no algo visible en una captura ya cargada — mismo motivo que excluye la mayoría de "Performance". |
| **Iconos con nombre accesible vía `aria-label`** | Depende del DOM/árbol de accesibilidad, no de lo visible en la imagen — ya cubierto en espíritu por el criterio (sí promovido en el lote 7) sobre affordance visual de íconos-botón, que es la versión observable de esta misma preocupación. |
| **"Errores next to their field" / resumen de errores** | Duplica cobertura ya existente en la base (criterios basados en GOV.UK error-message y Fluent 2 messagebar, presentes desde antes del lote 7) — no suma cobertura nueva. |
| **"Usar numerales en vez de escribir números en palabras"** | Válido pero de bajo impacto y evidencia mayormente de estilo editorial propio, no normativa — quedó justo debajo del corte de 9/12 en esta pasada; candidato a revisar si se necesita completar la dimensión de Copy más adelante. |

### Números de esta ronda

- Candidatos evaluados: **19** (11 promovidos + 8 rechazados)
- Promovidos (≥9/12): **11**
- Rechazados por no ser observables desde una imagen estática: 3
  (contraste diferencial hover/active/focus, layout shift por carga, sombras
  en dos capas)
- Rechazados por ser técnica/proceso de quien diseña, no hallazgo: 1
  (ajuste óptico ±1px)
- Rechazados por ser preferencia de marca, no principio universal: 1
  (Title Case)
- Rechazados por duplicar cobertura ya promovida: 2 (aria-label de íconos,
  resumen de errores junto al campo)
- Rechazados por quedar justo debajo del corte de calidad: 1 (numerales en
  vez de palabras)
- Base total después de esta ronda: **212** (201 + 11)

## Ronda 9 (21 de agosto de 2026) — Primera crítica propia aprobada

Fuente: `critique:1787214642880-z4a74l` ("Rappi iOS Payment methods 1"),
aprobada por un humano el 20 de agosto de 2026 — la primera crítica propia en
pasar de "pendiente" a "approved" desde que existe el flujo de revisión (0
aprobadas hasta esta ronda). Esto activa por primera vez la categoría 3
("corpus propio") en su segundo rol posible: no solo calibración automática
de futuras críticas vía `matchPastCritiques` (eso ya ocurre sin curación,
apenas se aprueba algo), sino candidato a **criterio atómico permanente de
la documentación** — con el mismo corte ≥9/12 que cualquier otra fuente
externa, tal como está documentado en el comentario de
`loadApprovedJourneyCritiques` en el código.

Importante: lo que se evalúa acá no es el caso puntual de Rappi/pagos, sino
la regla generalizable detrás de cada hallazgo. Un hallazgo atado a un
producto específico no es promovible tal cual — solo lo es la abstracción
que sobrevive fuera de ese caso.

**Candidatos encuestados: 6** (los 6 `findings` de la crítica aprobada; los
2 `wins` no aplican — son aciertos, no candidatos a regla nueva).

**Promovidos (≥9/12) — `SEED_CRITERIA_BATCH9`, seed9-001 a seed9-004:**

| Candidato (abstraído del finding original) | Obs. | Evidencia | Mobile | Accion. | Total |
|---|---|---|---|---|---|
| Comunicar un valor/estado de configuración sin dar control visible para cambiarlo en el mismo lugar es fricción evitable | 3 | 2 | 3 | 3 | 11/12 |
| Onboarding de varios pasos superpuesto sobre una tarea de gestión ya existente necesita salida/skip explícito y prominente | 3 | 2 | 3 | 3 | 11/12 |
| Un overlay de ayuda contextual no debería ocultar información subyacente relevante para la tarea en curso | 3 | 2 | 3 | 3 | 11/12 |
| Un valor de dato no debería aparecer en un idioma distinto al del resto de la interfaz | 3 | 2 | 2 | 2 | 9/12 |

**Rechazados (no promovidos esta ronda):**

| Candidato | Motivo |
|---|---|
| **Verificar que el foco quede confinado dentro del tooltip/overlay (posible trampa de foco)** | El propio finding lo marcó `type: "hipotesis"` con `validationNeeded` explícito ("Inspección con VoiceOver...") — no es observable desde una imagen estática, necesita interacción real. Mismo motivo de corte que las reglas WCAG deprioritizadas en la Ronda 1 (observabilidad 1/3). |
| **Un botón "Next" en un flujo paginado debería indicar en qué paso está o qué acción sigue** | Puntuaría cerca del corte, pero se solapa fuertemente con `seed4-002` ya promovido en la Ronda 2 ("en flujos con múltiples pasos, mostrá dónde está la persona usuaria dentro del conjunto — breadcrumb, tab activo, indicador de paso"), que cubre el mismo problema de raíz (visibilidad de ubicación/progreso en un flujo). No suma cobertura nueva distinta — mismo criterio de descarte por duplicado que en la Ronda 4 y la Ronda 8. |

### Números de esta ronda

- Candidatos evaluados: **6** (4 promovidos + 2 rechazados)
- Promovidos (≥9/12): **4**
- Rechazados por no ser observables desde una imagen estática (necesitan
  interacción real): **1** (posible trampa de foco en overlay)
- Rechazados por duplicar cobertura ya promovida: **1** (indicador de paso
  en botón "Next", ya cubierto por `seed4-002`)
- Base total después de esta ronda: **216** (212 + 4)
- Este es el primer lote cuya fuente es 100% interna (nuestra propia
  crítica aprobada), no un estándar o guía externa — el proceso de curación
  fue idéntico al de cualquier otra ronda: no hay atajo ni corte más laxo
  por venir de "adentro".

## Ronda 10 (21 de agosto de 2026) — Tope de familias tipográficas

Fuente del gap: no encuestamos una fuente nueva esta ronda, encontramos un
agujero real en la propia auditoría dark/light de "Solvo" (skill de
construcción v1.16) — las dos pantallas de prueba terminaron combinando 3
familias tipográficas (serif para el saldo/wordmark, sans del sistema para
la UI, monoespaciada para montos) en una pantalla mobile chica. La regla
existente en `GENERIC_AI_SLOP_ANTIPATTERNS` ("no uses una sola familia sin
variación de rol") empuja a variar por rol pero nunca puso techo a cuántas
familias distintas es razonable sumar en el proceso — el modelo lo
interpretó, con razón según lo que decía la regla, como "una familia por
rol", y terminó en 3.

**Candidatos encuestados: 2** (el fix directo del gap, y una idea
relacionada que surgió evaluándolo).

**Promovido (≥9/12) — `SEED_CRITERIA_BATCH10`, seed10-001:**

| Candidato | Obs. | Evidencia | Mobile | Accion. | Total |
|---|---|---|---|---|---|
| Máximo 2 familias tipográficas por pantalla (una 3ra solo si es monoespaciada para datos tabulares) | 3 | 3 | 3 | 3 | 12/12 |

Doble fuente, ambas verificadas por fetch real (no de memoria): Butterick's
Practical Typography, página "Mixing fonts" — "Mixing fonts is never a
requirement... Most documents can tolerate a second font. Few can tolerate
a third. Almost none can tolerate four or more."; y W3C WAI, "Making
Content Usable for People with Cognitive and Learning Disabilities" (Design
Guide, patrón 4.2.3 — Use a Consistent Visual Design): "Headings with the
same structural level have the same font and visual style" — esto último
suma respaldo de accesibilidad cognitiva real, no solo preferencia
editorial, a la parte de la queja del equipo sobre "problemas de
accesibilidad".

**Rechazado (no promovido esta ronda):**

| Candidato | Motivo |
|---|---|
| **Reservar tipografías decorativas/script para titulares puntuales, nunca para texto funcional (montos, labels, botones)** | La única fuente encontrada con una recomendación cercana (Butterick's, "Summary of key rules", regla 6) dice textualmente "avoid... monospaced fonts... and system fonts" — lo cual **contradice directamente** un criterio ya promovido en `SEED_CRITERIA_BATCH8` sobre números tabulares (que recomienda monoespaciada para columnas de montos). Es una regla pensada para tipografía de documento/impresión, no para UI de producto, y aplicarla tal cual generaría un conflicto real dentro de la propia base. Se descarta por evidencia insuficiente/contradictoria — no porque la preocupación de fondo (evitar fuentes decorativas en texto funcional) sea inválida, sino porque no encontramos todavía una fuente que la sostenga sin chocar con lo ya promovido. Candidato a revisar si aparece una fuente más específica de UI/producto (no de tipografía editorial) que distinga "decorativo/script" de "monoespaciado funcional".|

### Números de esta ronda

- Candidatos evaluados: **2** (1 promovido + 1 rechazado)
- Promovidos (≥9/12): **1**
- Rechazados por evidencia contradictoria con un criterio ya promovido: **1**
  (fuentes decorativas — chocaba con "números tabulares" de batch8)
- Base total después de esta ronda: **217** (216 + 1)
- Además de sumar el criterio a la base de documentación (categoría 1),
  esta ronda actualizó directamente `GENERIC_AI_SLOP_ANTIPATTERNS` (el
  contenido del skill de construcción) para que el tope quede explícito
  ahí también, no solo como un criterio más entre 217 — es la sección que
  el modelo lee primero, antes de construir.

## Ronda 11 (21 de agosto de 2026) — Accesibilidad de color más allá del ratio WCAG

Pedido explícito del equipo: investigar papers y documentación de UI sobre
accesibilidad de color y sumarlo a la base, apuntando a nivel AAA. **Con
acceso real a la web esta vez** (WebSearch + WebFetch, no de memoria como
la Ronda 2) — se aprovechó además para spot-check en vivo de `seed4-001`
(1.4.6 Contrast Enhanced): confirmado, texto normal 7:1 / texto grande
4.5:1, AAA, URL correcta.

Importante para calibrar expectativa: WCAG en sí mismo solo tiene **un** SC
de color específicamente AAA (1.4.6, ya en la base desde la Ronda 2) — el
resto de "accesibilidad de color a nivel AAA" no viene de más texto
normativo de WCAG (no existe), sino de investigación aplicada que va más
allá de lo que WCAG pide formalmente. Eso es lo que se encuestó acá.

### Fuentes encuestadas

- **APCA / Advanced Perceptual Contrast Algorithm** (`git.apcacontrast.com`) —
  el método de contraste candidato para WCAG 3, todavía no ratificado.
  Documenta un punto ciego real y conocido del ratio WCAG 2.x: sobrestima
  contraste cuando uno de los colores es casi negro (relevante para dark
  mode — confirma algo que ya habíamos visto por observación directa en el
  hallazgo de contraste bajo del "Actualizado hace instantes" de gen_D en
  la auditoría anterior).
- **Okabe & Ito — "Color Universal Design"** (`jfly.uni-koeln.de/color/`) —
  paper/recurso clásico y muy citado sobre qué matices son distinguibles
  para los tipos comunes de daltonismo (protanopia/deuteranopia). Da
  sustituciones concretas (bermellón, verde azulado, púrpura rojizo) en vez
  de solo decir "cuidado con rojo-verde".
- **WCAG 2.2 — 1.4.8 Visual Presentation** (AAA) — revisitada con acceso
  real. Confirmado sub-requisito por sub-requisito (fetch a la página
  "Understanding SC 1.4.8"): el único sub-requisito de color real
  (selección de foreground/background por la persona usuaria) sigue
  necesitando interacción/acceso a configuración, no es verificable desde
  una imagen estática — la misma razón por la que quedó fuera en la Ronda 2
  sigue siendo válida, ahora confirmada en vivo en vez de por memoria.
- **IBM Carbon Design System — Accessibility/Color** (`carbondesignsystem.com`) —
  documentación real de UI, pero sus umbrales (4.5:1 texto, 3:1 texto
  grande/componentes, "no dependas solo del color") son exactamente los
  mismos que WCAG 1.4.3/1.4.11/1.4.1 ya promovidos — encuestada, sin
  cobertura nueva que sumar.
- **Material Design 3 — color contrast** (`m3.material.io`) — página
  renderizada por JS, no accesible vía fetch en este entorno; no se pudo
  encuestar su contenido real esta ronda (documentado en vez de inventado).

### Candidatos evaluados: 2 (ambos promovidos, ≥9/12) — `SEED_CRITERIA_BATCH11`

| Candidato | Obs. | Evidencia | Mobile | Accion. | Total |
|---|---|---|---|---|---|
| El ratio WCAG sobrestima contraste en dark mode casi-negro — sanity-check adicional con APCA | 3 | 2 | 3 | 3 | 11/12 |
| Sustituir rojo-verde puro por bermellón/verde azulado/púrpura rojizo (Okabe & Ito) | 3 | 3 | 3 | 3 | 12/12 |

El candidato de APCA puntúa 2/3 en evidencia (no 3) porque APCA todavía es
"candidato para WCAG 3", no un estándar ratificado — es investigación
aplicada real y con buen respaldo, pero no tiene el mismo peso normativo
que un SC ya publicado. Se agregó una entrada en `CRITERION_CONFLICTS`
(seed4-001 vs seed11-001) aclarando que no es una contradicción: el ratio
WCAG sigue siendo el umbral normativo a citar como violación formal, APCA
es un chequeo adicional para el caso específico de fondo casi negro, no un
reemplazo.

El candidato de Okabe & Ito es explícitamente distinto de los criterios ya
promovidos sobre "no dependas solo del color para categorías/series" (seed
de batch1 línea 182, y el de daltonismo en gráficos de batch8) — esos son
sobre sumar un canal redundante (forma, patrón, etiqueta); este es sobre
qué matiz elegir cuando sí se usa color. No hay duplicación.

### Rechazado / sin promoción esta ronda

| Candidato | Motivo |
|---|---|
| **1.4.8 Visual Presentation — selección de foreground/background por la persona usuaria** | Confirmado en vivo: requiere interacción/acceso a configuración, no verificable desde una imagen estática — mismo motivo de la Ronda 2, ahora con fetch real en vez de memoria. |
| **Umbrales de contraste de IBM Carbon / Material Design 3** | Encuestadas, pero no aportan cobertura nueva — sus números coinciden exactamente con WCAG 1.4.3/1.4.11/1.4.1 ya promovidos. No se promueve un criterio "más" solo porque venga de una fuente distinta si dice lo mismo que uno que ya está. |

### Números de esta ronda

- Fuentes encuestadas: **5** (APCA, Okabe & Ito, WCAG 1.4.8 revisitada, IBM
  Carbon, Material Design 3 — esta última no accesible)
- Candidatos evaluados: **2** (ambos promovidos)
- Promovidos (≥9/12): **2**
- Confirmado sin cambios (spot-check en vivo): 1 (seed4-001, 1.4.6 Contrast
  Enhanced — la URL y los umbrales eran correctos)
- Confirmado rechazo previo con evidencia real (antes era de memoria): 1
  (sub-requisito de color de 1.4.8)
- Sin cobertura nueva por duplicar umbrales ya promovidos: 2 (IBM Carbon,
  y los umbrales ya conocidos que también cita Material Design)
- Base total después de esta ronda: **219** (217 + 2)
- Además de sumar los 2 criterios a la base de documentación, esta ronda
  sumó las mismas 2 ideas — en versión resumida — a
  `GENERIC_AI_SLOP_ANTIPATTERNS` (sección "Color y superficie" del skill de
  construcción), para que también beneficien a la generación, no solo a la
  crítica.

## Ronda 12 (21 de agosto de 2026) — Gaps de generación detectados por una crítica dura y real

Disparada por una crítica directa y detallada del usuario a `gen_E_light.html`
(un "with-skill" real, generado con `skill-construccion-v3.md`), calificada
por el propio usuario como "de las peores pantallas" que había visto. Se
verificó cada queja contra el código real (no se asumió que tenía razón por
default, pero tampoco se la puso a prueba con excusas): contraste de botones
medido matemáticamente (1.06:1 contra un mínimo de 3:1), padding de tarjeta
inconsistente confirmado en el CSS (22px vs. 20px en todo el resto), leyenda
redundante confirmada visualmente, menú inferior sin `gap` confirmado en el
CSS. Los primeros tres (contraste, padding, leyenda) y el cuarto (menú
apretado) se arreglaron a mano de inmediato en el archivo — esta ronda es el
paso siguiente: generalizar esos hallazgos puntuales a criterios reutilizables
para que el generador no vuelva a cometerlos, siguiendo el mismo pedido
explícito del equipo ("que se sume a nuestra base de criterios") ya aplicado
en la Ronda 9.

### Fuentes encuestadas

- **NN/g (Kate Moran) — "Clutter-Free: One of the 3 Cs for Better Charts"**
  (`nngroup.com/articles/clutter-charts`) — artículo práctico de UX que cita
  directamente el data-ink ratio de Tufte: un elemento de datos que se vuelve
  redundante una vez que hay otro elemento informativo (ej. una etiqueta con
  el valor exacto) debería eliminarse, no coexistir "porque se ve bien".
  Aplica directo al sparkline decorativo de `gen_E_light` (una línea
  zigzagueante sin eje, sin escala, junto a un chip que ya decía "+4% este
  mes vs. mes anterior" en texto claro).
- **Jakob Nielsen / NN/g — "Reduce Redundancy: Decrease Duplicated Design
  Decisions"** (`nngroup.com/articles/reduce-redundancydecrease-duplicated-design-decisions`,
  2002) — principio de que duplicar información o funcionalidad aumenta la
  carga cognitiva sin beneficio real, porque la persona usuaria rara vez
  reconoce el duplicado como intencional. El artículo original habla de
  links/funcionalidad duplicada en navegación, no específicamente de
  leyendas de gráficos — se adaptó el principio general al caso puntual
  (leyenda separada que repite el mismo mapeo color→categoría que ya
  muestra cada fila), que es una instancia directa del mismo problema.
- **Cieden — "Spacing best practices"**
  (`cieden.com/book/sub-atomic/spacing/spacing-best-practices`) — documenta
  el sistema de grid de 8pt (adoptado por Apple y Google) y la regla
  "interno ≤ externo": el espacio externo (margin) de un elemento debería
  ser igual o mayor al espacio interno (padding) que usa. Explica
  directamente por qué un padding de tarjeta de 22px en una pantalla con
  margen base de 20px se percibe como "todo nace de un lugar distinto",
  aunque el número en sí no sea objetivamente "malo".
- **WCAG 2.2 — 2.5.8 Target Size (Minimum)** (revisitada, ya en la base
  desde la Ronda 2 como `seed2-003`) — se releyó el mecanismo exacto de la
  excepción de espaciado: un objetivo menor a 24×24px solo es aceptable si
  un círculo de 24px de diámetro centrado en su caja no se superpone con el
  de un objetivo vecino. `gen_E_light` tenía 5 íconos de bottom-nav de
  ~20-21px sin ningún `gap` entre ellos — fallaba el mecanismo de espaciado
  aunque cada ícono individual pudiera rozar el mínimo de tamaño.

### Candidatos evaluados: 4 (3 promovidos, 1 rechazado por duplicar cobertura existente)

| Candidato | Obs. | Evidencia | Mobile | Accion. | Total |
|---|---|---|---|---|---|
| Gráfico decorativo sin valor informativo (chartjunk) — eliminar si es redundante con texto ya presente | 3 | 2 | 3 | 3 | 11/12 |
| Leyenda separada que repite el mapeo color→categoría ya mostrado en cada fila | 3 | 2 | 3 | 3 | 11/12 |
| Línea base de espaciado consistente entre tarjetas/secciones hermanas (grid 8pt + interno≤externo) | 2 | 2 | 3 | 3 | 10/12 |
| Espaciado mínimo entre objetivos táctiles adyacentes en toolbars/nav de solo-ícono | 3 | 3 | 3 | 3 | 12/12 — **rechazado por duplicado**, ver abajo |

El candidato de espaciado entre objetivos táctiles puntúa alto (12/12) pero
**no se promovió como criterio nuevo**: es el mismo SC normativo que
`seed2-003` (WCAG 2.5.8) y su versión reforzada `seed4-004` (WCAG AAA
2.5.5) — solo estábamos a punto de describir con más detalle el mecanismo
de un criterio que ya existe, no de sumar cobertura nueva. Promover un
criterio "más" que dice lo mismo que uno que ya está habría sido exactamente
el tipo de redundancia que esta misma ronda está documentando como
problema — así que en vez de duplicar, se enriqueció el texto de
`GENERIC_AI_SLOP_ANTIPATTERNS` explicitando el mecanismo del círculo de
24px, referenciando `seed2-003` por id.

### Rechazado / sin promoción esta ronda

| Candidato | Motivo |
|---|---|
| **Espaciado mínimo entre objetivos táctiles adyacentes** | Ya cubierto por `seed2-003` (WCAG 2.5.8) y `seed4-004` (WCAG AAA 2.5.5) — se refuerza el mecanismo en los anti-patrones de construcción en vez de duplicar el criterio en la base de documentación. |

### Números de esta ronda

- Fuentes encuestadas: **4** (NN/g Clutter-Free, NN/g Reduce Redundancy,
  Cieden spacing best practices, WCAG 2.5.8 revisitada)
- Candidatos evaluados: **4**
- Promovidos (≥9/12): **3** → `SEED_CRITERIA_BATCH12`
- Rechazado por duplicar cobertura ya existente: **1**
- Base total después de esta ronda: **222** (219 + 3)
- Los 3 criterios nuevos, más el mecanismo de espaciado de objetivos táctiles
  (sin criterio nuevo), se sumaron también a `GENERIC_AI_SLOP_ANTIPATTERNS`
  (sección "Layout y espaciado") — el objetivo explícito de esta ronda era
  mejorar el skill de CONSTRUCCIÓN, no solo el de crítica, porque el defecto
  se detectó en una pantalla generada, no en una auditada después del hecho.

## Ronda 13 (21 de agosto de 2026) — Feedback directo sobre el dogfood de "Runa"

Disparada por feedback del usuario sobre `dogfood_runa.html` (la auditoría
head-of-product de v1.20): tres quejas puntuales de producto, cada una
generalizada y sustentada con fuentes reales antes de promoverse, siguiendo
el mismo patrón de "no inventar la regla de memoria" de rondas anteriores.

### Fuentes encuestadas

- **UX Movement — "Solid Vs. Outline Icons: Which Are Faster to Recognize?"**
  (`uxmovement.com`), citando un estudio de UNC sobre estilo de ícono
  (filled-in vs. outline) — recomienda no mezclar ambos estilos dentro de
  una misma interfaz/set, elegir uno y aplicarlo consistentemente.
- **Material Design 1 — Style/Icons** (`m1.material.io/style/icons.html`) —
  guía oficial: grosor de trazo uniforme, radio de esquina uniforme, y los
  íconos del sistema usan construcción outline/stroke consistentemente; los
  estados activo/inactivo se distinguen por OPACIDAD, no cambiando de
  relleno a outline para un solo ítem del set.
- **Dora Czerna, UX Collective — "Getting type-sensitive with the
  psychology of fonts"** (`uxdesign.cc`) — la elección tipográfica tiene que
  alinearse con la categoría/personalidad de marca; serif funciona bien
  para lectura extendida, retención de memoria, formalidad/tradición/lujo;
  sans-serif para interfaces digitales, velocidad, accesibilidad, marca
  moderna/cercana. Cita el ejemplo empírico de que un anuncio de teléfono
  "delgado" funcionó mejor con una tipografía percibida como "delgada" —
  la conexión connotativa es medible, no solo estética.
- **UXPin (Andrew Martin) — "Mobile Navigation Patterns: Pros and Cons"**
  (`uxpin.com`) — el bottom tab bar es el patrón más estandarizado y
  reconocible (Instagram, Spotify), con ventajas reales de familiaridad y
  ergonomía, pero también la opción de menor distintividad; menciona
  alternativas (hamburger, navegación de pantalla completa, gestual) para
  apps que priorizan una experiencia más inmersiva/distintiva.

### Candidatos evaluados: 3 (los 3 promovidos, ≥9/12)

| Candidato | Obs. | Evidencia | Mobile | Accion. | Total |
|---|---|---|---|---|---|
| Consistencia de estilo de ícono dentro de un mismo set (no mezclar relleno/outline) | 3 | 3 | 3 | 3 | 12/12 |
| Serif como connotación real, no decisión neutral — ajuste a categoría de producto | 2 | 2 | 3 | 3 | 10/12 |
| Bottom nav fijo por default vs. libertad creativa real | 2 | 2 | 3 | 2 | 9/12 |

El candidato de íconos puntúa 12/12 porque tiene doble respaldo: un estudio
académico (UNC) Y una especificación oficial de un design system mayor
(Material Design) diciendo lo mismo — el estándar de evidencia más alto que
maneja este proyecto.

El candidato de bottom nav es el más débil de los tres (9/12, justo en el
corte) porque es más una recomendación de "considerá una alternativa" que
una regla dura y verificable — se promovió igual porque el corte es ≥9/12 y
no ≥10/12, pero se dejó explícito en el texto del criterio que esto NO
contradice usar convención de plataforma cuando el contexto la exige (Ley
de Jakob, ya citada en el `RUBRIC_PROMPT` de crítica) — es específicamente
sobre qué hacer cuando SÍ hay libertad y no se está aprovechando.

### Rechazado / sin promoción esta ronda

Ninguno — los 3 candidatos evaluados pasaron el corte. La cuarta queja del
usuario (quitar el saludo "Hola, Alex" + día de la semana + fecha del header
de "Runa" porque no aporta valor cuando el gráfico semanal ya muestra qué
día es "hoy") no generó un criterio nuevo — es una instancia más del
principio de redundancia ya cubierto por `seed12-001`/`seed12-002` y por el
punto 4 del cierre de auto-verificación agregado en v1.20 ("¿algún dato
aparece dos veces sin agregar nada la segunda vez?"). Se aplicó directo en
la siguiente iteración del dogfood, sin sumar un criterio redundante sobre
la redundancia.

### Números de esta ronda

- Fuentes encuestadas: **4** (UX Movement + estudio UNC, Material Design 1,
  UX Collective/Czerna, UXPin)
- Candidatos evaluados: **3**
- Promovidos (≥9/12): **3** → `SEED_CRITERIA_BATCH13`
- Base total después de esta ronda: **225** (222 + 3)
- Los 3 criterios se sumaron también a `GENERIC_AI_SLOP_ANTIPATTERNS`
  (secciones "Componentes y affordance", "Tipografía" y "Layout y
  espaciado") — otra vez el defecto se detectó en una pantalla generada
  (el dogfood de "Runa"), así que el foco vuelve a ser reforzar el skill de
  CONSTRUCCIÓN, no solo el de crítica.

## Próxima ronda sugerida

1. Spot-check manual de los 7 criterios AAA de la ronda 2 contra el texto
   oficial de w3.org (pendiente de acceso de red real).
2. Revisar los 6 borderline de la ronda 2 — atomizarlos en sub-reglas más
   específicas puede subirlos del 8/12 al corte.
3. Data viz por tipo de gráfico específico (mapas, sankey, treemaps).
4. ISO 9241-210 desglosado.
5. Si el equipo consigue acceso completo (no paywalled) al libro de Holloway,
   re-encuestar `establishing-app-critique-objectives`,
   `six-frameworks-for-critiquing-apps` y el resto de `acing-the-app-critique`
   — quedó contenido sin ver detrás del paywall que podría tener más
   hallazgos atómicos como los de `app-critique-in-action`.
6. Nagging y otros patrones de Brignull que requieren observar el paso del
   tiempo (spam a contactos, notificaciones repetidas) — candidatos a
   re-evaluar si el producto suma un modo de crítica de flujo/sesión
   multi-captura.

Cada ronda de este tamaño suma ~2-35 criterios reales — llegar a 1.500-2.000
con este nivel de rigor son varias decenas de rondas, no una sola sesión.
