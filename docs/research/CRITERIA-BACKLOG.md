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
