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
- Promovidos a la base viva (≥9/12): **30** (batch3, sumados a los 145 de batch1+2
  = **175 criterios activos**)
- Documentados en backlog (candidatos reales, evaluados, por debajo del corte): ~12
- Categorías identificadas pero no encuestadas todavía: 5

## Próxima ronda sugerida

Repetir el mismo proceso sobre: WCAG AAA (filtrado a lo que sí es observable),
1.3.5/1.3.1 si se suma inspección de accesibilidad más allá de lo visual, y las
categorías de data viz específicas por tipo de gráfico. Cada ronda de este tamaño
suma ~25-35 criterios reales — llegar a 1.500-2.000 con este nivel de rigor son
varias decenas de rondas, no una sola sesión.
