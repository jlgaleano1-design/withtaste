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

## Próxima ronda sugerida

1. Spot-check manual de los 7 criterios AAA de la ronda 2 contra el texto
   oficial de w3.org (pendiente de acceso de red real).
2. Revisar los 6 borderline de la ronda 2 — atomizarlos en sub-reglas más
   específicas puede subirlos del 8/12 al corte.
3. Data viz por tipo de gráfico específico (mapas, sankey, treemaps).
4. ISO 9241-210 desglosado.

Cada ronda de este tamaño suma ~7-35 criterios reales — llegar a 1.500-2.000
con este nivel de rigor son varias decenas de rondas, no una sola sesión.
