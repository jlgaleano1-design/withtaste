# Prompt para agente con acceso a navegación web

Copiá y pegá esto en un agente que SÍ tenga acceso a internet (otra sesión de
Claude con búsqueda web activada, ChatGPT con browsing, Perplexity, o similar).
El resultado que te devuelva pegámelo acá para que lo revisemos e indexemos antes
de sumarlo al criterio oficial — no lo incorpores directo.

---

## PROMPT (copiar desde acá)

Sos une investigadore de UX que sintetiza documentación técnica de design systems
públicos para alimentar el criterio de una herramienta de crítica de interfaces
basada en IA. Tu tarea es visitar las siguientes fuentes y extraer, de cada una,
las secciones de **Anatomy** (anatomía del componente), **Usage / Best practices**
(cuándo usar y cuándo no) y **States** (estados de interacción: default, hover,
focus, disabled, error, etc.), para los componentes más relevantes de cada fuente.

**Fuentes a visitar:**
1. Open UI (W3C Community Group) — https://open-ui.org/
2. ARIA Authoring Practices Guide (APG) — https://www.w3.org/WAI/ARIA/apg/
3. GOV.UK Design System — https://design-system.service.gov.uk/
4. Salesforce Lightning Design System (SLDS) — https://www.lightningdesignsystem.com/
5. Atlassian Design System — https://atlassian.design/
6. Uber Base Web — https://baseweb.design/
7. Microsoft Fluent 2 — https://fluent2.microsoft.design/
8. Audi Design System — https://www.audi.com/ci/ (documentación pública limitada:
   es más un portal de identidad de marca que un catálogo técnico de componentes;
   si no encontrás secciones claras de Anatomy/States ahí, anotalo en "Notas del
   investigador" en vez de inventar contenido)

**Componentes prioritarios a buscar en esas fuentes** (si existen ahí): dropdown/
select, combobox, modal/dialog, tabs, accordion, formularios y validación de
errores, tabla de datos, notificaciones/toasts, menú de navegación, botones y sus
estados, estados vacíos (empty states), y — específico de Audi — patrones de
configurador de producto (selección de opciones, resolución de conflictos entre
variantes, desglose de precio).

**Reglas estrictas de salida (importantes, no las ignores):**
- **NO copies texto textual** de ninguna de las fuentes. Todo tiene que estar
  parafraseado, en tus propias palabras — es documentación con derechos de autor
  de W3C y del gobierno de UK, y además texto copiado literal no sirve para
  meterlo dentro de un prompt de sistema.
- Cada afirmación tiene que llevar la URL específica de la página de origen (no
  solo el dominio general), para que después se pueda verificar.
- Sé conciso: cada "regla" debe poder resumirse en una oración de menos de 25
  palabras, pensada para funcionar como una fila dentro de una rúbrica de
  evaluación, no como un párrafo explicativo largo.
- Si una fuente no tiene una sección "Anatomy" o "States" clara para un
  componente, no la inventes — simplemente omitila para ese componente.

**Formato de salida (usá exactamente esta estructura):**

Primero, una tabla-índice general:

| Componente | Fuente | Qué aporta (1 línea) |
|---|---|---|

Después, para cada componente, un bloque con este formato:

### [Nombre del componente] — [Fuente]
**URL:** [url exacta de la página]

**Anatomía:**
- [parte del componente] — [para qué sirve, en una frase corta]

**Cuándo usar / no usar:**
- Usar cuando: [...]
- No usar cuando: [...]

**Estados y comportamiento:**
- [estado] → [regla de comportamiento esperado, en una frase corta]

---

Cuando termines, agregá al final una sección corta "Notas del investigador" con
cualquier ambigüedad, fuente que no pudiste acceder, o componente que no tenía
suficiente documentación pública.

## FIN DEL PROMPT (hasta acá)

---

### Qué hacer con el resultado

Cuando el otro agente te devuelva esto, traémelo tal cual (o pegalo en un archivo)
y yo:
1. Reviso que efectivamente esté parafraseado y no sea texto copiado.
2. Lo mapeo contra nuestras 9 categorías actuales (¿va en "Componentes y
   affordance"? ¿en "Accesibilidad"?) y contra los 3 bloques de puntuación.
3. Te armo el índice de aprobación de siempre, antes de tocar el `RUBRIC_PROMPT`
   o el documento de criterio.

Si en algún momento aparecen fuentes nuevas que quieran sumar más adelante, el
mismo prompt sirve de plantilla — solo hay que agregar la URL a la lista de
"Fuentes a visitar".
