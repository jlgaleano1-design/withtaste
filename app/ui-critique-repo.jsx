import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Upload, ArrowLeft, Check, X, Clock, Loader2, Trash2, ClipboardList, PlusCircle, Pencil, Save, MapPin, ThumbsUp, Download, Lock, ChevronDown } from "lucide-react";

const CRITERIA_VERSION = "v1.15 · 20 ago 2026";

// Resumen de una línea de qué cambió en la versión vigente — se muestra en el
// modal de "Descargar skill" para que quede claro que esto es un documento
// vivo, no un export estático que nadie toca. Actualizar a mano cada vez que
// se bumpea CRITERIA_VERSION, mismo criterio que el historial de versiones en
// docs/CRITERIOS-DE-CRITICA.md.
const CRITERIA_LATEST_CHANGE =
  "Lote 8: 11 criterios de Vercel Design Guidelines (radios anidados, safe areas, números tabulares, paletas para daltonismo, entre otros) — suma a la nueva dimensión 'Patrones oscuros' del lote 7.";

// Semilla real de criterios atómicos, migrados del PDF "UX Component Critique
// Criteria" (Open UI, WAI-ARIA APG, GOV.UK, Salesforce Lightning, Atlassian,
// Uber Base Web, Fluent 2). Cada registro es atómico y tiene su URL de origen
// real. Esto reemplaza el bloque de texto fijo que antes vivía pegado dentro
// del RUBRIC_PROMPT — ahora se guarda en window.storage y se filtra por tags
// antes de cada crítica, en vez de mandarse siempre entero.
const SEED_CRITERIA = [
  // Select / Dropdown
  { statement: "Evitá un select cuando pocas opciones puedan mostrarse directamente como radios.", dimension: "Componentes y affordance", component: "select", evidenceTier: "media-alta", principle: "GOV.UK — select", sourceUrl: "https://design-system.service.gov.uk/components/select/" },
  { statement: "No preselecciones respuestas en preguntas cuando el valor inicial pueda sesgar a la persona usuaria.", dimension: "Componentes y affordance", component: "select", evidenceTier: "media-alta", principle: "GOV.UK — select", sourceUrl: "https://design-system.service.gov.uk/components/select/" },
  { statement: "Un select de configuración puede tener valor predeterminado cuando ese valor representa el estado inicial real del sistema.", dimension: "Componentes y affordance", component: "select", evidenceTier: "media-alta", principle: "GOV.UK — select", sourceUrl: "https://design-system.service.gov.uk/components/select/" },
  { statement: "El trigger cerrado de un select debe comunicar claramente el valor seleccionado.", dimension: "Componentes y affordance", component: "select", evidenceTier: "contextual", principle: "Open UI — customizable select", sourceUrl: "https://open-ui.org/components/customizable-select.explainer/" },
  { statement: "La selección debe poder distinguirse del foco cuando ambos estados puedan coexistir.", dimension: "Accesibilidad", component: "select", evidenceTier: "contextual", principle: "Open UI — customizable select", sourceUrl: "https://open-ui.org/components/customizable-select.explainer/" },
  { statement: "Escape debe cerrar una lista de select abierta sin cambiar la selección.", dimension: "Accesibilidad", component: "select", evidenceTier: "contextual", principle: "Open UI — customizable select", sourceUrl: "https://open-ui.org/components/customizable-select.explainer/" },
  { statement: "Un select disabled debe comunicar indisponibilidad de forma perceptible y no interactiva.", dimension: "Componentes y affordance", component: "select", evidenceTier: "media", principle: "SLDS — select", sourceUrl: "https://www.lightningdesignsystem.com/2e1ef8501/p/60fa86-select" },
  { statement: "El estado error de un select debe estar asociado claramente al control afectado.", dimension: "Copy y microcopy", component: "select", evidenceTier: "media", principle: "SLDS — select", sourceUrl: "https://www.lightningdesignsystem.com/2e1ef8501/p/60fa86-select" },

  // Combobox / Autocomplete
  { statement: "Usá combobox cuando escribir permita buscar, filtrar sugerencias o introducir valores libres; para pocas opciones fijas alcanza un select simple.", dimension: "Componentes y affordance", component: "combobox", evidenceTier: "alta", principle: "ARIA APG — combobox", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/" },
  { statement: "El input debe mantener el foco mientras las flechas recorren sugerencias en el patrón ARIA habitual.", dimension: "Accesibilidad", component: "combobox", evidenceTier: "alta", principle: "ARIA APG — combobox", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/" },
  { statement: "Foco y selección deben ser visualmente distinguibles en un combobox.", dimension: "Accesibilidad", component: "combobox", evidenceTier: "alta", principle: "ARIA APG — combobox", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/" },
  { statement: "Escape debe permitir abandonar las sugerencias de un combobox sin cambios inesperados.", dimension: "Accesibilidad", component: "combobox", evidenceTier: "alta", principle: "ARIA APG — combobox", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/combobox/" },
  { statement: "Escribir en un combobox filtro debería reducir las opciones visibles.", dimension: "Componentes y affordance", component: "combobox", evidenceTier: "media-alta", principle: "Fluent 2 — combobox usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/combobox/usage" },
  { statement: "Un combobox multiselect puede permanecer abierto mientras se realizan varias selecciones.", dimension: "Componentes y affordance", component: "combobox", evidenceTier: "media-alta", principle: "Fluent 2 — combobox usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/combobox/usage" },
  { statement: "Un placeholder no debe sustituir al label del campo en un combobox.", dimension: "Copy y microcopy", component: "combobox", evidenceTier: "media-alta", principle: "Fluent 2 — combobox usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/combobox/usage" },

  // Dialog / Modal
  { statement: "Usá modal cuando una tarea requiera atención antes de volver a interactuar con la superficie inferior.", dimension: "Componentes y affordance", component: "modal", evidenceTier: "alta", principle: "ARIA APG — dialog modal", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/" },
  { statement: "Un modal abierto debe impedir la interacción con el contenido exterior.", dimension: "Accesibilidad", component: "modal", evidenceTier: "alta", principle: "ARIA APG — dialog modal", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/" },
  { statement: "El foco inicial de un modal debe colocarse en un punto útil para comprender o completar la tarea.", dimension: "Accesibilidad", component: "modal", evidenceTier: "alta", principle: "ARIA APG — dialog examples", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/" },
  { statement: "Tab y Shift+Tab deben mantener el foco dentro del modal.", dimension: "Accesibilidad", component: "modal", evidenceTier: "alta", principle: "ARIA APG — dialog examples", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/" },
  { statement: "Escape debe cerrar un modal convencional cuando no exista una razón explícita para impedirlo.", dimension: "Accesibilidad", component: "modal", evidenceTier: "alta", principle: "ARIA APG — dialog examples", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/" },
  { statement: "Al cerrar un modal, el foco normalmente debe volver al elemento que lo abrió.", dimension: "Accesibilidad", component: "modal", evidenceTier: "alta", principle: "ARIA APG — dialog modal", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/" },
  { statement: "Evitá modales para feedback ligero que puede resolverse con un toast u otro mensaje no bloqueante.", dimension: "Componentes y affordance", component: "modal", evidenceTier: "media-alta", principle: "Fluent 2 — dialog usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/dialog/usage" },
  { statement: "Evitá dialogs anidados.", dimension: "Componentes y affordance", component: "modal", evidenceTier: "media-alta", principle: "Fluent 2 — dialog usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/dialog/usage" },
  { statement: "Un alert dialog debe reservarse para decisiones importantes, riesgo o posible pérdida.", dimension: "Componentes y affordance", component: "modal", evidenceTier: "media-alta", principle: "Fluent 2 — dialog usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/dialog/usage" },

  // Tabs
  { statement: "Usá tabs cuando se alterna frecuentemente entre secciones estrechamente relacionadas.", dimension: "Componentes y affordance", component: "tabs", evidenceTier: "media-alta", principle: "GOV.UK — tabs", sourceUrl: "https://design-system.service.gov.uk/components/tabs/" },
  { statement: "Evitá tabs cuando el contenido debe leerse secuencialmente o cuando debe compararse simultáneamente entre secciones.", dimension: "Componentes y affordance", component: "tabs", evidenceTier: "media-alta", principle: "GOV.UK — tabs", sourceUrl: "https://design-system.service.gov.uk/components/tabs/" },
  { statement: "No uses tabs como sustituto indiscriminado de la navegación principal.", dimension: "Componentes y affordance", component: "tabs", evidenceTier: "media-alta", principle: "GOV.UK / Fluent 2 — tabs", sourceUrl: "https://design-system.service.gov.uk/components/tabs/" },
  { statement: "Solo el panel asociado a la pestaña activa debe presentarse como contenido seleccionado.", dimension: "Accesibilidad", component: "tabs", evidenceTier: "alta", principle: "ARIA APG — tabs", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/" },
  { statement: "La pestaña activa debe comunicarse tanto visual como programáticamente.", dimension: "Accesibilidad", component: "tabs", evidenceTier: "alta", principle: "ARIA APG — tabs", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/tabs/" },
  { statement: "En overflow, considerá dropdown o accordion si descubrir tabs ocultas se vuelve difícil.", dimension: "Componentes y affordance", component: "tabs", evidenceTier: "media-alta", principle: "Fluent 2 — tablist usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/tablist/usage" },

  // Accordion
  { statement: "Usá accordion cuando la persona usuaria pueda necesitar solo algunas secciones de un conjunto relacionado.", dimension: "Componentes y affordance", component: "accordion", evidenceTier: "media-alta", principle: "GOV.UK — accordion", sourceUrl: "https://design-system.service.gov.uk/components/accordion/" },
  { statement: "Evitá accordion cuando todo el contenido debe leerse, o cuando el problema real es de arquitectura de información.", dimension: "Componentes y affordance", component: "accordion", evidenceTier: "media-alta", principle: "GOV.UK — accordion", sourceUrl: "https://design-system.service.gov.uk/components/accordion/" },
  { statement: "Evitá accordions anidados.", dimension: "Componentes y affordance", component: "accordion", evidenceTier: "media-alta", principle: "GOV.UK — accordion", sourceUrl: "https://design-system.service.gov.uk/components/accordion/" },
  { statement: "Expanded y collapsed deben comunicarse programáticamente en un accordion.", dimension: "Accesibilidad", component: "accordion", evidenceTier: "alta", principle: "ARIA APG — accordion", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/" },

  // Forms
  { statement: "Cada campo debe tener un label que explique claramente qué información solicita.", dimension: "Copy y microcopy", component: "form", evidenceTier: "media-alta", principle: "Fluent 2 / Base Web — field", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/field/usage" },
  { statement: "El placeholder no debe sustituir información esencial ni el label.", dimension: "Copy y microcopy", component: "form", evidenceTier: "media-alta", principle: "Fluent 2 — field usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/field/usage" },
  { statement: "Usá helper text para explicar formatos o restricciones antes de que ocurra el error, no después.", dimension: "Copy y microcopy", component: "form", evidenceTier: "media-alta", principle: "Fluent 2 — field usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/field/usage" },
  { statement: "Agrupá controles relacionados mediante una estructura semántica apropiada.", dimension: "Componentes y affordance", component: "form", evidenceTier: "media", principle: "Atlassian — form", sourceUrl: "https://atlassian.design/components/form" },
  { statement: "Required debe comunicarse visual y programáticamente.", dimension: "Accesibilidad", component: "form", evidenceTier: "media-alta", principle: "Fluent 2 — field usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/field/usage" },
  { statement: "Disabled en un campo debe conservar suficiente información contextual para entender qué está indisponible.", dimension: "Componentes y affordance", component: "form", evidenceTier: "media-alta", principle: "Fluent 2 — field usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/field/usage" },

  // Validación / errores
  { statement: "Un error debe explicar qué ocurrió y cómo corregirlo, nunca un mensaje genérico.", dimension: "Copy y microcopy", component: "form", evidenceTier: "media-alta", principle: "GOV.UK — error message", sourceUrl: "https://design-system.service.gov.uk/components/error-message/" },
  { statement: "Coloca el mensaje de error junto al campo que debe corregirse.", dimension: "Copy y microcopy", component: "form", evidenceTier: "media-alta", principle: "GOV.UK / SLDS — error message", sourceUrl: "https://design-system.service.gov.uk/components/error-message/" },
  { statement: "No dependas únicamente del color para comunicar un error.", dimension: "Color y contraste", component: "form", evidenceTier: "media-alta", principle: "GOV.UK — error message", sourceUrl: "https://design-system.service.gov.uk/components/error-message/" },
  { statement: "Mantené las respuestas ingresadas después de una validación fallida para evitar trabajo repetido.", dimension: "Componentes y affordance", component: "form", evidenceTier: "media-alta", principle: "GOV.UK — error message", sourceUrl: "https://design-system.service.gov.uk/components/error-message/" },
  { statement: "El resumen de errores y los errores inline deben describir coherentemente los mismos problemas.", dimension: "Copy y microcopy", component: "form", evidenceTier: "media-alta", principle: "GOV.UK — error message", sourceUrl: "https://design-system.service.gov.uk/components/error-message/" },
  { statement: "En formularios extensos, llevá el foco al resumen de errores y vinculá cada error con su campo.", dimension: "Accesibilidad", component: "form", evidenceTier: "media-alta", principle: "Fluent 2 — messagebar usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/messagebar/usage" },

  // Buttons
  { statement: "Usá botón para ejecutar una acción; usá enlace cuando la intención principal sea navegar.", dimension: "Componentes y affordance", component: "buttons", evidenceTier: "media-alta", principle: "Fluent 2 — button usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/button/usage" },
  { statement: "Una superficie debería tener una acción visualmente dominante, no varios botones primarios competidores.", dimension: "Jerarquía visual", component: "buttons", evidenceTier: "media-alta", principle: "Fluent 2 — button usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/button/usage" },
  { statement: "Una variante warning debe reservarse para acciones potencialmente dañinas o irreversibles.", dimension: "Componentes y affordance", component: "buttons", evidenceTier: "media-alta", principle: "GOV.UK — button", sourceUrl: "https://design-system.service.gov.uk/components/button/" },
  { statement: "El foco de un botón debe ser claramente perceptible para personas que usan teclado.", dimension: "Accesibilidad", component: "buttons", evidenceTier: "media", principle: "SLDS — button", sourceUrl: "https://www.lightningdesignsystem.com/2e1ef8501/p/7733f8-button" },
  { statement: "Disabled en un botón no debe eliminar información o acceso necesario para comprender la interfaz.", dimension: "Componentes y affordance", component: "buttons", evidenceTier: "media", principle: "Atlassian — button examples", sourceUrl: "https://atlassian.design/components/button/examples" },

  // Notifications / Toasts
  { statement: "Usá toast para feedback temporal que no necesita bloquear a la persona usuaria.", dimension: "Componentes y affordance", component: "toast", evidenceTier: "media-alta", principle: "Fluent 2 — toast usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/toast/usage" },
  { statement: "No uses toast cuando el usuario debe atender el mensaje antes de continuar.", dimension: "Componentes y affordance", component: "toast", evidenceTier: "media-alta", principle: "Fluent 2 — toast usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/toast/usage" },
  { statement: "Pausá el autocierre del toast mientras la persona usuaria interactúa con él.", dimension: "Componentes y affordance", component: "toast", evidenceTier: "media-alta", principle: "Fluent 2 — toast usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/toast/usage" },
  { statement: "No permitas cerrar un toast si la información desaparecería sin posibilidad razonable de recuperarla.", dimension: "Componentes y affordance", component: "toast", evidenceTier: "media-alta", principle: "Fluent 2 — toast usage", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/toast/usage" },
  { statement: "Error, warning, success e info deben expresar semánticas diferentes, no solo colores diferentes.", dimension: "Color y contraste", component: "toast", evidenceTier: "media-alta", principle: "SLDS / Fluent 2 — toast", sourceUrl: "https://fluent2.microsoft.design/components/web/react/core/messagebar/usage" },

  // Data tables
  { statement: "Usá tablas cuando la persona usuaria deba comparar información mediante relaciones claras entre filas y columnas.", dimension: "Componentes y affordance", component: "table", evidenceTier: "media-alta", principle: "GOV.UK / SLDS — table", sourceUrl: "https://design-system.service.gov.uk/components/table/" },
  { statement: "No uses una tabla únicamente como mecanismo de layout.", dimension: "Componentes y affordance", component: "table", evidenceTier: "media-alta", principle: "GOV.UK — table", sourceUrl: "https://design-system.service.gov.uk/components/table/" },
  { statement: "Los headers de una tabla deben explicar claramente el significado de los datos.", dimension: "Copy y microcopy", component: "table", evidenceTier: "media-alta", principle: "GOV.UK — table", sourceUrl: "https://design-system.service.gov.uk/components/table/" },
  { statement: "Alineá los números de forma consistente para facilitar la comparación en una tabla.", dimension: "Espaciado y alineación", component: "table", evidenceTier: "media-alta", principle: "GOV.UK — table", sourceUrl: "https://design-system.service.gov.uk/components/table/" },
  { statement: "Para tablas interactivas, considerá explícitamente sorting, pagination y reordering cuando sean necesarios.", dimension: "Componentes y affordance", component: "table", evidenceTier: "media", principle: "Atlassian — dynamic table", sourceUrl: "https://atlassian.design/components/dynamic-table" },

  // Empty states
  { statement: "Usá un empty state cuando no existen datos o contenido que mostrar.", dimension: "Componentes y affordance", component: "empty-state", evidenceTier: "media", principle: "Atlassian — empty state", sourceUrl: "https://atlassian.design/components/empty-state" },
  { statement: "El empty state debe explicar qué ocurrió o qué representa la ausencia de contenido.", dimension: "Copy y microcopy", component: "empty-state", evidenceTier: "media", principle: "Atlassian — empty state", sourceUrl: "https://atlassian.design/components/empty-state" },
  { statement: "Siempre que sea posible, un empty state debe ofrecer una vía clara para avanzar o crear contenido.", dimension: "Claridad del propósito", component: "empty-state", evidenceTier: "media", principle: "Atlassian — empty state", sourceUrl: "https://atlassian.design/components/empty-state" },
  { statement: "No confundas empty con loading, error o sin-resultados — son situaciones conceptualmente distintas.", dimension: "Componentes y affordance", component: "empty-state", evidenceTier: "contextual", principle: "Open UI — table research", sourceUrl: "https://open-ui.org/components/table.research/" },

  // Menús / Navegación
  { statement: "Distinguí menús de comandos de navegación web convencional antes de aplicar patrones de menú.", dimension: "Componentes y affordance", component: "menu", evidenceTier: "alta", principle: "ARIA APG — menubar", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/menubar/" },
  { statement: "Los submenús deben comunicar su estado expanded/collapsed.", dimension: "Accesibilidad", component: "menu", evidenceTier: "contextual", principle: "Open UI — menu explainer", sourceUrl: "https://open-ui.org/components/menu.explainer/" },
  { statement: "Escape debe cerrar submenús y devolver el foco a un lugar predecible.", dimension: "Accesibilidad", component: "menu", evidenceTier: "alta", principle: "ARIA APG — menubar", sourceUrl: "https://www.w3.org/WAI/ARIA/apg/patterns/menubar/" },
  { statement: "Los elementos disabled de un menú no deben ejecutar acciones aunque sigan siendo visibles.", dimension: "Componentes y affordance", component: "menu", evidenceTier: "contextual", principle: "Open UI — menu explainer", sourceUrl: "https://open-ui.org/components/menu.explainer/" },
  { statement: "La navegación debe indicar claramente la ubicación actual de la persona usuaria.", dimension: "Claridad del propósito", component: "navigation", evidenceTier: "media-alta", principle: "GOV.UK — service navigation", sourceUrl: "https://design-system.service.gov.uk/components/service-navigation/" },
].map((c, i) => ({ id: `seed-${String(i + 1).padStart(3, "0")}`, batch: "component-library-v1", ...c }));

// Segundo lote: escalar la base más allá de la biblioteca de componentes.
// core:true = siempre elegible (fundamentos que aplican a casi cualquier pantalla).
// contextTags = solo elegible si el usuario marcó ese tag al subir la imagen.
// Ninguno tiene "component" — son reglas de nivel heurística/estándar, no de widget.
const SEED_CRITERIA_BATCH2 = [
  // WCAG 2.2 desglosado (mobile-relevant) — https://www.w3.org/TR/WCAG22/
  { statement: "1.4.3 Contraste (Mínimo): el texto normal debe tener contraste de al menos 4.5:1 contra su fondo; texto grande, al menos 3:1.", dimension: "Color y contraste", core: true, evidenceTier: "alta", principle: "WCAG 2.2 — 1.4.3", sourceUrl: "https://www.w3.org/TR/WCAG22/#contrast-minimum" },
  { statement: "1.4.11 Contraste No-textual: componentes de UI y objetos gráficos necesarios para entender el contenido deben tener contraste de al menos 3:1.", dimension: "Color y contraste", core: true, evidenceTier: "alta", principle: "WCAG 2.2 — 1.4.11", sourceUrl: "https://www.w3.org/TR/WCAG22/#non-text-contrast" },
  { statement: "2.5.8 Tamaño del Objetivo (Mínimo): los objetivos táctiles deben medir al menos 24×24px, salvo excepciones (inline, equivalente disponible, esencial).", dimension: "Componentes y affordance", core: true, evidenceTier: "alta", principle: "WCAG 2.2 — 2.5.8", sourceUrl: "https://www.w3.org/TR/WCAG22/#target-size-minimum" },
  { statement: "2.4.7 Foco Visible: cualquier interfaz operable por teclado debe tener un indicador de foco visible.", dimension: "Accesibilidad", core: true, evidenceTier: "alta", principle: "WCAG 2.2 — 2.4.7", sourceUrl: "https://www.w3.org/TR/WCAG22/#focus-visible" },
  { statement: "2.4.11 Foco No Oscurecido (Mínimo): cuando un componente recibe foco de teclado, al menos una parte debe permanecer visible, no tapada por headers/barras fijas.", dimension: "Accesibilidad", core: false, contextTags: ["Dashboard / datos densos", "Flujo transaccional"], evidenceTier: "alta", principle: "WCAG 2.2 — 2.4.11", sourceUrl: "https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum" },
  { statement: "2.1.1 Teclado: toda la funcionalidad debe estar disponible mediante teclado, sin requerir tiempos específicos de pulsación.", dimension: "Accesibilidad", core: true, evidenceTier: "alta", principle: "WCAG 2.2 — 2.1.1", sourceUrl: "https://www.w3.org/TR/WCAG22/#keyboard" },
  { statement: "3.3.7 Entrada Redundante: no se debe pedir a la persona usuaria que vuelva a ingresar información que ya proveyó antes en el mismo proceso.", dimension: "Copy y microcopy", core: false, contextTags: ["Flujo transaccional", "Onboarding"], evidenceTier: "alta", principle: "WCAG 2.2 — 3.3.7", sourceUrl: "https://www.w3.org/TR/WCAG22/#redundant-entry" },
  { statement: "3.3.8 Autenticación Accesible (Mínimo): no exigir una prueba cognitiva (resolver un puzzle, recordar una contraseña) como único método de autenticación, sin alternativa.", dimension: "Componentes y affordance", core: false, contextTags: ["Flujo transaccional", "Onboarding"], evidenceTier: "alta", principle: "WCAG 2.2 — 3.3.8", sourceUrl: "https://www.w3.org/TR/WCAG22/#accessible-authentication-minimum" },
  { statement: "3.2.6 Ayuda Consistente: si existe un mecanismo de ayuda/contacto, debe aparecer en la misma ubicación relativa en todas las pantallas del flujo.", dimension: "Consistencia y sistema de diseño", core: false, contextTags: ["Flujo transaccional", "Dashboard / datos densos"], evidenceTier: "alta", principle: "WCAG 2.2 — 3.2.6", sourceUrl: "https://www.w3.org/TR/WCAG22/#consistent-help" },
  { statement: "2.5.7 Movimientos de Arrastre: cualquier funcionalidad que se logre arrastrando debe tener una alternativa operable con un solo toque/click.", dimension: "Componentes y affordance", core: false, contextTags: ["Dashboard / datos densos"], evidenceTier: "alta", principle: "WCAG 2.2 — 2.5.7", sourceUrl: "https://www.w3.org/TR/WCAG22/#dragging-movements" },
  { statement: "1.3.4 Orientación: el contenido no debe restringirse a una sola orientación de pantalla (vertical u horizontal) salvo que sea esencial.", dimension: "Espaciado y alineación", core: true, evidenceTier: "alta", principle: "WCAG 2.2 — 1.3.4", sourceUrl: "https://www.w3.org/TR/WCAG22/#orientation" },
  { statement: "1.4.4 Cambio de Tamaño del Texto: el texto debe poder agrandarse hasta 200% sin pérdida de contenido o funcionalidad.", dimension: "Tipografía", core: false, contextTags: ["Onboarding"], evidenceTier: "alta", principle: "WCAG 2.2 — 1.4.4", sourceUrl: "https://www.w3.org/TR/WCAG22/#resize-text" },
  { statement: "3.3.1 Identificación de Errores: un error debe identificarse y describirse a la persona usuaria en texto, no solo con un indicador visual.", dimension: "Copy y microcopy", core: true, evidenceTier: "alta", principle: "WCAG 2.2 — 3.3.1", sourceUrl: "https://www.w3.org/TR/WCAG22/#error-identification" },
  { statement: "4.1.2 Nombre, Rol, Valor: todo componente de interfaz debe exponer programáticamente su nombre, rol y estado — no alcanza con que se vea correcto.", dimension: "Accesibilidad", core: true, evidenceTier: "alta", principle: "WCAG 2.2 — 4.1.2", sourceUrl: "https://www.w3.org/TR/WCAG22/#name-role-value" },

  // Nielsen atomizado — https://www.nngroup.com/articles/ten-usability-heuristics/
  { statement: "Visibilidad del estado del sistema: toda acción que tarde en completarse necesita un estado de carga visible, no una pantalla congelada.", dimension: "Componentes y affordance", core: true, evidenceTier: "media", principle: "Heurística de Nielsen #1 — carga", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Visibilidad del estado del sistema: después de guardar, debe haber una confirmación clara de que se guardó — no asumir que el silencio comunica éxito.", dimension: "Componentes y affordance", core: true, evidenceTier: "media", principle: "Heurística de Nielsen #1 — guardado", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Visibilidad del estado del sistema: la ubicación actual de la persona usuaria dentro de un flujo o jerarquía debe ser evidente en todo momento.", dimension: "Claridad del propósito", core: true, evidenceTier: "media", principle: "Heurística de Nielsen #1 — ubicación", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Coincidencia entre el sistema y el mundo real: usar terminología familiar para la persona usuaria, no jerga interna del sistema o del equipo.", dimension: "Copy y microcopy", core: true, evidenceTier: "media", principle: "Heurística de Nielsen #2", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Control y libertad del usuario: debe existir una salida clara (cancelar, deshacer, atrás) para una acción iniciada por error.", dimension: "Componentes y affordance", core: true, evidenceTier: "media", principle: "Heurística de Nielsen #3", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Consistencia y estándares: un mismo elemento (ícono, color, palabra) debe significar lo mismo en toda la interfaz, sin variar entre pantallas.", dimension: "Consistencia y sistema de diseño", core: true, evidenceTier: "media", principle: "Heurística de Nielsen #4", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Prevención de errores: una acción destructiva o irreversible necesita confirmación explícita antes de ejecutarse.", dimension: "Componentes y affordance", core: true, evidenceTier: "media", principle: "Heurística de Nielsen #5", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Reconocer antes que recordar: las opciones disponibles deben estar visibles, no depender de que la persona usuaria las recuerde de memoria.", dimension: "Componentes y affordance", core: true, evidenceTier: "media", principle: "Heurística de Nielsen #6", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Flexibilidad y eficiencia de uso: los atajos para personas expertas no deben imponer pasos extra a quienes recién empiezan.", dimension: "Claridad del propósito", core: false, contextTags: ["Dashboard / datos densos"], evidenceTier: "media", principle: "Heurística de Nielsen #7", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Diseño estético y minimalista: información rara vez usada no debería competir visualmente con la información relevante para la tarea actual.", dimension: "Jerarquía visual", core: true, evidenceTier: "media", principle: "Heurística de Nielsen #8", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Ayudar a reconocer y recuperarse de errores: el mensaje de error debe usar lenguaje claro (no código de error crudo) y sugerir una solución concreta.", dimension: "Copy y microcopy", core: true, evidenceTier: "media", principle: "Heurística de Nielsen #9", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },

  // Dark patterns — https://arxiv.org/abs/1907.07032 (Mathur et al.) y https://www.ftc.gov/reports/bringing-dark-patterns-light
  { statement: "Acción forzada: no obligues a completar un paso no relacionado con la tarea (ej. crear cuenta) para acceder a algo que debería ser directo.", dimension: "Claridad del propósito", core: false, contextTags: ["Flujo transaccional", "Onboarding"], evidenceTier: "alta", principle: "Dark patterns — acción forzada (Mathur et al.)", sourceUrl: "https://arxiv.org/abs/1907.07032" },
  { statement: "Obstrucción: cancelar o dar de baja algo debe ser al menos tan fácil como haberlo activado — no agregues fricción asimétrica.", dimension: "Claridad del propósito", core: false, contextTags: ["Flujo transaccional"], evidenceTier: "alta", principle: "Dark patterns — obstrucción / roach motel", sourceUrl: "https://arxiv.org/abs/1907.07032" },
  { statement: "Interferencia de interfaz: no uses jerarquía visual para dirigir la atención hacia la opción que beneficia al negocio y opacar la que beneficia a la persona usuaria.", dimension: "Jerarquía visual", core: false, contextTags: ["Flujo transaccional", "Marketing / landing"], evidenceTier: "alta", principle: "Dark patterns — interferencia de interfaz", sourceUrl: "https://arxiv.org/abs/1907.07032" },
  { statement: "Confirmshaming: la opción de rechazar/declinar no debe redactarse con lenguaje culpabilizante o humillante.", dimension: "Copy y microcopy", core: false, contextTags: ["Flujo transaccional", "Marketing / landing"], evidenceTier: "alta", principle: "Dark patterns — confirmshaming", sourceUrl: "https://arxiv.org/abs/1907.07032" },
  { statement: "Urgencia falsa: temporizadores o contadores de stock no deben simularse si no reflejan un estado real.", dimension: "Claridad del propósito", core: false, contextTags: ["Marketing / landing"], evidenceTier: "alta", principle: "Dark patterns — urgencia falsa", sourceUrl: "https://arxiv.org/abs/1907.07032" },
  { statement: "Preselección: checkboxes u opciones que benefician al negocio (upsells, suscripciones) no deben venir premarcados por defecto.", dimension: "Componentes y affordance", core: false, contextTags: ["Flujo transaccional", "Marketing / landing"], evidenceTier: "alta", principle: "Dark patterns — preselección", sourceUrl: "https://arxiv.org/abs/1907.07032" },
  { statement: "Información oculta: costos, condiciones o compromisos relevantes no deben esconderse en letra chica o pasos posteriores evitables.", dimension: "Copy y microcopy", core: false, contextTags: ["Flujo transaccional"], evidenceTier: "alta", principle: "Dark patterns — información oculta", sourceUrl: "https://arxiv.org/abs/1907.07032" },
  { statement: "Prueba social falsa: no muestres notificaciones de actividad ('12 personas viendo esto') si el dato no es real o verificable.", dimension: "Claridad del propósito", core: false, contextTags: ["Marketing / landing"], evidenceTier: "media", principle: "Dark patterns — prueba social falsa", sourceUrl: "https://www.ftc.gov/reports/bringing-dark-patterns-light" },

  // Internacionalización / i18n — https://www.w3.org/International/
  { statement: "RTL: para idiomas de derecha a izquierda, el layout completo debe espejarse (no solo el texto) — iconos direccionales, navegación, orden de columnas.", dimension: "Espaciado y alineación", core: false, contextTags: ["Internacionalización"], evidenceTier: "media-alta", principle: "W3C i18n — RTL", sourceUrl: "https://www.w3.org/International/questions/qa-html-dir.en.html" },
  { statement: "Expansión de texto: dejar margen de 30-40% extra de espacio para que el texto traducido no se corte ni desborde.", dimension: "Espaciado y alineación", core: false, contextTags: ["Internacionalización"], evidenceTier: "media-alta", principle: "W3C i18n — expansión de texto", sourceUrl: "https://www.w3.org/International/quicktips/" },
  { statement: "No asumas una estructura universal de nombre (nombre + apellido) — varios idiomas/culturas no siguen ese esquema.", dimension: "Copy y microcopy", core: false, contextTags: ["Internacionalización", "Onboarding"], evidenceTier: "media-alta", principle: "W3C i18n — nombres", sourceUrl: "https://www.w3.org/International/quicktips/" },
  { statement: "Los campos de dirección deben ser flexibles por país, no forzar un esquema fijo (ej. estado/código postal obligatorio) que no aplica en todos lados.", dimension: "Componentes y affordance", core: false, contextTags: ["Internacionalización", "Flujo transaccional"], evidenceTier: "media-alta", principle: "W3C i18n — direcciones", sourceUrl: "https://www.w3.org/International/quicktips/" },
  { statement: "Formatos de fecha, número y moneda deben adaptarse al locale de la persona usuaria, no asumir el formato de un solo país.", dimension: "Copy y microcopy", core: false, contextTags: ["Internacionalización"], evidenceTier: "media-alta", principle: "W3C i18n — formatos locales", sourceUrl: "https://www.w3.org/International/quicktips/" },
  { statement: "El selector de idioma debe ser persistente y descubrible, y cambiar de idioma no debería resetear el progreso de la persona usuaria en un flujo.", dimension: "Componentes y affordance", core: false, contextTags: ["Internacionalización"], evidenceTier: "media", principle: "W3C i18n — selector de idioma", sourceUrl: "https://www.w3.org/International/quicktips/" },

  // IA / Human-AI Interaction — https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/ y https://pair.withgoogle.com/guidebook/
  { statement: "Comunicá claramente qué puede hacer el sistema de IA — evitá que la persona usuaria descubra los límites por prueba y error.", dimension: "Claridad del propósito", core: false, contextTags: ["Feature con IA"], evidenceTier: "alta", principle: "Microsoft HAX — capacidad inicial", sourceUrl: "https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/" },
  { statement: "Comunicá qué tan bien puede hacerlo el sistema — mostrá el nivel de confianza/certeza cuando sea relevante para la decisión de la persona usuaria.", dimension: "Claridad del propósito", core: false, contextTags: ["Feature con IA"], evidenceTier: "alta", principle: "Microsoft HAX — confianza", sourceUrl: "https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/" },
  { statement: "Facilitá la corrección eficiente: editar o corregir un output de IA debe ser tan fácil como aceptarlo.", dimension: "Componentes y affordance", core: false, contextTags: ["Feature con IA"], evidenceTier: "alta", principle: "Microsoft HAX — corrección eficiente", sourceUrl: "https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/" },
  { statement: "Facilitá el descarte eficiente: ignorar o descartar una sugerencia de IA no debería requerir más esfuerzo que aceptarla.", dimension: "Componentes y affordance", core: false, contextTags: ["Feature con IA"], evidenceTier: "alta", principle: "Microsoft HAX — descarte eficiente", sourceUrl: "https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/" },
  { statement: "Cuando el sistema no esté seguro, que pregunte o acote el alcance en vez de adivinar con confianza aparente.", dimension: "Claridad del propósito", core: false, contextTags: ["Feature con IA"], evidenceTier: "alta", principle: "Microsoft HAX — acotar en la duda", sourceUrl: "https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/" },
  { statement: "Notificá a la persona usuaria cuando el comportamiento de una función de IA cambie de forma relevante, no lo actualices en silencio.", dimension: "Claridad del propósito", core: false, contextTags: ["Feature con IA"], evidenceTier: "alta", principle: "Microsoft HAX — notificar cambios", sourceUrl: "https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/" },
  { statement: "Dale a la persona usuaria control global sobre qué datos/comportamiento monitorea y sobre qué actúa el sistema de IA.", dimension: "Componentes y affordance", core: false, contextTags: ["Feature con IA"], evidenceTier: "media-alta", principle: "Google PAIR — control global", sourceUrl: "https://pair.withgoogle.com/guidebook/" },

  // Visualización de datos — Cleveland & McGill; Heer & Bostock
  { statement: "La posición en una escala común es la codificación visual más precisa para comparar valores — preferila sobre ángulo (torta) o área para comparaciones exactas.", dimension: "Jerarquía visual", core: false, contextTags: ["Dashboard / datos densos"], evidenceTier: "alta", principle: "Cleveland & McGill — percepción gráfica", sourceUrl: "https://www.jstor.org/stable/2288400" },
  { statement: "Evitá gráficos de torta con muchas categorías o valores cercanos entre sí — un gráfico de barras suele comunicar la comparación con más precisión.", dimension: "Jerarquía visual", core: false, contextTags: ["Dashboard / datos densos"], evidenceTier: "alta", principle: "Cleveland & McGill — percepción gráfica", sourceUrl: "https://www.jstor.org/stable/2288400" },
  { statement: "Evitá efectos 3D en gráficos de datos — distorsionan la percepción real de los valores.", dimension: "Jerarquía visual", core: false, contextTags: ["Dashboard / datos densos"], evidenceTier: "media-alta", principle: "Heer & Bostock — percepción gráfica crowdsourced", sourceUrl: "https://dl.acm.org/doi/10.1145/1753326.1753357" },
  { statement: "Los gráficos de barras deben empezar en cero — truncar el eje exagera visualmente la magnitud de la diferencia.", dimension: "Jerarquía visual", core: false, contextTags: ["Dashboard / datos densos"], evidenceTier: "alta", principle: "Cleveland & McGill — percepción gráfica", sourceUrl: "https://www.jstor.org/stable/2288400" },
  { statement: "No uses solo el color para distinguir series o categorías críticas — combinalo con un patrón o etiqueta directa para accesibilidad.", dimension: "Color y contraste", core: false, contextTags: ["Dashboard / datos densos"], evidenceTier: "media-alta", principle: "Buenas prácticas de data viz accesible", sourceUrl: "https://dl.acm.org/doi/10.1145/1753326.1753357" },
  { statement: "Para tendencias en el tiempo, un gráfico de líneas suele comunicar mejor la continuidad que uno de barras.", dimension: "Jerarquía visual", core: false, contextTags: ["Dashboard / datos densos"], evidenceTier: "media", principle: "Buenas prácticas de data viz", sourceUrl: "https://dl.acm.org/doi/10.1145/1753326.1753357" },

  // Estética / dirección de arte — VisAWI; Tractinsky; Lindgaard; Reinecke; Bylinskii
  { statement: "VisAWI — Simplicidad: reducí la complejidad visual innecesaria; cada elemento adicional debe justificar su lugar.", dimension: "Espaciado y alineación", core: false, contextTags: ["Marketing / landing", "Exploración / descubrimiento"], evidenceTier: "alta", principle: "VisAWI — Simplicidad", sourceUrl: "https://www.thielsch.org/download/VisAWI/VisAWI_Manual_EN.pdf" },
  { statement: "VisAWI — Artesanía/Craftsmanship: la atención al detalle visual (alineación, espaciado, remates) se percibe como calidad del producto.", dimension: "Espaciado y alineación", core: false, contextTags: ["Marketing / landing"], evidenceTier: "alta", principle: "VisAWI — Craftsmanship", sourceUrl: "https://www.thielsch.org/download/VisAWI/VisAWI_Manual_EN.pdf" },
  { statement: "La primera impresión estética se forma en milisegundos — priorizá que los primeros elementos visibles comuniquen calidad, no solo la interfaz completa.", dimension: "Espaciado y alineación", core: false, contextTags: ["Marketing / landing"], evidenceTier: "alta", principle: "Lindgaard et al. — primera impresión", sourceUrl: "https://www.tandfonline.com/doi/abs/10.1080/01449290500330448" },
  { statement: "Estética percibida y usabilidad percibida se correlacionan pero no son lo mismo — una interfaz linda no confirma que sea usable.", dimension: "Claridad del propósito", core: true, evidenceTier: "alta", principle: "Tractinsky et al. — belleza y usabilidad", sourceUrl: "https://academic.oup.com/iwc/article-abstract/13/2/127/898608" },
  { statement: "La saliencia visual debe alinearse con la prioridad real del contenido — el elemento más llamativo debería ser el más importante para la tarea, no el más grande porque sí.", dimension: "Jerarquía visual", core: true, evidenceTier: "alta", principle: "Bylinskii et al. — importancia visual", sourceUrl: "https://arxiv.org/abs/1708.02660" },
].map((c, i) => ({ id: `seed2-${String(i + 1).padStart(3, "0")}`, batch: "documentation-scaling-v1", component: null, contextTags: c.contextTags || [], core: c.core || false, ...c }));

// Tercer lote: resultado del workflow de curación (ver docs/research/CRITERIA-BACKLOG.md
// para el rubric completo y los candidatos que NO pasaron el corte de calidad).
// Cada registro lleva "qualityScore" visible (máx 12: observabilidad + evidencia +
// aplicabilidad mobile + accionabilidad). Corte de promoción: >=9/12.
const SEED_CRITERIA_BATCH3 = [
  // Más WCAG 2.2 — https://www.w3.org/TR/WCAG22/
  { statement: "3.2.4 Identificación Consistente: componentes con la misma función (ej. ícono de búsqueda) deben identificarse de forma consistente en toda la app.", dimension: "Consistencia y sistema de diseño", core: true, qualityScore: "12/12", evidenceTier: "alta", principle: "WCAG 2.2 — 3.2.4", sourceUrl: "https://www.w3.org/TR/WCAG22/#consistent-identification" },
  { statement: "3.3.3 Sugerencia ante Error: cuando se detecta un error de formato conocido, el mensaje debe sugerir cómo corregirlo, no solo señalar que existe.", dimension: "Copy y microcopy", core: true, qualityScore: "12/12", evidenceTier: "alta", principle: "WCAG 2.2 — 3.3.3", sourceUrl: "https://www.w3.org/TR/WCAG22/#error-suggestion" },
  { statement: "1.4.10 Reflow: el contenido debe reorganizarse sin scroll horizontal ni pérdida de información a un ancho equivalente a 320px.", dimension: "Espaciado y alineación", core: false, contextTags: ["Dashboard / datos densos"], qualityScore: "11/12", evidenceTier: "alta", principle: "WCAG 2.2 — 1.4.10", sourceUrl: "https://www.w3.org/TR/WCAG22/#reflow" },
  { statement: "3.3.4 Prevención de Errores (legal/financiero): en pasos con consecuencias legales o financieras, debe existir confirmación explícita, posibilidad de revisar o de revertir antes de enviar.", dimension: "Componentes y affordance", core: false, contextTags: ["Flujo transaccional"], qualityScore: "10/12", evidenceTier: "alta", principle: "WCAG 2.2 — 3.3.4", sourceUrl: "https://www.w3.org/TR/WCAG22/#error-prevention-legal-financial-data" },
  { statement: "3.2.3 Navegación Consistente: los mecanismos de navegación que se repiten entre pantallas deben aparecer en el mismo orden relativo.", dimension: "Consistencia y sistema de diseño", core: false, contextTags: ["Dashboard / datos densos"], qualityScore: "9/12", evidenceTier: "alta", principle: "WCAG 2.2 — 3.2.3", sourceUrl: "https://www.w3.org/TR/WCAG22/#consistent-navigation" },
  { statement: "2.2.1 Tiempo Ajustable: si existe un límite de tiempo (ej. sesión, oferta), la persona usuaria debe poder extenderlo o desactivarlo, salvo excepciones específicas.", dimension: "Componentes y affordance", core: false, contextTags: ["Flujo transaccional"], qualityScore: "9/12", evidenceTier: "alta", principle: "WCAG 2.2 — 2.2.1", sourceUrl: "https://www.w3.org/TR/WCAG22/#timing-adjustable" },
  { statement: "2.5.3 Nombre en la Etiqueta: el nombre accesible de un control debe incluir el texto visible de su etiqueta, para que comandos de voz funcionen.", dimension: "Accesibilidad", core: false, contextTags: ["Onboarding"], qualityScore: "9/12", evidenceTier: "alta", principle: "WCAG 2.2 — 2.5.3", sourceUrl: "https://www.w3.org/TR/WCAG22/#label-in-name" },

  // Nielsen — más descomposición atómica (siguiendo la guía del Design Judgment Handoff)
  { statement: "Visibilidad del estado del sistema: un elemento seleccionado (tab activo, ítem marcado) debe distinguirse visualmente de forma inequívoca del resto.", dimension: "Componentes y affordance", core: true, qualityScore: "12/12", evidenceTier: "media", principle: "Heurística de Nielsen #1 — estado activo", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Visibilidad del estado del sistema: una operación asíncrona (envío, sincronización) necesita una señal clara de cuándo terminó, no dejar la duda de si sigue en curso.", dimension: "Componentes y affordance", core: true, qualityScore: "11/12", evidenceTier: "media", principle: "Heurística de Nielsen #1 — finalización async", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Control y libertad del usuario: una acción destructiva debería poder deshacerse durante una ventana breve, no solo prevenirse con una confirmación previa.", dimension: "Componentes y affordance", core: false, contextTags: ["Flujo transaccional"], qualityScore: "10/12", evidenceTier: "media", principle: "Heurística de Nielsen #3 — deshacer", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Estándares: un componente disabled debe verse consistentemente distinto (no solo más tenue) del mismo componente en estado activo en toda la app.", dimension: "Consistencia y sistema de diseño", core: true, qualityScore: "10/12", evidenceTier: "media", principle: "Heurística de Nielsen #4 — estado disabled", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },

  // Dark patterns — expansión de la taxonomía completa de Mathur et al.
  { statement: "Nagging: no interrumpas repetidamente con un pedido (ej. calificar la app) que no es la acción que la persona usuaria vino a hacer.", dimension: "Claridad del propósito", core: false, contextTags: ["Onboarding", "Marketing / landing"], qualityScore: "10/12", evidenceTier: "alta", principle: "Dark patterns — nagging (Mathur et al.)", sourceUrl: "https://arxiv.org/abs/1907.07032" },
  { statement: "Preguntas trampa: la redacción de un toggle u opt-in/opt-out no debe estar formulada de forma confusa a propósito (doble negación, ambigüedad).", dimension: "Copy y microcopy", core: false, contextTags: ["Flujo transaccional", "Onboarding"], qualityScore: "11/12", evidenceTier: "alta", principle: "Dark patterns — trick questions", sourceUrl: "https://arxiv.org/abs/1907.07032" },
  { statement: "Roach motel: si algo es fácil de activar (suscripción, prueba gratuita), cancelarlo debe requerir un esfuerzo comparable, no una cantidad de pasos desproporcionada.", dimension: "Claridad del propósito", core: false, contextTags: ["Flujo transaccional"], qualityScore: "10/12", evidenceTier: "alta", principle: "Dark patterns — roach motel", sourceUrl: "https://arxiv.org/abs/1907.07032" },
  { statement: "Sneaking (agregado sigiloso): no agregues ítems, cargos o servicios adicionales a un carrito/pedido sin que la persona usuaria lo haya elegido explícitamente.", dimension: "Claridad del propósito", core: false, contextTags: ["Flujo transaccional"], qualityScore: "11/12", evidenceTier: "alta", principle: "Dark patterns — sneaking", sourceUrl: "https://arxiv.org/abs/1907.07032" },
  { statement: "Bait and switch: una acción no debe producir un resultado distinto al que su etiqueta/botón anuncia.", dimension: "Claridad del propósito", core: true, qualityScore: "11/12", evidenceTier: "alta", principle: "Dark patterns — bait and switch", sourceUrl: "https://arxiv.org/abs/1907.07032" },

  // Internacionalización — más allá de lo básico
  { statement: "Pluralización: el sistema de textos debe soportar reglas de plural específicas del idioma, no un binario singular/plural genérico (varios idiomas tienen 3+ formas).", dimension: "Copy y microcopy", core: false, contextTags: ["Internacionalización"], qualityScore: "9/12", evidenceTier: "media-alta", principle: "W3C i18n — pluralización", sourceUrl: "https://www.w3.org/International/quicktips/" },
  { statement: "Truncamiento de texto: evitar cortar texto a la mitad de una palabra o carácter compuesto — permitir reflow en vez de truncar agresivamente en scripts no latinos.", dimension: "Tipografía", core: false, contextTags: ["Internacionalización"], qualityScore: "9/12", evidenceTier: "media", principle: "W3C i18n — truncamiento", sourceUrl: "https://www.w3.org/International/quicktips/" },
  { statement: "Colores e íconos con significado cultural específico (ej. un color que en una cultura significa buena suerte y en otra duelo) deben validarse por mercado, no asumirse universales.", dimension: "Color y contraste", core: false, contextTags: ["Internacionalización"], qualityScore: "9/12", evidenceTier: "media", principle: "W3C i18n — significado cultural", sourceUrl: "https://www.w3.org/International/quicktips/" },

  // IA / Human-AI Interaction — más guidelines de HAX/PAIR
  { statement: "Considerá el contexto social/situacional antes de actuar — una función de IA no debería interrumpir en momentos de alta carga de atención de la persona usuaria.", dimension: "Claridad del propósito", core: false, contextTags: ["Feature con IA"], qualityScore: "9/12", evidenceTier: "alta", principle: "Microsoft HAX — timing contextual", sourceUrl: "https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/" },
  { statement: "Mitigá sesgos sociales conocidos en el output de IA — el sistema no debería reforzar estereotipos en ejemplos, sugerencias o resultados generados.", dimension: "Copy y microcopy", core: false, contextTags: ["Feature con IA"], qualityScore: "10/12", evidenceTier: "alta", principle: "Microsoft HAX — mitigar sesgos", sourceUrl: "https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/" },
  { statement: "Transmití las consecuencias de una acción sugerida por IA antes de que la persona usuaria la ejecute, especialmente si es difícil de revertir.", dimension: "Componentes y affordance", core: false, contextTags: ["Feature con IA"], qualityScore: "10/12", evidenceTier: "alta", principle: "Google PAIR — consecuencias", sourceUrl: "https://pair.withgoogle.com/guidebook/" },
  { statement: "Facilitá dar feedback granular sobre un resultado de IA (qué parte estuvo mal), no solo un pulgar arriba/abajo genérico.", dimension: "Componentes y affordance", core: false, contextTags: ["Feature con IA"], qualityScore: "9/12", evidenceTier: "media-alta", principle: "Google PAIR — feedback granular", sourceUrl: "https://pair.withgoogle.com/guidebook/" },

  // Visualización de datos — más allá de percepción básica
  { statement: "Etiquetá directamente las series de un gráfico cuando haya pocas categorías, en vez de depender solo de una leyenda separada que exige ida y vuelta visual.", dimension: "Copy y microcopy", core: false, contextTags: ["Dashboard / datos densos"], qualityScore: "10/12", evidenceTier: "media-alta", principle: "Buenas prácticas de data viz — etiquetado directo", sourceUrl: "https://dl.acm.org/doi/10.1145/1753326.1753357" },
  { statement: "Ordená los datos categóricos de forma significativa (por valor) en vez de un orden arbitrario, salvo que el objetivo sea búsqueda alfabética.", dimension: "Jerarquía visual", core: false, contextTags: ["Dashboard / datos densos"], qualityScore: "9/12", evidenceTier: "media", principle: "Buenas prácticas de data viz — ordenamiento", sourceUrl: "https://www.jstor.org/stable/2288400" },
  { statement: "No muestres precisión numérica que no sea perceptible ni útil a esa escala (ej. 3 decimales en un gráfico donde la diferencia no se distingue visualmente).", dimension: "Jerarquía visual", core: false, contextTags: ["Dashboard / datos densos"], qualityScore: "9/12", evidenceTier: "media", principle: "Buenas prácticas de data viz — precisión", sourceUrl: "https://www.jstor.org/stable/2288400" },

  // Estética — facetas VisAWI restantes + hallazgos de investigación
  { statement: "VisAWI — Diversidad: la variedad visual debe ser deliberada (jerarquía, énfasis), no ausencia total de repetición ni caos por falta de sistema.", dimension: "Jerarquía visual", core: false, contextTags: ["Marketing / landing"], qualityScore: "10/12", evidenceTier: "alta", principle: "VisAWI — Diversidad", sourceUrl: "https://www.thielsch.org/download/VisAWI/VisAWI_Manual_EN.pdf" },
  { statement: "VisAWI — Colorfulness: la cantidad de color debe calibrarse al contexto y la marca — ni monocromía sin motivo ni saturación excesiva sin propósito.", dimension: "Color y contraste", core: false, contextTags: ["Marketing / landing"], qualityScore: "9/12", evidenceTier: "alta", principle: "VisAWI — Colorfulness", sourceUrl: "https://www.thielsch.org/download/VisAWI/VisAWI_Manual_EN.pdf" },
  { statement: "La complejidad visual y la prototipicalidad (qué tan parecido es a lo esperado en su categoría) afectan juntas la primera impresión — layouts muy inusuales arriesgan confianza inicial, aunque luego funcionen bien.", dimension: "Jerarquía visual", core: false, contextTags: ["Marketing / landing", "Exploración / descubrimiento"], qualityScore: "9/12", evidenceTier: "alta", principle: "Tuch et al. — complejidad y prototipicalidad", sourceUrl: "https://research.google/pubs/the-role-of-visual-complexity-and-prototypicality-regarding-first-impression-of-websites-working-towards-understanding-aesthetic-judgments/" },
].map((c, i) => ({ id: `seed3-${String(i + 1).padStart(3, "0")}`, batch: "curation-workflow-v1", component: null, contextTags: c.contextTags || [], core: c.core || false, ...c }));

// Cuarto lote: ronda de curación sobre WCAG 2.2 nivel AAA (v1.10).
// ADVERTENCIA: esta ronda se hizo sin acceso de red en vivo a w3.org (bloqueado
// por política de egress del entorno) — los números/URLs vienen de conocimiento
// entrenado, no de una consulta verificada en esta sesión. Encuestados ~30
// criterios AAA completos; la mayoría puntuó bajo por depender de audio/video,
// timing o interacción de teclado (no observable desde una imagen estática) y
// quedaron documentados en CRITERIA-BACKLOG.md sin promoverse. Recomendado:
// spot-check manual de estas 7 entradas contra el texto oficial antes de
// confiar en ellas al 100%. AAA es explícitamente aspiracional, no un
// requisito universal según el propio W3C — por eso evidenceTier queda en
// media/media-alta, no "alta" como las reglas AA ya duras del batch2.
const SEED_CRITERIA_BATCH4 = [
  { statement: "Para texto o contenido especialmente crítico, considerá el contraste reforzado de WCAG AAA (7:1 en texto normal, 4.5:1 en texto grande) más allá del mínimo AA.", dimension: "Color y contraste", core: false, contextTags: [], qualityScore: "12/12", evidenceTier: "media-alta", principle: "WCAG 2.2 AAA — 1.4.6 Contrast (Enhanced)", sourceUrl: "https://www.w3.org/TR/WCAG22/#contrast-enhanced" },
  { statement: "En flujos con múltiples pasos o secciones, mostrá dónde está la persona usuaria dentro del conjunto — breadcrumb, tab activo remarcado, indicador de paso — no solo el contenido de la pantalla actual.", dimension: "Claridad del propósito", core: false, contextTags: ["Dashboard / datos densos"], qualityScore: "11/12", evidenceTier: "media-alta", principle: "WCAG 2.2 AAA — 2.4.8 Location", sourceUrl: "https://www.w3.org/TR/WCAG22/#location" },
  { statement: "El texto de un link o botón debe describir su destino o acción por sí solo, sin depender del texto que lo rodea — evitá 'click acá' o 'ver más' sin contexto propio.", dimension: "Copy y microcopy", core: true, contextTags: [], qualityScore: "11/12", evidenceTier: "media-alta", principle: "WCAG 2.2 AAA — 2.4.9 Link Purpose (Link Only)", sourceUrl: "https://www.w3.org/TR/WCAG22/#link-purpose-link-only" },
  { statement: "Los objetivos táctiles primarios deberían acercarse a 44×44px CSS cuando el layout lo permita, no quedarse solo en el mínimo de 24×24px de WCAG AA.", dimension: "Componentes y affordance", core: true, contextTags: [], qualityScore: "12/12", evidenceTier: "media-alta", principle: "WCAG 2.2 AAA — 2.5.5 Target Size (Enhanced)", sourceUrl: "https://www.w3.org/TR/WCAG22/#target-size-enhanced" },
  { statement: "Un campo o paso complejo debería tener ayuda contextual visible o accesible cerca (tooltip, texto de ayuda, link a más info), no solo un label.", dimension: "Copy y microcopy", core: false, contextTags: ["Flujo transaccional"], qualityScore: "9/12", evidenceTier: "media", principle: "WCAG 2.2 AAA — 3.3.5 Help", sourceUrl: "https://www.w3.org/TR/WCAG22/#help" },
  { statement: "Cualquier envío de formulario con datos importantes —no solo legal o financiero— debería permitir revisar, corregir o confirmar antes de enviarse en firme.", dimension: "Componentes y affordance", core: false, contextTags: ["Flujo transaccional"], qualityScore: "9/12", evidenceTier: "media", principle: "WCAG 2.2 AAA — 3.3.6 Error Prevention (All)", sourceUrl: "https://www.w3.org/TR/WCAG22/#error-prevention-all" },
  { statement: "Un flujo de autenticación no debería exigir resolver un puzzle cognitivo (recordar una contraseña compleja, transcribir un captcha visual) sin una alternativa que no dependa de memoria o resolución de problemas — biometría, passkey, gestor de contraseñas.", dimension: "Componentes y affordance", core: false, contextTags: ["Flujo transaccional", "Onboarding"], qualityScore: "11/12", evidenceTier: "media-alta", principle: "WCAG 2.2 AAA — 3.3.9 Accessible Authentication (Enhanced)", sourceUrl: "https://www.w3.org/TR/WCAG22/#accessible-authentication-enhanced" },
].map((c, i) => ({ id: `seed4-${String(i + 1).padStart(3, "0")}`, batch: "wcag-aaa-v1", component: null, contextTags: c.contextTags || [], core: c.core || false, ...c }));

// Grafo de criterios en conflicto (Balde 2, punto 5) — infraestructura + primera
// pasada manual, NO generado por embeddings todavía (ver punto 4, bloqueado por
// política de red en este entorno: api.voyageai.com no es alcanzable). Cada
// entrada documenta una tensión real entre dos criterios que un lector rápido
// podría leer como contradictorios si no entiende el límite de contexto entre
// ambos. No implica que uno esté "mal" — implica que el modelo debe elegir cuál
// aplica según el contexto real de la pantalla, no promediarlos ni ignorarlos.
// Todavía no tiene UI propia ni se usa en el pipeline de crítica — es la base de
// datos sobre la que construir eso próximo.
// Quinto lote: ronda de curación sobre el catálogo de reglas determinísticas de
// Impeccable (impeccable.style / github.com/pbakaus/impeccable, Apache 2.0) —
// commit f88b2837a7d7c3182e46307bbbb091a1ed547571, cli/engine/rules/checks.mjs.
// A DIFERENCIA de la ronda WCAG AAA, esta SÍ se verificó contra el código fuente
// real (se clonó el repo, se leyó cada umbral exacto) — no es de memoria.
// Filtro aplicado según pedido explícito de "que encaje": de las ~47 reglas
// encuestadas, se rechazaron las que son puro patrón "esto parece IA genérica"
// sin respaldo normativo (paleta violeta en headings, tile de ícono redondeado,
// glow oscuro, fondo crema, chip "eyebrow" sobre hero, etc.) — evidenceTier
// bajo, no se promovieron aunque puntuaran cerca del corte, para no tratar una
// preferencia estética del autor de Impeccable como si fuera un criterio
// normativo. Se promovieron solo las que tienen una razón real de legibilidad/
// usabilidad/renderizado detrás. Detalle completo (promovidas + rechazadas con
// puntaje) en CRITERIA-BACKLOG.md.
const SEED_CRITERIA_BATCH5 = [
  { statement: "Evitá texto en mayúsculas sostenidas en bloques de copy largos (>30 caracteres) — reduce la velocidad de lectura; reservalo para labels cortos o headings.", dimension: "Tipografía", core: true, contextTags: [], qualityScore: "10/12", evidenceTier: "media", principle: "Impeccable — all-caps-body", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L3436" },
  { statement: "Un contenedor con overflow oculto no debería cortar visualmente a un elemento posicionado que se sale de sus límites (badge, tooltip, dropdown parcialmente invisible).", dimension: "Componentes y affordance", core: false, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Impeccable — clipped-overflow-container", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L4638" },
  { statement: "El padding vertical y horizontal de un contenedor de texto debería escalar con el tamaño de fuente — como referencia, al menos ~0.5× el font-size en cada eje; menos que eso se lee como apretado.", dimension: "Espaciado y alineación", core: true, contextTags: [], qualityScore: "11/12", evidenceTier: "media", principle: "Impeccable — cramped-padding", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L3146" },
  { statement: "Evitá letter-spacing negativo extremo (más cerrado que -0.05em) en texto de lectura — daña la legibilidad más allá de un efecto tipográfico intencional en un título puntual.", dimension: "Tipografía", core: false, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Impeccable — extreme-negative-tracking", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L3459" },
  { statement: "Si una pantalla usa 3 o más tamaños de fuente, el mayor debería ser al menos 2× el menor — una escala tipográfica demasiado plana no comunica jerarquía real entre niveles.", dimension: "Jerarquía visual", core: false, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Impeccable — flat-type-hierarchy", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L4113" },
  { statement: "Si usás texto con gradiente (background-clip: text), verificá que cada segmento del gradiente mantenga contraste suficiente contra el fondo — el extremo más claro u oscuro del gradiente puede caer por debajo del mínimo legible.", dimension: "Color y contraste", core: false, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Impeccable — gradient-text", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L211" },
  { statement: "Texto gris (sin saturación de color) sobre un fondo saturado/de color suele perder contraste real aunque a simple vista parezca legible — medí el contraste efectivo, no lo asumas por la paleta.", dimension: "Color y contraste", core: true, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Impeccable — gray-on-color", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L168" },
  { statement: "Evitá texto justificado (text-align: justify) sin hyphenation activada — sin guionado automático genera 'ríos' de espacio en blanco irregulares entre palabras.", dimension: "Tipografía", core: false, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Impeccable — justified-text", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L3362" },
  { statement: "Limitá el largo de línea de párrafos de lectura a un rango legible (referencia: no más de ~75-80 caracteres por línea) — líneas más largas fuerzan al ojo a perder el renglón al saltar de línea.", dimension: "Tipografía", core: true, contextTags: [], qualityScore: "11/12", evidenceTier: "media-alta", principle: "Impeccable — line-length", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L3111" },
  { statement: "Marcadores numerados (01/02/03) sobre un conjunto de secciones solo tienen sentido si el orden es real y importa (un proceso, un ranking) — usarlos sobre contenido sin secuencia real es decoración que promete un orden que no existe.", dimension: "Claridad del propósito", core: false, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Impeccable — numbered-section-labels", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L2623" },
  { statement: "El contenido de texto no debería desbordar visualmente su contenedor (texto cortado, superpuesto, o que se sale del box) — es un defecto de renderizado observable, no una decisión de diseño.", dimension: "Componentes y affordance", core: false, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Impeccable — text-overflow", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L4757" },
  { statement: "El texto de un elemento interactivo o funcional (botón, label, badge, texto de UI) no debería caer por debajo de un piso de legibilidad mínimo — es más estricto que el texto de cuerpo general porque además hay que poder accionarlo con precisión.", dimension: "Accesibilidad", core: true, contextTags: [], qualityScore: "12/12", evidenceTier: "media-alta", principle: "Impeccable — undersized-ui-text", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L3427" },
  { statement: "El texto de cuerpo general no debería caer por debajo de un tamaño mínimo legible cómodamente sin zoom — chico para ahorrar espacio es una falsa economía si nadie puede leerlo sin esfuerzo.", dimension: "Accesibilidad", core: true, contextTags: [], qualityScore: "12/12", evidenceTier: "media-alta", principle: "Impeccable — tiny-text", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L3373" },
  { statement: "El interlineado (line-height) de párrafos largos (>50 caracteres) no debería bajar de 1.3× el tamaño de fuente — menos que eso comprime las líneas y dificulta seguir el renglón.", dimension: "Tipografía", core: true, contextTags: [], qualityScore: "11/12", evidenceTier: "media-alta", principle: "Impeccable — tight-leading", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L3353" },
  { statement: "Un bloque de texto de cuerpo no debería tocar el borde del viewport sin margen — especialmente crítico en mobile, donde el borde de pantalla es también el borde físico del dispositivo.", dimension: "Espaciado y alineación", core: false, contextTags: [], qualityScore: "10/12", evidenceTier: "media", principle: "Impeccable — body-text-viewport-edge", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L3344" },
  { statement: "Evitá letter-spacing positivo amplio (más de 0.05em) en texto de cuerpo sin mayúsculas — el tracking abierto ralentiza la lectura de párrafos normales; reservalo para labels cortos en mayúsculas.", dimension: "Tipografía", core: false, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Impeccable — wide-tracking", sourceUrl: "https://github.com/pbakaus/impeccable/blob/f88b2837a7d7c3182e46307bbbb091a1ed547571/cli/engine/rules/checks.mjs#L3445" },
].map((c, i) => ({ id: `seed5-${String(i + 1).padStart(3, "0")}`, batch: "impeccable-v1", component: null, contextTags: c.contextTags || [], core: c.core || false, ...c }));

// Sexto lote: ronda de curación sobre el libro "Land Your Dream Design Job"
// de Holloway (holloway.com/g/land-your-dream-design-job), específicamente
// las secciones sobre crítica de apps. A DIFERENCIA de Impeccable, esta
// fuente es guía de carrera para entrevistas de trabajo, no un corpus de
// reglas — la mayoría de su contenido son frameworks de PROCESO (Jobs to be
// Done, personas, segmentación por familiaridad, capas estética/funcional/
// estratégica) o consejos de conducta para la persona que hace la entrevista
// (dar contexto, mantenerse adaptable, evitar elogios sin sustento) — no son
// hallazgos atómicos verificables desde una imagen estática, así que quedan
// fuera de alcance por el mismo motivo que ISO 9241-210 (ver
// CRITERIA-BACKLOG.md). Acceso parcial: 3 de las 4 secciones están detrás de
// paywall más allá de la vista previa: no se pudo encuestar el "universo
// completo" en esas — documentado como limitación real, no como corte
// silencioso. De lo poco que sí era un hallazgo atómico observable, varios
// candidatos duplicaban WCAG 3.2.4 / Nielsen #1 y #4 ya presentes (ver
// backlog) — solo 2 pasaron el corte de 9/12 sin ser redundantes.
const SEED_CRITERIA_BATCH6 = [
  { statement: "Los filtros activos (pills/chips) no deberían repetir información que ya es evidente en otra parte de la misma pantalla (ej. un header que ya muestra el mismo dato) — la duplicación genera un modelo mental confuso sobre qué está realmente filtrado.", dimension: "Componentes y affordance", core: false, contextTags: ["Exploración / descubrimiento", "Dashboard / datos densos"], qualityScore: "10/12", evidenceTier: "media", principle: "Holloway — claridad de filtros contextuales", sourceUrl: "https://www.holloway.com/g/land-your-dream-design-job/sections/app-critique-in-action" },
  { statement: "El volumen de banners, notificaciones o promociones visibles en una pantalla no debería competir con la tarea principal de la persona usuaria ni sentirse invasivo — más presencia promocional no es necesariamente mejor para el engagement real.", dimension: "Claridad del propósito", core: false, contextTags: ["Marketing / landing", "Exploración / descubrimiento"], qualityScore: "9/12", evidenceTier: "media", principle: "Holloway — densidad de tácticas de crecimiento", sourceUrl: "https://www.holloway.com/g/land-your-dream-design-job/sections/app-critique-in-action" },
].map((c, i) => ({ id: `seed6-${String(i + 1).padStart(3, "0")}`, batch: "holloway-v1", component: null, contextTags: c.contextTags || [], core: c.core || false, ...c }));

// Séptimo lote: dos frentes. (1) Nueva dimensión "Patrones oscuros" —
// taxonomía de Harry Brignull (deceptive.design, ex darkpatterns.org, la
// fuente que originó el término en 2010) más el reporte de la FTC "Bringing
// Dark Patterns to Light" (2022), que documenta casos reales de aplicación
// regulatoria. Se acota a patrones OBSERVABLES desde una imagen estática
// (peso visual, jerarquía de copy, presencia/ausencia de etiquetas) — se
// excluyen los que solo se detectan con interacción real (ej. "nagging" por
// notificaciones repetidas a lo largo del tiempo, nunca visible en una sola
// captura; ver CRITERIA-BACKLOG.md). (2) Once criterios adicionales para
// dimensiones ya existentes, curados con el mismo corte de 9/12.
const SEED_CRITERIA_BATCH7 = [
  { statement: "Un enlace o botón para rechazar una oferta no debería estar redactado para generar culpa o vergüenza (ej. 'No, prefiero seguir pagando de más') — la única función de esa copy debería ser informar la consecuencia real de la elección, no manipular la emoción de quien decide.", dimension: "Patrones oscuros", core: false, contextTags: ["Marketing / convertir"], qualityScore: "10/12", evidenceTier: "alta", principle: "Brignull — confirmshaming", sourceUrl: "https://www.deceptive.design/types-of-deceptive-pattern" },
  { statement: "Un checkbox u opción preseleccionada que le agrega costo, suscripción o compartición de datos a la persona usuaria no debería tener menor contraste o tamaño que el resto de las opciones de la misma pantalla — esa asimetría visual dificulta notar que ya viene marcada.", dimension: "Patrones oscuros", core: false, contextTags: ["Marketing / convertir", "Tarea / transacción"], qualityScore: "11/12", evidenceTier: "alta", principle: "Brignull — interferencia visual / preselección", sourceUrl: "https://www.deceptive.design/types-of-deceptive-pattern" },
  { statement: "Un checkbox de opt-out no debería redactarse con doble negación (ej. 'No quiero dejar de no recibir novedades') — obliga a releer varias veces para saber qué estado real produce cada valor del checkbox.", dimension: "Patrones oscuros", core: false, contextTags: ["Marketing / convertir", "Alto riesgo"], qualityScore: "10/12", evidenceTier: "alta", principle: "Brignull — trick question", sourceUrl: "https://www.deceptive.design/types-of-deceptive-pattern" },
  { statement: "Un contenido patrocinado o publicitario insertado entre resultados o contenido orgánico debería llevar una etiqueta visible ('Publicidad', 'Patrocinado') con el mismo nivel de legibilidad que el resto del copy — sin esa etiqueta, se confunde con contenido editorial u orgánico real.", dimension: "Patrones oscuros", core: false, contextTags: ["Explorar / encontrar", "Marketing / convertir"], qualityScore: "9/12", evidenceTier: "media-alta", principle: "Brignull — publicidad disfrazada", sourceUrl: "https://www.deceptive.design/types-of-deceptive-pattern" },
  { statement: "En un modal o pantalla de cancelación/baja, el botón para continuar suscripto no debería tener significativamente más peso visual (tamaño, color de marca, posición) que el botón para efectivamente cancelar — esa asimetría empuja hacia la opción que conviene al negocio, no a la persona.", dimension: "Patrones oscuros", core: false, contextTags: ["Tarea / transacción", "Alto riesgo"], qualityScore: "10/12", evidenceTier: "alta", principle: "Brignull — roach motel (señal visual)", sourceUrl: "https://www.ftc.gov/business-guidance/blog/2022/09/bringing-dark-patterns-light-ftc-report" },
  { statement: "Si una acción convierte una prueba gratuita o un plan actual en un cargo recurrente, esa consecuencia (monto, fecha del primer cobro, cómo cancelar) debería estar visible en la misma pantalla de confirmación — no solo mencionada antes, en letra chica, o en un paso previo del flujo.", dimension: "Patrones oscuros", core: false, contextTags: ["Tarea / transacción", "Alto riesgo"], qualityScore: "9/12", evidenceTier: "alta", principle: "Brignull — forced continuity", sourceUrl: "https://www.ftc.gov/business-guidance/blog/2022/09/bringing-dark-patterns-light-ftc-report" },
  { statement: "Un temporizador de cuenta regresiva usado para presionar una decisión debería corresponder a un límite real y verificable (ej. cierre de un evento) — un contador que se reinicia al recargar la página o que no está atado a ninguna fecha real es presión artificial, no información útil.", dimension: "Patrones oscuros", core: false, contextTags: ["Marketing / convertir"], qualityScore: "9/12", evidenceTier: "media", principle: "Brignull — urgencia artificial (countdown)", sourceUrl: "https://www.deceptive.design/types-of-deceptive-pattern" },
  { statement: "Un contador de actividad social ('X personas viendo esto ahora', 'Y compraron en la última hora') debería tener alguna fuente o mecanismo verificable visible — un número sin ningún indicio de dónde sale es prueba social no verificable, no un dato real.", dimension: "Patrones oscuros", core: false, contextTags: ["Marketing / convertir"], qualityScore: "9/12", evidenceTier: "media", principle: "Brignull — prueba social fabricada", sourceUrl: "https://www.deceptive.design/types-of-deceptive-pattern" },
  { statement: "En una pantalla de configuración de privacidad, la opción más protectora de los datos de la persona no debería requerir más pasos, menor contraste o texto más pequeño que la opción más permisiva preseleccionada — el diseño no debería empujar hacia la opción que más datos recolecta.", dimension: "Patrones oscuros", core: false, contextTags: ["Administrar / configurar", "Alto riesgo"], qualityScore: "10/12", evidenceTier: "alta", principle: "Brignull — privacy Zuckering", sourceUrl: "https://www.deceptive.design/types-of-deceptive-pattern" },
  { statement: "En una lista de tarjetas o ítems de igual importancia semántica, el peso visual (tamaño, sombra, saturación) debería ser uniforme entre ellas — variarlo sin una razón funcional real (ej. destacar un plan recomendado con justificación de negocio explícita) sugiere una jerarquía de importancia que no existe.", dimension: "Jerarquía visual", core: false, contextTags: ["Explorar / encontrar", "Monitorear / analizar"], qualityScore: "9/12", evidenceTier: "media", principle: "Refactoring UI — peso visual consistente", sourceUrl: "https://www.refactoringui.com/" },
  { statement: "Una misma acción (ej. 'Guardar', 'Confirmar') no debería alternar entre botón relleno y outline en pantallas equivalentes de un mismo flujo — la variación sin motivo rompe la convención de que el botón relleno es siempre la acción primaria.", dimension: "Consistencia y sistema de diseño", core: false, contextTags: ["Crear / editar", "Tarea / transacción"], qualityScore: "9/12", evidenceTier: "media", principle: "Heurística de Nielsen #4 — consistencia y estándares", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "El label de un campo de formulario no debería bajar de 12px, incluso en pantallas de alta densidad — por debajo de ese umbral se compromete la legibilidad para la mayoría de las personas usuarias, sin importar la resolución del dispositivo.", dimension: "Tipografía", core: false, contextTags: ["Crear / editar", "Alta densidad"], qualityScore: "9/12", evidenceTier: "media", principle: "Butterick's Practical Typography — tamaño mínimo legible", sourceUrl: "https://practicaltypography.com/body-text.html" },
  { statement: "Un estado de error (borde, texto, ícono) no debería comunicarse solo con color rojo — necesita un ícono o texto redundante, porque una porción relevante de personas con daltonismo no distingue el rojo del estado neutral por color únicamente.", dimension: "Color y contraste", core: true, contextTags: ["Accesibilidad"], qualityScore: "11/12", evidenceTier: "alta", principle: "WCAG 2.2 — 1.4.1 Uso del color", sourceUrl: "https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html" },
  { statement: "Los elementos de un mismo grupo lógico (ej. label + input, ícono + texto de un mismo dato) deberían tener menor espacio entre sí que el espacio hacia el siguiente grupo — si la distancia es igual o mayor, la proximidad visual deja de comunicar cuáles elementos están realmente relacionados.", dimension: "Espaciado y alineación", core: false, contextTags: ["Crear / editar", "Alta densidad"], qualityScore: "10/12", evidenceTier: "media", principle: "Gestalt — ley de proximidad", sourceUrl: "https://www.nngroup.com/articles/gestalt-proximity/" },
  { statement: "Un ícono usado como botón sin texto ni tooltip visible debería tener alguna forma reconocible de affordance (contorno, fondo, sombra) — un ícono flotando sin ningún indicador de que es interactivo obliga a adivinar o probar por ensayo y error.", dimension: "Componentes y affordance", core: false, contextTags: ["Uso experto", "Alta densidad"], qualityScore: "9/12", evidenceTier: "media", principle: "Don Norman — affordances y signifiers", sourceUrl: "https://jnd.org/affordances_and_design/" },
  { statement: "El estado 'deshabilitado' de un botón debería verse claramente distinto de su estado activo (contraste, no solo una leve reducción de opacidad) — si la diferencia es sutil, no queda claro si la acción está disponible o si el botón simplemente no respondió al click.", dimension: "Componentes y affordance", core: false, contextTags: ["Tarea / transacción"], qualityScore: "9/12", evidenceTier: "media", principle: "Heurística de Nielsen #1 — visibilidad del estado del sistema", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "Un mensaje de error debería indicar qué campo específico falló y por qué ('El email no tiene un formato válido') — un mensaje genérico ('Ocurrió un error') sin ubicación ni causa obliga a la persona a adivinar qué corregir.", dimension: "Copy y microcopy", core: true, contextTags: ["Crear / editar", "Tarea / transacción"], qualityScore: "10/12", evidenceTier: "media-alta", principle: "Heurística de Nielsen #9 — ayudar a reconocer y recuperarse de errores", sourceUrl: "https://www.nngroup.com/articles/ten-usability-heuristics/" },
  { statement: "El texto de un botón que dispara una consecuencia no obvia por contexto (ej. eliminar, cancelar una suscripción, enviar un pago) debería usar un verbo específico ('Eliminar cuenta') en vez de uno genérico ('Aceptar', 'OK') — el genérico obliga a leer todo el modal para entender qué se está confirmando.", dimension: "Copy y microcopy", core: false, contextTags: ["Alto riesgo"], qualityScore: "9/12", evidenceTier: "media", principle: "Steve Krug — Don't Make Me Think", sourceUrl: "https://sensible.com/dont-make-me-think/" },
  { statement: "Un campo obligatorio debería indicarse con texto ('obligatorio') además de o en vez de solo un asterisco — el asterisco solo depende de que la persona ya conozca esa convención, lo que no es universal ni accesible para todos los lectores de pantalla sin contexto adicional.", dimension: "Accesibilidad", core: false, contextTags: ["Crear / editar", "Accesibilidad"], qualityScore: "9/12", evidenceTier: "media", principle: "GOV.UK Design System — estructura de formularios", sourceUrl: "https://www.gov.uk/service-manual/design/form-structure" },
  { statement: "La acción primaria de una pantalla (el siguiente paso esperado) debería distinguirse en un barrido visual rápido — si dos o más botones compiten con el mismo peso visual, no hay una acción primaria clara y la decisión se vuelve más lenta de lo necesario.", dimension: "Claridad del propósito", core: false, contextTags: ["Tarea / transacción"], qualityScore: "9/12", evidenceTier: "media", principle: "Ley de Hick — tiempo de decisión y número de opciones", sourceUrl: "https://lawsofux.com/hicks-law/" },
].map((c, i) => ({ id: `seed7-${String(i + 1).padStart(3, "0")}`, batch: "dark-patterns-v1", component: null, contextTags: c.contextTags || [], core: c.core || false, ...c }));

// Octavo lote: Vercel Design Guidelines (vercel.com/design/guidelines).
// Fuente nominalmente "web" (así lo pidió encuestar el equipo, con el
// pedido explícito de sumarla igual porque buena parte de sus reglas de
// diseño visual/tipografía/color son agnósticas de plataforma y aplican
// igual de bien a mobile/app nativo). Encuesta completa de la guía
// (secciones: Interactions, Animations, Layout, Content, Forms,
// Performance, Design, Copywriting) — la mayoría de sus ~130 reglas quedan
// FUERA de alcance porque son de implementación (CSS específico, JS,
// rendimiento, comportamiento de foco/teclado) o solo verificables con
// interacción real, no desde una imagen estática (ver
// CRITERIA-BACKLOG.md para el detalle de exclusiones). Las 11 que sí
// pasaron el corte son visualmente observables en una captura y aplican
// igual a interfaces mobile nativas, no solo web.
const SEED_CRITERIA_BATCH8 = [
  { statement: "El radio de esquina de un elemento hijo (ícono, imagen, botón interno) no debería ser mayor al radio de su contenedor padre, y lo ideal es que sean concéntricos — un radio de hijo más grande que el del padre genera un recorte visual incómodo en la esquina.", dimension: "Componentes y affordance", core: false, contextTags: ["Crear / editar"], qualityScore: "11/12", evidenceTier: "media-alta", principle: "Vercel Design Guidelines — radios anidados y concéntricos", sourceUrl: "https://vercel.com/design/guidelines" },
  { statement: "En capturas de app mobile, el contenido interactivo (botones, texto, controles) no debería quedar recortado o pegado contra el notch, la cámara frontal, o el indicador de home — necesita respetar el área segura del dispositivo.", dimension: "Espaciado y alineación", core: false, contextTags: ["Tarea / transacción"], qualityScore: "10/12", evidenceTier: "media-alta", principle: "Vercel Design Guidelines — safe areas", sourceUrl: "https://vercel.com/design/guidelines" },
  { statement: "Cuando un ícono acompaña a un texto (lockup), el peso visual de ambos debería estar balanceado — un ícono mucho más pesado o mucho más liviano que el texto que acompaña compite en vez de reforzar el mismo mensaje.", dimension: "Jerarquía visual", core: false, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Vercel Design Guidelines — balance de contraste en lockups", sourceUrl: "https://vercel.com/design/guidelines" },
  { statement: "Un elemento elevado (tarjeta, popover, modal) que combina borde y sombra debería usar un borde semitransparente en vez de un color sólido plano — el borde sólido sobre fondos variados pierde definición o se ve desalineado con la sombra.", dimension: "Componentes y affordance", core: false, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Vercel Design Guidelines — bordes nítidos", sourceUrl: "https://vercel.com/design/guidelines" },
  { statement: "Sobre un fondo de color no neutro, el borde, la sombra y el texto de un elemento deberían tener un matiz relacionado al del fondo — un borde o sombra gris neutro sobre un fondo de color saturado se ve desconectado, como pegado encima en vez de integrado.", dimension: "Color y contraste", core: false, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Vercel Design Guidelines — consistencia de matiz", sourceUrl: "https://vercel.com/design/guidelines" },
  { statement: "En un gráfico con múltiples series o categorías (barras, líneas, torta), la paleta de color no debería depender solo de tonos que una persona con daltonismo común (deuteranopia/protanopia, ej. rojo-verde) no pueda distinguir entre sí — necesita apoyo adicional de forma, patrón o etiqueta directa.", dimension: "Color y contraste", core: true, contextTags: ["Monitorear / analizar", "Alta densidad", "Accesibilidad"], qualityScore: "11/12", evidenceTier: "alta", principle: "Vercel Design Guidelines — paletas accesibles para gráficos", sourceUrl: "https://vercel.com/design/guidelines" },
  { statement: "Un párrafo o bloque de texto no debería terminar con una línea huérfana de una sola palabra corta, ni dejar la primera línea de un párrafo sola al final de una columna (viuda) — son detalles de composición tipográfica que afectan la lectura fluida.", dimension: "Tipografía", core: false, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Vercel Design Guidelines — viudas y huérfanas", sourceUrl: "https://vercel.com/design/guidelines" },
  { statement: "En una columna de números que se comparan entre sí (una tabla, una lista de montos), los dígitos deberían alinearse verticalmente por su ancho (números tabulares) — si cada dígito tiene un ancho distinto, la columna se ve dentada y dificulta comparar magnitudes de un vistazo.", dimension: "Componentes y affordance", core: false, contextTags: ["Monitorear / analizar", "Alta densidad"], qualityScore: "9/12", evidenceTier: "media", principle: "Vercel Design Guidelines — números tabulares", sourceUrl: "https://vercel.com/design/guidelines" },
  { statement: "Un estado de error o vacío no debería ser un callejón sin salida — necesita ofrecer una acción concreta hacia adelante (reintentar, volver, crear el primer elemento) o una vía de recuperación, no solo describir que algo salió mal o que no hay contenido.", dimension: "Claridad del propósito", core: true, contextTags: [], qualityScore: "10/12", evidenceTier: "media-alta", principle: "Vercel Design Guidelines — ningún estado es un callejón sin salida", sourceUrl: "https://vercel.com/design/guidelines" },
  { statement: "Los montos de dinero mostrados en una misma pantalla o tabla deberían usar consistentemente 0 o 2 decimales, nunca mezclar ambos formatos (ej. \"$10\" junto a \"$10.50\" en la misma columna) — la inconsistencia hace parecer que los valores no son directamente comparables.", dimension: "Copy y microcopy", core: false, contextTags: ["Tarea / transacción"], qualityScore: "10/12", evidenceTier: "media", principle: "Vercel Design Guidelines — formato de moneda consistente", sourceUrl: "https://vercel.com/design/guidelines" },
  { statement: "Un número y su unidad deberían separarse con un espacio (\"10 MB\", no \"10MB\") — pegarlos hace más lenta la lectura del valor, especialmente en unidades de dos o más caracteres.", dimension: "Tipografía", core: false, contextTags: [], qualityScore: "9/12", evidenceTier: "media", principle: "Vercel Design Guidelines — separación de números y unidades", sourceUrl: "https://vercel.com/design/guidelines" },
].map((c, i) => ({ id: `seed8-${String(i + 1).padStart(3, "0")}`, batch: "vercel-guidelines-v1", component: null, contextTags: c.contextTags || [], core: c.core || false, ...c }));

const CRITERION_CONFLICTS = [
  {
    a: "seed-002", // "No preselecciones respuestas... cuando el valor pueda sesgar"
    b: "seed-003", // "Un select de configuración puede tener valor predeterminado..."
    type: "limite-de-contexto",
    note: "No es una contradicción real: seed-002 aplica a preguntas/preferencias donde preseleccionar sesga la respuesta de la persona; seed-003 aplica a configuración donde el valor por defecto representa el estado real del sistema (no una opinión). El modelo debe distinguir 'pregunta' de 'estado del sistema' antes de aplicar cualquiera de las dos.",
  },
];

// Conteo esperado de criterios, calculado a partir de los arrays fuente (no
// depende de storage/red — siempre es correcto porque son literales del
// bundle). Se usa como guardrail: si lo que efectivamente se cargó de
// Supabase es sensiblemente menor a esto, es señal de que la base no se
// pudo leer bien — nunca debería pasar desapercibido.
const EXPECTED_CRITERIA_COUNT =
  SEED_CRITERIA.length + SEED_CRITERIA_BATCH2.length + SEED_CRITERIA_BATCH3.length +
  SEED_CRITERIA_BATCH4.length + SEED_CRITERIA_BATCH5.length + SEED_CRITERIA_BATCH6.length +
  SEED_CRITERIA_BATCH7.length + SEED_CRITERIA_BATCH8.length;
// a comments_source "human" o "both" únicamente (se excluyó "llm" — 1.058 de 11.344
// comentarios). Namespace separado (external-reference:) — nunca se mezcla con
// criterion: (documentación) ni con critique: (nuestro corpus propio aprobado).
// Esta es una MUESTRA representativa (151 de 2.972 pantallas elegibles, 547 de
// 10.286 comentarios elegibles) estratificada por design_quality_rating para
// cubrir pantallas de baja y alta calidad. El dataset filtrado completo se
// conserva en docs/research/uicrit-filtered-human-both.json.
// Fuente: https://github.com/google-research-datasets/uicrit — Licencia CC BY 4.0.
// 100% mobile (RICO) — cumple la regla de excluir web/desktop en esta categoría.
const EXTERNAL_REFERENCE_SEED_UICRIT = [
{
"ricoId": "26551",
"task": "Manage the settings for the G - chord",
"designQualityRating": "1",
"comments": [
{
"text": "The expected standard is that images used in the design should be clearly visible. \nIn the current design, the images are not visible.\nTo fix this, increase the size of the images.",
"source": "human"
}
]
},
{
"ricoId": "44024",
"task": "Use Current Location or Add a new Location.",
"designQualityRating": "2",
"comments": [
{
"text": "The expected standard is to have a back icon (arrow left) for easy navigation to the previous page.\nIn the current design, the design lacks a back icon (arrow left), hindering navigation to the previous page.\nTo fix this, implement a back icon (arrow left) in the top left corner for intuitive navigation back.",
"source": "human"
},
{
"text": "The expected standard is to have a clear typographic hierarchy, with larger font size for headers and smaller font size for body content.\nIn the current design,  the header and body content share the same font size, which detracts from visual appeal and hinders content hierarchy. \nTo fix this, adjust the font sizes to create a clear typographic hierarchy: increase the size of headers to visually distinguish them from body content while maintaining readability and aesthetic appeal.",
"source": "human"
},
{
"text": "The expected standard is to ensure elements are responsive, clearly clickable, and aligned within the layout for a professional appearance.\nIn the current design, elements lack responsiveness, clarity in clickability, and proper alignment, diminishing its professional standard.\nTo fix this, implement responsive design principles, enhance visual cues for clickability, and ensure proper alignment within the layout.",
"source": "human"
},
{
"text": "The expected standard is that each section—header, body, and footer—features unique background textures or colors, facilitating easy differentiation and improving overall visual appeal and usability.\nIn the current design, the lack of distinction between the header, body, and footer sections due to shared background textures detracts from visual clarity and makes it difficult for users to differentiate between the various parts of the layout.\nTo fix this, assign distinct background textures o...",
"source": "human"
},
{
"text": "The expected standard is to have a footer with menu icons/buttons to enhance functionality, navigation and user accessibility within the layout. \nIn the current design, the absence of a footer containing menu icons/buttons undermines navigation and user interaction, hindering overall usability and functionality.\nTo fix this, the design should incorporate a footer section featuring menu icons/buttons, facilitating seamless navigation and enhancing user interaction across the platform.",
"source": "human"
}
]
},
{
"ricoId": "28672",
"task": "Tap on the illustration to get video",
"designQualityRating": "2",
"comments": [
{
"text": "The expected standard is that The design should address the design brief and should appropriately communicate the content to its intended audience.\nIn the current design,\nthis design does not convey a clear message. The user needs to keep wondering whether the illustration is only for visual purposes or it is clickable. To fix this, Try consolidating your design to make a single unifying point.",
"source": "human"
},
{
"text": "The expected standard is that the design should address the design brief and should appropriately communicate the content to its intended audience. In the current design, the design does not address the design brief and does not appropriately communicate the content to its intended audience. To fix this, the design should be revised to address the design brief and appropriately communicate the content to its intended audience.",
"source": "both"
}
]
},
{
"ricoId": "54237",
"task": "Search  a bank from the list or click here for more related info.",
"designQualityRating": "2",
"comments": [
{
"text": "The expected standard is to have a back icon/button for easy navigation to the previous page.\nIn the current design,  design lacks a back button/icon, hindering navigation to the previous page.\nTo fix this, implement a back icon (arrow left) in the top left corner for intuitive navigation back.",
"source": "human"
},
{
"text": "The expected standard is to have a  text field for user input.\nIn the current design, the absence of a  text field impedes user interaction. \nTo fix this, integrating a text field is essential to enable users to input text.",
"source": "human"
},
{
"text": "The expected standard is to have a three-dot icon (ellipsis menu) incorporated into the layout for accessing hidden features and functionalities.\nIn the current design, the lack of a three-dot icon limits discoverability of hidden features and functionalities.\nTo fix this, add a well-placed three-dot icon for intuitive access to hidden features.",
"source": "human"
},
{
"text": "The expected standard is to have a readily identifiable search icon, typically a magnifying glass for efficient content discovery.\nIn the current design, layout lacks a search icon, hindering the user's ability to efficiently find specific information or content within the interface. \nTo fix this, Integrate a readily identifiable search icon into the layout.",
"source": "human"
},
{
"text": "The expected standard is that the design utilizes space efficiently, with minimal irrelevant blank space, for a visually appealing layout.\nIn the current design,  it suffers from excessive irrelevant blank space throughout the layout. This creates a sense of emptiness and reduces the visual appeal of the interface.\nTo fix this,  add visuals to eliminate dead space and enhance visual appeal.",
"source": "human"
}
]
},
{
"ricoId": "19267",
"task": "View options on tattoo cam",
"designQualityRating": "2",
"comments": [
{
"text": "The expected standard is that the colors used should help visualize the design clearly. \nIn the current design, the colors used are very bright and they do not look visually appealing or clean. The design looks messy due to the choice of colors. \nTo fix this, change the color scheme of the design.",
"source": "human"
},
{
"text": "The expected standard is that text should be easily readable. \nIn the current design, the font style and the graphic treatment given makes it difficult to read the label. \nTo fix this, change the font style and the graphic treatment.",
"source": "human"
}
]
},
{
"ricoId": "9107",
"task": "Search and explore trending music (mp3s) to download.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have high visual contrast between the search bar and the dark background for easy identification.\nIn the current design, the search bar blends into the dark background, hindering visibility. \nTo fix this, ensure high contrast between the search bar and background.",
"source": "human"
},
{
"text": "The expected standard is to have high color contrast between text and background for readability.\nIn the current design,  small size text on black background creates low contrast, making it difficult to read.\nTo fix this, increase the text size, change the text color to a high-contrast option (white preferred) or lighten the background.",
"source": "human"
},
{
"text": "The expected standard is to have consistency in element alignment across the layout.\nIn the current design, the \"my music\" button is misaligned with the other elements in the layout. This misalignment creates visual clutter and disrupts the user's flow of attention.\nTo fix this, align the \"my music\" button with the other elements for a cleaner look.",
"source": "human"
},
{
"text": "The expected standard is to have high contrast between text/button and background for clear visual distinction.\nIn the current design,  the \"Gaana music\" feature lacks contrast with the dark background, making it unclear whether it's a button or text.\nTo fix this,  increase the contrast between \"Gaana music\" and the background or use button design elements like borders and hover effects.",
"source": "human"
},
{
"text": "The expected standard is that the text should be easy to read and respect rules of typography. In the current design, the text is difficult to read because it is too small and there is not enough contrast between the text and the background. To fix this, the text should be increased in size and the contrast between the text and the background should be increased.",
"source": "both"
}
]
},
{
"ricoId": "6899",
"task": "Choose a theme, adjust( toggle) location and check location update frequency.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have  clear and complete elements presentation.\nIn the current design,   elements are too close to the bottom edge of the layout, causing it to be cut off. This creates an unprofessional and unfinished look, and users may miss important information.\nTo fix this, increase the padding between the bottom of the  elements  and the layout edge.",
"source": "human"
},
{
"text": "The expected standard is to have the Hamburger icon aligned with other elements and fully visible within the layout.\nIn the current design, the Hamburger icon is misaligned and partially cut off. \nTo fix this, Adjust padding or use Flex box/Grid to align and prevent cutoff.",
"source": "human"
},
{
"text": "The expected standard is to have high contrast between text and background for optimal readability.\nIn the current design,  low contrast between small size gray text and white background hinders readability.\nTo fix this, increase text size, use darker text or a colored background for better contrast.",
"source": "human"
},
{
"text": "The expected standard is to have a clear affordance in the design, indicating hidden functionality through a missing three-dot icon.\nIn the current design, design lacks a three-dot icon (ellipsis icon) in the layout. This icon is a common design element that signifies the presence of additional options or functionalities.\nTo fix this, include a three-dot icon to improve discoverability.",
"source": "human"
},
{
"text": "The expected standard is to have an element which establishes a match between the system and the real world for the user's understanding\n\n\n\nIn the current design,  Icon is not matching with other icons and users might have to assume the functionality of it.\n\n\nTo fix this, Try using a more universal icon or at least provide a label for the icon to make the user's understanding very simple.",
"source": "human"
}
]
},
{
"ricoId": "39384",
"task": "Check average consumption of fuel and driving cost.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is that text should be larger and have higher contrast for improved readability.\nIn the current design, text is small, gray, and low in contrast with the white background, leading to readability challenges.\nTo fix this, increase the font size and adjust the text color to ensure higher contrast against the background.",
"source": "human"
},
{
"text": "The expected standard is that each section, such as the header, body, and footer, should feature distinct visual elements, facilitating easy differentiation and enhancing overall user experience.\nIn the current design, the lack of differentiation between the header, body, and footer, all sharing the same color of background, fails to meet the expected standard of clear section distinction for optimal user experience.\nTo fix this, consider implementing contrasting backgrounds or subtle shading...",
"source": "human"
},
{
"text": "The expected standard is to have the ads section placed either above or below the main content, ensuring continuity and user flow. \nIn the current design, the ads section disrupts user flow by being positioned between the footer and body content,  improperly placed, causing visual inconsistency.\nTo fix this, relocate the ads section above or below the main content for smoother user flow, ensure proper alignment, within their designated space for visual consistency.",
"source": "human"
},
{
"text": "The expected standard is to have  noticeable clickable elements with clear contrast. \nIn the current design, elements on the screen appears non-clickable and seamlessly integrated with the background, giving users the impression that it is merely a static part of the display rather than an interactive component.\nTo fix this,  add a border or make a tile, so it doesn't blend in with the background.",
"source": "human"
},
{
"text": "The expected standard is to maintain a clean layout for easy comprehension.\nIn the current design, the cluttered layout impedes readability and comprehension.\nTo fix this,  prioritize essential content, utilize white space effectively, and establish clear visual hierarchy.",
"source": "human"
}
]
},
{
"ricoId": "36636",
"task": "Click on the 'Start' button to Track Labor Contraction time.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is that text should be sufficiently sized and contrasted with the background for optimal readability.\nIn the current design, the text is too small and lacks contrast with the background, which hinders readability.\nTo fix this, the text size should be increased, and the contrast between the text and background should be enhanced.",
"source": "human"
},
{
"text": "The expected standard is to have a noticeable clickable element with clear contrast. \nIn the current design, the element on the screen appears non-clickable and seamlessly integrated with the background, giving users the impression that it is merely a static part of the display rather than an interactive component.\nTo fix this,  add a border or make a tile, so it doesn't blend in with the background.",
"source": "human"
},
{
"text": "The expected standard is to ensure the back icon is visually emphasized for easy recognition and interaction, enhancing user navigation within the interface.\nIn the current design, the back icon lacks visual emphasis, leading to difficulty in its detection and interaction, hindering smooth navigation for users.\nTo fix this, the back icon needs to be redesigned with increased visual prominence, possibly through adjustments in size, color, or animation, ensuring easy recognition and interaction...",
"source": "human"
},
{
"text": "The expected standard is to have uniform icon sizes for consistency and professionalism.\nIn the current design, the '+' icon stands out due to its larger size compared to other icons, detracting from visual harmony and professionalism.\nTo fix this, resizing or redesigning the '+' icon to match the dimensions of other icons is necessary for achieving visual consistency and professionalism.",
"source": "human"
},
{
"text": "The expected standard is to have clear visual contrast between designated areas and the surrounding layout, ensuring elements are distinctly emphasized.\nIn the current design,  the lack of contrast between designated areas and the background hinders effective visual emphasis and grouping of elements.\nTo fix this, adjusting the background color or adding borders can create clear visual separation and emphasize the grouped elements effectively.",
"source": "human"
}
]
},
{
"ricoId": "22279",
"task": "Read Poker Room related info and click on add to favorites button.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have a back icon/button for easy navigation to the previous page.\nIn the current design, design lacks a back button/arrow left icon, hindering navigation to the previous page.\nTo fix this, implement a back icon (arrow left) in the top left corner for intuitive navigation back.",
"source": "human"
},
{
"text": "The expected standard is to have margins or padding around elements, ensuring they don't touch layout edges and content has breathing room.\nIn the current design, elements lack proper margins/padding and alignment causing them to crowd the edges and potentially overflow.\nTo fix this, introduce proper alignment, margins or padding around elements, creating breathing room and preventing overflow.",
"source": "human"
},
{
"text": "The expected standard is to have a three-dot icon (ellipsis menu) incorporated into the layout for accessing hidden features and functionalities.\nIn the current design, the lack of a three-dot icon limits discoverability of hidden features and functionalities.\nTo fix this,  add a well-placed three-dot icon for intuitive access to hidden features.",
"source": "human"
},
{
"text": "The expected standard is that the design is clean, uncluttered, and easy to navigate with ample space between elements for a visually appealing user experience.\nIn the current design, excessive elements and tight spacing create clutter, hindering user appeal.\nTo fix this,  prioritize key elements, utilize white space, and create a more spacious layout.",
"source": "human"
},
{
"text": "The expected standard is to have clear and consistent text readability.\nIn the current design, the text is too small, making it difficult to read.\nTo fix this, increase the font size of the text.",
"source": "human"
}
]
},
{
"ricoId": "54542",
"task": "Enter details and Click on 'Retrieve a booking' button.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to ensure clear visual contrast between elements, such as a button and its background, to enhance usability and user experience.\nIn the current design, the dark blue button lacks sufficient visual emphasis against the blue background, diminishing its usability and clarity of function.\nTo fix this, adjust the button's color, size, or adding visual cues like borders  to enhance its visibility and distinguishability from the background.",
"source": "human"
},
{
"text": "The expected standard is to have larger, high-contrast text for improved readability.\nIn the current design, text appears small and lacks contrast with the background, hindering readability.\nTo fix this,  increase text size and adjust color contrast between text and background.",
"source": "human"
},
{
"text": "The expected standard is to have all elements aligned seamlessly for optimal visual harmony.\nIn the current design, the 'button' is not aligned with the other elements, causing visual inconsistency.\nTo fix this, ensure proper alignment of the 'button' with other elements to maintain visual consistency.",
"source": "human"
},
{
"text": "The expected standard is to ensure clear differentiation between sections through contrasting background colors and subtle separator lines or borders.\nIn the current design, there is a lack of differentiation between sections due to their shared background color and absence of separator lines or borders.\nTo fix this, distinct background colors should be assigned to each section, and subtle separator lines or borders should be implemented between them for clarity and visual hierarchy.",
"source": "human"
},
{
"text": "The expected standard is to include all essential icons for seamless functionality and user interaction.\nIn the current design, an essential icon is missing, impeding smooth functionality and user experience.\nTo fix this, promptly incorporate the missing icon into the layout to enhance functionality and ensure a seamless user experience.",
"source": "human"
}
]
},
{
"ricoId": "51728",
"task": "Enter details to retry login or create an account to access My iTriage.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have high contrast and clear readability.\nIn the current design, design utilizes small gray text, lack of contrast between the gray text and the background color further reduces readability and creates accessibility concerns.\nTo fix this, Increase the font size of the gray text to improve legibility, Implement a color scheme with higher contrast between the gray text and the background.",
"source": "human"
},
{
"text": "The expected standard is to have a clear and consistent location for the three-dot icon within the layout.\nIn the current design, the three-dot icon, which typically signifies a menu or additional options, is positioned incorrectly within the layout. This misplaced icon could lead to confusion for users as it disrupts the expected visual hierarchy and might not be easily identifiable as an interactive element.\nTo fix this, the three-dot icon should be relocated to a more intuitive and consist...",
"source": "human"
},
{
"text": "The expected standard is that buttons have high contrast for clarity and user engagement.\nIn the current design, design uses gray buttons on a white background, which lacks visual appeal. This low contrast combination can make the buttons appear passive, reducing their click-through rate and overall user engagement.\nTo fix this, use high contrast colors or add borders/icons for clear, clickable buttons.",
"source": "human"
},
{
"text": "The expected standard is to have optimized white space for both efficiency and readability.\nIn the current design, design suffers from excessive and poorly utilized white space. This creates an inefficient layout that can be confusing for users and detract from the intended content.\nTo fix this, optimize white space for a clear and cohesive layout.",
"source": "human"
},
{
"text": "The expected standard is to have consistent element alignment and clear navigation controls.\nIn the current design, misaligned \"login\" text and missing back icon hurt usability.\nTo fix this, align \"login\" with other elements and add a back icon, ideally in the top left corner.",
"source": "human"
}
]
},
{
"ricoId": "40538",
"task": "Enter details to Join or sign in if already have an account.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have a clear and consistent back arrow icon in the layout to navigate back to the previous page.\nIn the current design,  lacking a back arrow icon hinders navigation back to the previous page.\nTo fix this,  implement a universally recognized back arrow icon for intuitive navigation.",
"source": "human"
},
{
"text": "The expected standard is to have a clear and informative title at the beginning of the layout for optimal usability.\nIn the current design, a critical element – the title – is missing from the layout. This omission hinders usability and information hierarchy.\nTo fix this, a prominent and designated space should be allocated for the title at the beginning of the layout.",
"source": "human"
},
{
"text": "The expected standard is that text is clearly readable with high contrast against the background.\nIn the current design, the text's small size and low contrast make it difficult to read.\nTo fix this, increase text size and improve contrast between text and background.",
"source": "human"
},
{
"text": "The expected standard is that labels, buttons, and active links clearly contrast the background for easy identification and a visually appealing design.\nIn the current design,  labels, buttons, and the active \"sign in\" link blend into the background due to low color contrast, making them difficult to find and unattractive.\nTo fix this, increase the color contrast between labels/buttons/link and the background or utilize visual cues like borders or opacity to make them stand out.",
"source": "human"
},
{
"text": "The expected standard is that the design should use a clear and easy-to-read font.\nIn the current design, the font is too small and difficult to read.\nTo fix this, the font size should be increased and a more legible font should be used.",
"source": "both"
}
]
},
{
"ricoId": "30217",
"task": "Manage, Like or Comment a blog post",
"designQualityRating": "3",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is to have visually distinct header & body sections with contrasting backgrounds and emphasized icons/text through color.\nIn the current design, the lack of contrast between header and body backgrounds creates a flat look, and similar colors for icons and text make them blend in, reducing visual hierarchy.\nTo fix this,  use contrasting background colors and emphasize icons/text with different colors for a visually distinct header and improved hierarchy.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is to have margins or padding around buttons, ensuring they don't touch layout edges and content has breathing room.\n\nIn the current design, buttons lack proper margins/padding, causing them to crowd the edges\nTo fix this, introduce margins or padding around buttons.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is to have high contrast between text and background for optimal readability.\nIn the current design, light text and background color create low contrast, hindering readability.\nTo fix this, increase text weight or choose a contrasting background color for better readability.",
"source": "human"
},
{
"text": "LLM Comment 4\nThe expected standard is that the text should be readable and easy to understand. In the current design, the text is small and difficult to read, and the colors are too similar to each other, making it difficult to distinguish between the text and the background. To fix this, the text should be increased in size and the colors should be changed to provide more contrast.",
"source": "both"
}
]
},
{
"ricoId": "58314",
"task": "Listen and explore different music sounds.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have high contrast and clear readability for all text elements within the design.\nIn the current design, the gray text suffers from low contrast and small size, hindering readability.\nTo fix this,  increase text size and contrast for better readability.",
"source": "human"
},
{
"text": "The expected standard is to have consistent alignment and a clear visual hierarchy.\nIn the current design,  elements lack alignment and a clear hierarchy, making it confusing to navigate.\nTo fix this, implement consistent alignment and a visual hierarchy.",
"source": "human"
},
{
"text": "The expected standard is to have a clear hierarchy and minimal clutter in the design to improve focus and user experience.\nIn the current design, design suffers from information overload. There are too many elements crammed into the layout, making it visually cluttered and overwhelming for the user. \nTo fix this, prioritize key elements and utilize white space for a clean and focused design.",
"source": "human"
},
{
"text": "The expected standard is to have clear visual distinction & hierarchy.\nIn the current design, elements lack visual contrast and a clear hierarchy, making it difficult to distinguish importance.\nTo fix this,  implement contrasting elements and a clear visual hierarchy to guide the user's eye.",
"source": "human"
},
{
"text": "The expected standard is to have balanced and visually dynamic layouts that guide the viewer's eye.\nIn the current design, design suffers from a lack of visual balance and flow. The elements appear to be positioned haphazardly, leading to a static and un engaging composition.\nTo fix this, prioritize elements and arrange them for balance and flow.",
"source": "human"
}
]
},
{
"ricoId": "23441",
"task": "Search, filter and read posts.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have clear and readable text.\nIn the current design, the text is too small, making it difficult to read.\nTo fix this, Increase font size or adjust spacing for better readability.",
"source": "human"
},
{
"text": "The expected standard is to have a clear and consistent back arrow icon in the layout to navigate back to the previous page.\nIn the current design,  lacking a back arrow icon hinders navigation back to the previous page.\nTo fix this,  implement a universally recognized back arrow icon for intuitive navigation.",
"source": "human"
},
{
"text": "The expected standard is to have high contrast between icons and the background for clear visibility.\nIn the current design, the icons lack visual emphasis on the gray background. This low contrast makes them difficult to see and hinders their usability.\nTo fix this, darken the icons or lighten the background to create a clear contrast.",
"source": "human"
},
{
"text": "The expected standard is to have a three-dot icon (ellipsis) incorporated into the layout for accessing hidden features and functionalities.\nIn the current design, the lack of a three-dot icon limits discoverability of hidden features and functionalities.\nTo fix this, add a well-placed three-dot icon for intuitive access to hidden features.",
"source": "human"
},
{
"text": "The expected standard is to have a clear hierarchy & ample white space in the current design to fix clutter.\nIn the current design,  design suffers from information overload. There are too many elements crammed together, creating a cluttered and congested look. \nTo fix this, prioritize elements and use white space.",
"source": "human"
}
]
},
{
"ricoId": "41433",
"task": "Enter details and click on the Next button to signup or log in Instead.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have a noticeable clickable element with clear contrast. \nIn the current design, the element on the screen appears non-clickable and seamlessly integrated with the background, giving users the impression that it is merely a static part of the display rather than an interactive component.\nTo fix this,  add a border or make a tile, so it doesn't blend in with the background.",
"source": "human"
},
{
"text": "The expected standard is to have a clear visual distinction between buttons and the background for optimal user experience.\nIn the current design, the button and the background share the same black color. While the white text within the button remains readable, the lack of visual contrast between the button and the background makes it difficult to distinguish the button as an interactive element. \nTo fix this, use a contrasting button color  to clearly differentiate the button from the black ...",
"source": "human"
},
{
"text": "The expected standard is to have a visually appealing background that complements the content and enhances the user experience.\nIn the current design,  current design suffers from an unappealing background color/texture. This can detract from the overall aesthetic and user experience.\nTo fix this, implement a more visually appealing background, Choose a color that complements the foreground elements, Implement a subtle gradient that transitions between two colors and Utilize a subtle texture ...",
"source": "human"
},
{
"text": "The expected standard is to have high contrast between text and background for optimal readability.\nIn the current design, the small, gray font on black background creates low contrast, hindering readability.\nTo fix this,  increase font size and use a high-contrast color (like white) for the text.",
"source": "human"
},
{
"text": "The expected standard is to have consistent element alignment and optimized white space.\nIn the current design, design suffers from misaligned elements and excessive empty space in the layout. This creates a visually unappealing layout.\nTo fix this, ensure consistent element alignment and optimize white space for a clean layout.",
"source": "human"
}
]
},
{
"ricoId": "40527",
"task": "Search Word \"fibertigibet\" meaning using English dictionary or re-enter the correct word to find meaning.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is that the design utilizes space efficiently, with minimal irrelevant blank space, for a visually appealing layout.\nIn the current design,  it suffers from excessive irrelevant blank space throughout the layout. This creates a sense of emptiness and reduces the visual appeal of the interface.\nTo fix this,  restructure content or add visuals to eliminate dead space and enhance visual appeal.",
"source": "human"
},
{
"text": "The expected standard is to have clear alignment & strategic use of white space for a clean, uncluttered design.\nIn the current design, design suffers from misalignment of elements, creating a congested, misplaced, and cluttered appearance. White space, which is crucial for visual hierarchy and readability, is not utilized effectively.\nTo fix this, align elements using a grid or baseline,  use  white space properly for better readability, and reorganize for a clear hierarchy.",
"source": "human"
},
{
"text": "The expected standard is to have  noticeable clickable elements with clear contrast. \nIn the current design, elements on the screen appears non-clickable and seamlessly integrated with the background, giving users the impression that it is merely a static part of the display rather than an interactive component.\nTo fix this,  add a border or make a tile, so it doesn't blend in with the background.",
"source": "human"
},
{
"text": "The expected standard is to have complete and accessible information displayed clearly within the current design.\nIn the current design, design suffers from truncation, where text is cut off before it's fully displayed. This leads to incomplete information, which can be frustrating and confusing for users.\nTo fix this,  expand space or employ techniques like tooltips.",
"source": "human"
},
{
"text": "The expected standard is to have high contrast between text and background for optimal readability.\nIn the current design, the small, gray text on a dark background creates low contrast, hindering readability.\nTo fix this, increase text contrast by using a lighter text color or a lighter background shade.",
"source": "human"
}
]
},
{
"ricoId": "3087",
"task": "Search the place or login to your account.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is that the design utilizes space efficiently, with minimal irrelevant blank space, for a visually appealing layout.\nIn the current design,  it suffers from excessive irrelevant blank space throughout the layout. This creates a sense of emptiness and reduces the visual appeal of the interface.\nTo fix this,  restructure content or add visuals to eliminate dead space and enhance visual appeal.",
"source": "human"
},
{
"text": "The expected standard is to have high visual emphasis on the search bar.\nIn the current design, the search bar lacks visual contrast hindering user discovery.\nTo fix this, increase the search bar's visual contrast to aid user discovery.",
"source": "human"
},
{
"text": "The expected standard is to have high contrast between text and background for readability.\nIn the current design, small size gray text on white background creates low contrast, making it difficult to read.\nTo fix this, increase text size, use high-contrast colors: dark text on a light background or light text on a dark background for better readability.",
"source": "human"
},
{
"text": "The expected standard is to have visually distinct background colors for different sections to improve  readability and user experience.\nIn the current design, design utilizes a uniform background color for all sections (header, body, and footer). This uniformity creates a visually monotonous experience.\nTo fix this, use contrasting background colors for header, body, and footer to enhance visual separation and user experience.",
"source": "human"
},
{
"text": "The expected standard is to have a back icon/button for easy navigation to the previous page.\nIn the current design, design lacks a back button, hindering navigation to the previous page.\nTo fix this, implement a back icon (arrow left) in the top left corner for intuitive navigation back.",
"source": "human"
}
]
},
{
"ricoId": "30683",
"task": "Select a Wallpaper from the list.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have visual consistency across elements (size, shape, color) for a clean and organized design.\nIn the current design, design suffers from a lack of visual cohesion. The elements vary in size, shape, and color, creating a cluttered and disorganized appearance. This inconsistency distracts the viewer from the intended message and makes the design appear unprofessional.\nTo fix this,  implement a design system for consistent size, shape, and color.",
"source": "human"
},
{
"text": "The expected standard is for the design to have distinct sections (header, body, footer) achieved through contrasting visuals like color or dividers, and clear organization using white space or typography.\nIn the current design, design utilizes a shared dark background for the header, body, and footer sections. This creates a lack of visual hierarchy, making it difficult for users to differentiate between the sections.\nTo fix this, use contrasting colors for sections, or add subtle dividers l...",
"source": "human"
},
{
"text": "The expected standard is to have clear and complete elements presentation.\nIn the current design,   elements are too close to the bottom edge of the layout, causing it to be cut off. This creates an unprofessional and unfinished look, and users may miss important information.\nTo fix this, increase the padding between the bottom of the  elements  and the layout edge.",
"source": "human"
},
{
"text": "The expected standard is to have a three-dot icon (ellipsis menu) incorporated into the layout for accessing hidden features and functionalities.\nIn the current design, the lack of a three-dot icon limits discoverability of hidden features and functionalities.\nTo fix this, add a well-placed three-dot icon for intuitive access to hidden features.",
"source": "human"
},
{
"text": "The expected standard is to have clear selection elements (radio buttons) with previews for choosing wallpapers.\nIn the current design, design lacks a clear and intuitive way for users to select a specific wallpaper. The absence of radio buttons, select option, or icons dedicated to wallpaper selection creates confusion and hinders user experience.\nTo fix this, implement radio buttons with previews for selecting wallpapers.",
"source": "human"
}
]
},
{
"ricoId": "65691",
"task": "Use current location or Change to new location.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have a noticeable clickable element with clear contrast. \nIn the current design, the element on the screen appears non-clickable and seamlessly integrated with the background, giving users the impression that it is merely a static part of the display rather than an interactive component.\nTo fix this,  add a border or make a tile, so it doesn't blend in with the background.",
"source": "human"
},
{
"text": "The expected standard is to have a fully functional footer menu with all icons present, optimizing usability and features. \nIn the current design, the absence of footer menu icons hampers functionalities and features, falling short of expected standards.\nTo fix this, promptly integrate the missing icons into the footer menu to align with expected standards, enhancing usability and functionality.",
"source": "human"
},
{
"text": "The expected standard is to have clear differentiation between header, body, and footer sections with distinct background colors for each, enhancing visual clarity and user experience.\nIn the current design,  the lack of differentiation between header, body, and footer sections due to shared background colors leads to user confusion and diminishes visual appeal.\nTo fix this, implementing distinct background colors for the header, body, and footer sections will enhance visual clarity and impro...",
"source": "human"
},
{
"text": "The expected standard is to ensure clickable elements are visually distinct and accompanied by clear select buttons/icons for ease of interaction.\nIn the current design, clickable elements lack visual distinction and select buttons/icons are absent, hindering intuitive interaction.\nTo fix this, enhance visual contrast for clickable elements and introduce clear select buttons/icons to improve usability and interaction clarity.",
"source": "human"
},
{
"text": "The expected standard is to ensure buttons stand out from the background, enhancing usability and user experience.\nIn the current design, the buttons lack visual emphasis against the background due to blending colors, potentially hindering user interaction and experience.\nTo fix this, adjust the button colors to provide better contrast with the background or add subtle visual cues like shadows to enhance button visibility and usability.",
"source": "human"
}
]
},
{
"ricoId": "35569",
"task": "Check out the various store items.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have margins or padding around elements, ensuring they don't touch layout edges and content has breathing room.\nIn the current design, elements lack proper margins/padding and alignment causing them to crowd the edges and potentially overflow.\nTo fix this, introduce proper alignment, margins or padding around elements, creating breathing room and preventing overflow.",
"source": "human"
},
{
"text": "The expected standard is that the layout includes both 'search' and 'add to cart' icons to facilitate seamless functionality and user interaction.\nIn the current design, the absence of 'search' and 'add to cart' icons undermines functionality and user experience.\nTo fix this, incorporate  'search' and 'add to cart' icons in the layout, enhancing functionality and user engagement.",
"source": "human"
},
{
"text": "The expected standard is to have a back icon (arrow left) for easy navigation to the previous page.\nIn the current design, the design lacks a back icon (arrow left), hindering navigation to the previous page.\nTo fix this, implement a back icon (arrow left) in the top left corner for intuitive navigation back.",
"source": "human"
},
{
"text": "The expected standard is to have a clear, readable font with appropriate size and spacing.\nIn the current design, design suffers from the issue of small text, making it difficult for users to read comfortably.\nTo fix this, increase the font size and adjust spacing to meet the expected standard for readability.",
"source": "human"
},
{
"text": "The expected standard is to have  noticeable clickable elements with clear contrast. \nIn the current design, elements on the screen appears non-clickable and seamlessly integrated with the background, giving users the impression that it is merely a static part of the display rather than an interactive component.\nTo fix this,  add a border or make a tile, so it doesn't blend in with the background.",
"source": "human"
}
]
},
{
"ricoId": "54160",
"task": "Watch VER TV online and read some related information.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have a back icon (arrow left) for easy navigation to the previous page.\nIn the current design, the design lacks a back icon (arrow left), hindering navigation to the previous page.\nTo fix this, implement a back icon (arrow left) in the top left corner for intuitive navigation back.",
"source": "human"
},
{
"text": "The expected standard is to have a clear visual contrast between the URL address field and TV screen background also it should be easy to navigate.\nIn the current design, the URL address field and TV screen share a uniform black background, causing difficulty in distinguishing between them and resulting in user confusion, difficult to navigate easily.\nTo fix this,  introducing visual differentiation between the URL address field and TV screen backgrounds, such as using contrasting colors or a...",
"source": "human"
},
{
"text": "The expected standard is to have clear, legible text with high contrast, an organized layout with proper alignment, and distinct elements that do not overlap. \nIn the current design, text is small and lacks contrast, leading to readability issues. The layout appears cluttered due to misaligned elements and overlapping content.\nTo fix this, increase text size and contrast for better readability. Rearrange elements to ensure proper alignment and spacing, and adjust positioning to prevent overlap.",
"source": "human"
},
{
"text": "The expected standard is to ensure clear visual emphasis on icons and URL address text fields against the dark black background.\nIn the current design, icons and URL address text fields lack visual prominence against the dark black background, resulting in poor responsiveness. \nTo fix this, enhance the contrast of icons and URL address text fields against the dark background, applying subtle highlights to draw attention, and optimizing their size and positioning for improved visibility and re...",
"source": "human"
},
{
"text": "The expected standard is to have a noticeable clickable element with clear contrast. \nIn the current design, the element 'menu' on the screen appears non-clickable and seamlessly integrated with the background, giving users the impression that it is merely a static part of the display rather than an interactive component.\nTo fix this,  add a border or make a tile, so it doesn't blend in with the background.",
"source": "human"
}
]
},
{
"ricoId": "70172",
"task": "Check number of likes or Click on 'Play Match now' button.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have a back icon (arrow left) for easy navigation to the previous page.\nIn the current design, the design lacks a back icon (arrow left), hindering navigation to the previous page.\nTo fix this, implement a back icon (arrow left) in the top left corner for intuitive navigation back.",
"source": "human"
},
{
"text": "The expected standard is to have a noticeable clickable element with clear contrast. \nIn the current design, the element 'CREDITS' on the screen appears non-clickable and seamlessly integrated with the background, giving users the impression that it is merely a static part of the display rather than an interactive component.\nTo fix this,  add a border or make a tile, so it doesn't blend in with the background.",
"source": "human"
},
{
"text": "The expected standard is to have higher contrast between gray text/icons and the background, ensuring readability. \nIn the current design, gray text and icons lack visual emphasis due to low contrast with the background, hindering readability.\nTo fix this, adjust the contrast between gray text/icons and the background, or introduce accent colors for better visual emphasis and readability.",
"source": "human"
},
{
"text": "The expected standard is to have clear visual separation between 'Likes' and 'Glances' options for improved user clarity and experience.\nIn the current design, the 'Likes' and 'Glances' options lack visual separation from the background, creating a perception that they blend into the white background. This is primarily due to the absence of a separator border between the options.\nTo fix this, a clear separator border or distinct visual cue should be added between the 'Likes' and 'Glances' opt...",
"source": "human"
},
{
"text": "The expected standard is to have a complete set of essential icons within the layout for seamless functionality.\nIn the current design, the absence of a crucial icon hampers functionality, falling short of the expected standard.\nTo fix this, promptly incorporate the missing icon into the layout to align with expected standards and enhance user experience.",
"source": "human"
}
]
},
{
"ricoId": "71747",
"task": "Choose option to check for Psychiatric help on Prognosis.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have  noticeable clickable elements with clear contrast. \nIn the current design, elements on the screen appears non-clickable and seamlessly integrated with the background, giving users the impression that it is merely a static part of the display rather than an interactive component.\nTo fix this,  add a border or make a tile, so it doesn't blend in with the background.",
"source": "human"
},
{
"text": "The expected standard is that text should be clearly readable and  understandable.\nIn the current design, the text is difficult to read due to its small size.\nTo fix this, increase font size and ensure good contrast for readability.",
"source": "human"
},
{
"text": "The expected standard is that the design utilizes space efficiently, with minimal irrelevant blank space, for a visually appealing layout.\nIn the current design,  it suffers from irrelevant blank space throughout the layout. This creates a sense of emptiness and reduces the visual appeal of the interface.\nTo fix this,  restructure content or add visuals to eliminate dead space and enhance visual appeal.",
"source": "human"
},
{
"text": "The expected standard is to have a noticeable clickable element with clear contrast. \nIn the current design, the element  \"envelop/mail icon\" on the screen appears non-clickable and seamlessly integrated with the background, giving users the impression that it is merely a static part of the display rather than an interactive component.\nTo fix this,  add a border or make a tile, so it doesn't blend in with the background.",
"source": "human"
},
{
"text": "The expected standard is to have clear navigation, smooth flow, and intuitive visual cues for users to interact seamlessly.\nIn the current design, confusing navigation and missing affordances (icons/buttons) disrupt user flow, hindering intuitive interaction.\nTo fix this, implement a clear navigation system with intuitive icons/buttons for a smooth user experience.",
"source": "human"
}
]
},
{
"ricoId": "30809",
"task": "Select from available options for mobile location tracker map",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is The design should address the design brief and should appropriately communicate the content to its intended audience.\nIn the current design,  This design does not convey a clear message.\nTo fix this, Try consolidating your design to make a single unifying point.",
"source": "human"
}
]
},
{
"ricoId": "35542",
"task": "Select from the library exercises",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is that the heading should be prominently visible. \nIn the current design, the font size of heading is smaller than the other labels on the page.\nTo fix this, decrease the size of the other labels and increase the size of the heading.",
"source": "human"
},
{
"text": "The expected standard is the design should appropriately communicate the content to its intended audience.\nIn the current design, the title is not self explanatory. \nTo fix this, add an appropriate title.",
"source": "human"
},
{
"text": "The expected standard is that the design should portray user control and freedom. \nIn the current design, there is no control for the user to exit this app or to understand what to expect when he clicks on these labels? (will there be image guide or videos?)\nTo fix this, add a task bar, add a self explanatory title and a sentence that explains  what to expect when the labels are tapped.",
"source": "human"
}
]
},
{
"ricoId": "25713",
"task": "Enter your details and check the rent availability.",
"designQualityRating": "3",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is to have high visual emphasis & clear readability.\nIn the current design, the gray text has small font size and low contrast, making it hard to read.\nTo fix this,  increase the font size and choose a bolder font for better readability.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that the design ensures:\nDistinct separation between all text elements.\nIn the current design, Text elements overlap, creating clutter.\nTo fix this, Increase spacing or adjust text size.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is that the labels are clear and unique.\nIn the current design, \"your name\" is used both as a label and placeholder, creating redundancy.\nTo fix this, update the design by replacing the repetitive instances of 'your name' with diverse placeholders.",
"source": "human"
},
{
"text": "LLM Comment 4\nThe expected standard is to have high visual emphasis & clear readability.\nIn the current design, the gray label text like \"your name\" , \"xxx@email.com\" and so on have a small font size and low contrast, making it hard to read.\nTo fix this,  increase the font size and choose a bolder font for better readability.",
"source": "human"
},
{
"text": "LLM Comment 5\nThe expected standard is to have high visual contrast between text/icons and background for optimal readability and accessibility.\nIn the current design, low contrast between text/icons and the background hinders readability. \nTo fix this,  increase the contrast between text/icons and the background for better readability.",
"source": "human"
}
]
},
{
"ricoId": "49144",
"task": "Search and view the Alerts Configuration.",
"designQualityRating": "3",
"comments": [
{
"text": "The expected standard is to have an element fully visible within layout boundaries, avoiding cut-off content.\nIn the current design, the element hugs the edge too closely, causing them to be cut off.\nTo fix this, increase padding or adjust element dimensions to ensure everything fits comfortably within the layout.",
"source": "human"
},
{
"text": "The expected standard is to have complete and informative elements that clearly communicate their importance and value to users\nIn the current design, incomplete elements hinder user understanding of their importance.\nTo fix this, ensure elements are complete & prioritized to convey their importance & function.",
"source": "human"
},
{
"text": "The expected standard is that the design utilizes space efficiently, with minimal irrelevant blank space, for a visually appealing layout.\nIn the current design,  it suffers from excessive irrelevant blank space throughout the layout. This creates a sense of emptiness and reduces the visual appeal of the interface.\nTo fix this,  restructure content or add visuals to eliminate dead space and enhance visual appeal.",
"source": "human"
},
{
"text": "The expected standard is to have responsive elements that adapt to different screen sizes, not static elements fixed within the layout.\nIn the current design, the element lacks responsiveness, appearing static and fixed within the layout.\nTo fix this, implement responsive design.",
"source": "human"
},
{
"text": "The expected standard is to have intuitive alert creation, deletion, editing, and detailed view functionalities within the current design.\nIn the current design, alert management is crippled by the lack of creation, deletion, editing, and view functionalities.\nTo fix this,  implement a robust alert system with creation, deletion, editing, and detailed view capabilities.",
"source": "human"
}
]
},
{
"ricoId": "288",
"task": "Click on start/ open draft to proceed",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is that important buttons should be clearly distinguished in the design. \nIn the current design,\nall the buttons have been given the same color. These two buttons are \"call to action\" buttons but have similar graphic treatment. To fix this, change the color of these buttons.",
"source": "human"
}
]
},
{
"ricoId": "28",
"task": "Enter details to sign in or click on activate mobile banking/Need help signing in.",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is to have high contrast, clear text size for optimal readability.\nIn the current design, small gray text lacks contrast and visual emphasis, hindering readability.\nTo fix this,  increase text size and use high-contrast color.",
"source": "human"
},
{
"text": "The expected standard is to have consistent elements alignment across the layout to ensure a visually balanced and professional design.\nIn the current design, elements appears misaligned with the others, creating an uneven layout.\nTo fix this, use grids or adjust margins to achieve consistent elements alignment.",
"source": "human"
},
{
"text": "The expected standard is to have a clear and consistent back arrow icon in the layout to navigate back to the previous page.\nIn the current design,  lacking a back arrow icon hinders navigation back to the previous page.\nTo fix this,  implement a universally recognized back arrow icon for intuitive navigation.",
"source": "human"
},
{
"text": "The expected standard is to have a clear hierarchy and efficient use of space.\nIn the current design, the  elements including the logo, name, and icons in a single row creates an unappealing visual experience.\nTo fix this, Use stacking or side-by-side placement for logo and name, then arrange icons in a separate row or grid for better organization.",
"source": "human"
},
{
"text": "The expected standard is that the design should match the importance of content to its visual prominence.\nIn the current design,  the text field for entering the username or card number and the text field for entering the password. However, these elements are not visually prominent. \nTo fix this,  the text field for entering the username or card number and the text field for entering the password should be made more visually prominent. They could be made larger, or they could be a different c...",
"source": "both"
}
]
},
{
"ricoId": "59248",
"task": "Read New Jersey newspaper.",
"designQualityRating": "4",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that design should use as few elements as possible to achieve its goals.\nIn the current design, it does not look like a newspaper instead it is looking like an advertisement.\nTo fix this, few elements can be removed or the look should be changed.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is to make the most important information visually dominant.\nIn the current design, the download button is visually prominent.\nTo fix this, it should be given visual prominence.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is to make the most important information visually dominant.\nIn the current design, the Menu button is not visually prominent.\nTo fix this, it should given some visual prominence.",
"source": "human"
},
{
"text": "LLM Comment 4\nThe expected standard is that design should maintain a visually pleasing balance between elements, including buttons. \nIn the current design, the share buttons are too close.\nTo fix this, we can increase the spacing between buttons.",
"source": "human"
},
{
"text": "LLM Comment 5\nThe expected standard is that design should address the design brief and should appropriately communicate the content to its intended audience.\nIn the current design, we are unable to find the use of the button/ image.\nTo fix this, it should be labelled.",
"source": "human"
}
]
},
{
"ricoId": "13294",
"task": "Manage settings for chart and ticker",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is that, prominent buttons should be easily visible. \nIn the current design, the button is merged into the background. The colors are similar. \nTo fix this, change the color of the button so that it is clearly visible.",
"source": "human"
},
{
"text": "The expected standard is that, all the elements should have a consistent visual language.\nIn the current design,  this button doesn't match with the language of the page. \nTo fix this, change the color of this button.",
"source": "human"
}
]
},
{
"ricoId": "60086",
"task": "Manage Health cards",
"designQualityRating": "4",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is Visually legible. The selection of visual features helps to make the text legible.  \n \nIn the current design,there is an pin symbol which is differing with the others toggle icons\nTo fix this, use similar icon as used in other sections",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is Visually legible. The selection of visual features helps to make the text legible.  \nIn the current design, there is padding which looks unbalanced\nTo fix this,decrease unneccesary padding to look visually appealing",
"source": "human"
}
]
},
{
"ricoId": "35391",
"task": "Click on 'Start Now' or 'Skip'  button to get notification updates.",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is to have a back icon (arrow left) for easy navigation to the previous page.\nIn the current design, the design lacks a back icon (arrow left), hindering navigation to the previous page.\nTo fix this, implement a back icon (arrow left) in the top left corner for intuitive navigation back.",
"source": "human"
},
{
"text": "The expected standard is to have distinct visual differentiation between header, body, and footer sections to enhance user clarity and navigation. \nIn the current design, the lack of visual distinction between header, body, and footer sections hinders user comprehension and navigation. \nTo fix this, adjust the design by introducing contrasting colors or dividers between the header, body, and footer sections to enhance clarity and ease of navigation for users.",
"source": "human"
},
{
"text": "The expected standard is to have  noticeable clickable elements with clear contrast. \nIn the current design, elements on the screen appears non-clickable and seamlessly integrated with the background, giving users the impression that it is merely a static part of the display rather than an interactive component.\nTo fix this,  add a border or make a tile, so it doesn't blend in with the background.",
"source": "human"
},
{
"text": "The expected standard is to have a clear contrast between text and background for better readability.\nIn the current design, design suffers from a significant readability issue due to insufficient contrast between the text and the background. \nTo fix this, adjust the text and background colors to achieve a clearer contrast for better readability.",
"source": "human"
},
{
"text": "The expected standard is that the text should be easy to read and understand. \nIn the current design, the text is difficult to read because  there is not enough contrast between the text and the background. \nTo fix this, enhance the contrast or use a darker color for the text.",
"source": "both"
}
]
},
{
"ricoId": "17718",
"task": "Set destination by searching",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is to use elements that are easy to understand. \nIn the current design,\nthese elements are not understood at first glance. Users would think - what is 25 max? To fix this, add elements that are easily understood.",
"source": "human"
},
{
"text": "The expected standard is that all elements should be clearly visible. \nIn the current design, the label \"Oak St\" is overlapping another elements on the map behind it. \nTo fix this, try to not overlap any elements by changing the position of the label \"Oak St\". Place it at the top.",
"source": "human"
}
]
},
{
"ricoId": "16155",
"task": "Check the Weather hourly and wind speed of New York.",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is for text to have high contrast with the background for optimal readability.\nIn the current design,  the use of a black background with gray text creates a low-contrast scenario. This makes it difficult to read the information on the screen. \nTo fix this, Swap black background for light & use dark text, or keep a dark background but use light colored text for better readability.",
"source": "human"
},
{
"text": "The expected standard is to have clean, organized layouts with prioritized content and clear visual hierarchy. \nIn the current design, design suffers from clutter due to excessive content, improper element arrangement, misalignment, and elements touching the edges. This creates a visually unappealing and overwhelming user experience.\nTo fix this, prioritize content, utilize white space, and establish a grid for a clean look.",
"source": "human"
},
{
"text": "The expected standard is to have a clear visual hierarchy and differentiation between sections.\nIn the current design, design utilizes a uniform black background for the header, body, and bottom sections, creating a lack of visual hierarchy. This makes it difficult for users to differentiate between content areas, leading to a flat and unappealing appearance.\nTo fix this, introduce visual contrast: use color variations, textures, or dividers to differentiate sections.",
"source": "human"
},
{
"text": "The expected standard is that the design should be visually appealing and easy to use. In the current design, the use of a black background with gray text makes it difficult to read the information on the screen. To fix this, the designer should use a lighter background color or a darker text color.",
"source": "both"
}
]
},
{
"ricoId": "56234",
"task": "View the items in trash",
"designQualityRating": "4",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that nothing should be placed on the page arbitrarily or too close to each other.\nIn the current design, These elements (arrow, the text trash, email icon) are not aligned in any organized way. There is no spacing between these elements. \nTo fix this, give proper spacing between elements.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is The design should match the importance of content to its visual prominence. There should be correct contrast between the background and the text color.\nIn the current design, the background color is too bright that makes the text non - readable.\nTo fix this, change the background color.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is the icon should appropriately communicate the content to its intended audience. The icons should have enough side margin.\nIn the current design, the icon does not convey its function. The icon is too close to the edge of the design. It shows no relation to the heading. \nTo fix this, add an appropriate icon that conveys a meaning. Re-align the icon and add padding to the left side of it.",
"source": "human"
},
{
"text": "LLM Comment 4\nThe expected standard is that the text should be readable. In the current design, the text is too small and difficult to read. To fix this, the text should be increased in size and made easier to read.",
"source": "human"
},
{
"text": "LLM Comment 5\nThe expected standard is Elements that occupy similar positions in the information hierarchy should be given similar graphic treatment. \nIn the current design, all the icons are given different graphic treatments. They are of unequal size and the white color does not have enough contrast with the background color.\nTo fix this, apply similar graphic treatment to the icons and make their sizes equal.",
"source": "human"
}
]
},
{
"ricoId": "59248",
"task": "Download or share the article \"the ultimate guide to NJ Winter Sports\"",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is that design should use elements that are absolutely needed. \nIn the current design, the elements are placed arbitrarily on the page. None of them actually guide the user for an action. \nTo fix this, re-arrange the elements into a non cluttered design.",
"source": "human"
},
{
"text": "The expected standard is that the design should be simple and easy to understand. In the current design, the design is not simple and easy to understand, making it difficult for the user to find the information they are looking for. To fix this, the design should be simplified and made easier to understand.",
"source": "both"
},
{
"text": "The expected standard is that the design should be appropriate for the target audience. In the current design, the design is not appropriate for the target audience, making it difficult for the user to find the information they are looking for. To fix this, the design should be made more appropriate for the target audience.",
"source": "both"
}
]
},
{
"ricoId": "46173",
"task": "Search player name using projections",
"designQualityRating": "4",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is The text’s visual treatment and formatting should should make it easy to read and respect rules of typography.\n\n\nIn the current design, the lineup here doesnt make sense \nTo fix this,remove the lineup button from the top right corner",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is Every element should have some connection to another element on the page. Nothing should be placed on the page arbitrarily.\n\nIn the current design, the icons and the text are not aligned properly horizontally and vertically\nTo fix this, the text and  icons are to be aligned properly",
"source": "human"
}
]
},
{
"ricoId": "46663",
"task": "proceed with the options of last 50 rounds All courses",
"designQualityRating": "4",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is Every element should have some connection to another element on the page. Nothing should be placed on the page arbitrarily.\n\n\nIn the current design, the text here is for upgrade which looks not appealing \nTo fix this,it must be a button to upgrade, which helps the user to select and upgrade",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is Every element should have some connection to another element on the page. Nothing should be placed on the page arbitrarily.\n\n\nIn the current design, the add is overlapping the text ,making difficult  to read the text\nTo fix this, the add must be smaller inorder to read the text",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is Every element should have some connection to another element on the page. Nothing should be placed on the page arbitrarily.\n\n\nIn the current design, the share button is inappropriate not understandable why there is share icon ,what to share is questionable\nTo fix this, remove the share icon or add info what to share",
"source": "human"
}
]
},
{
"ricoId": "65128",
"task": "Set Timer for Fighting Rounds.",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is to have high contrast and a visually appealing background that complements the design's overall aesthetic.\nIn the current design, the black background lacks visual appeal.\nTo fix this, consider a lighter background or a textured black option to improve contrast and visual interest.",
"source": "human"
},
{
"text": "The expected standard is to have a clear hierarchy and efficient use of space for buttons.\nIn the current design, buttons appear cluttered due to close spacing and large size. \nTo fix this, adjust button size and spacing to create a clear hierarchy and improve user experience.",
"source": "human"
},
{
"text": "The expected standard is to have clear separation between ads and main content for a visually balanced and user-friendly experience.\nIn the current design, close proximity of ads to main content creates a cluttered look.  \nTo fix this,  increase separation between ads and main content for a cleaner layout.",
"source": "human"
},
{
"text": "The expected standard is to have high visual contrast between interactive elements and the background.\nIn the current design, the black drop down button blends into the background, hindering its recognition.\nTo fix this, use a contrasting color or add a border to the black drop down button for better visibility.",
"source": "human"
}
]
},
{
"ricoId": "40266",
"task": "Log in into IBM verse",
"designQualityRating": "4",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is every element should have some connection to another element on the page. Nothing should be placed on the page arbitrarily.\n\nIn the current design, the header is towards left \nTo fix this,the header IBM Verse must be at the center for the design to be visually appealing",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is Every element should have some connection to another element on the page. Nothing should be placed on the page arbitrarily.\n\nIn the current design, there is difference in the color of text lines\nTo fix this, one line is blue and others are grey in color",
"source": "human"
}
]
},
{
"ricoId": "70728",
"task": "Search and review the filtered Jobs.",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is to have the 'search' icon included in the layout for enhanced functionality and user experience.\nIn the current design, the absence of the 'search' icon compromises functionality and user convenience, falling short of expected standards.\nTo fix this, promptly reintegrate the 'search' icon into the layout to enhance usability and meet the expected standard.",
"source": "human"
},
{
"text": "The expected standard is to have menu icons included in the layout for improved functionality and user engagement.\nIn the current design,  the absence of menu icons undermines functionality and user interaction.\nTo fix this, integrate menu icons into the layout to enhance navigation and user engagement.",
"source": "human"
},
{
"text": "The expected standard is that the design utilizes space efficiently, with minimal irrelevant blank space, for a visually appealing layout.\nIn the current design,  it suffers from excessive irrelevant blank space throughout the layout. This creates a sense of emptiness and reduces the visual appeal of the interface.\nTo fix this,  restructure content or add visuals to eliminate dead space and enhance visual appeal.",
"source": "human"
},
{
"text": "The expected standard is that the screen should have some content. In the current design, the screen is empty and has no content. To fix this, the screen should be populated with content. This can be done by adding a list of job search results to the screen.",
"source": "both"
}
]
},
{
"ricoId": "20234",
"task": "Connect to Twitter account or import settings to proceed",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is to utilize the space available for design. \nIn the current design,\nthere is a lot of space wastage. To fix this, move the buttons below,  upwards.",
"source": "human"
}
]
},
{
"ricoId": "56085",
"task": "Check Games status  and Explore the other available Options.",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is to have visually emphasized elements that are integrated with the layout content, text and icons should be easy to read and understand.\nIn the current design, elements lack visual emphasis and appear disconnected from the layout content, texts are not properly readable due to color contrast.\nTo fix this, create a visual hierarchy and improve element alignment to integrate them seamlessly with the layout and also enhance the color contrast for better readability.",
"source": "human"
},
{
"text": "The expected standard is to have margins or padding around elements, ensuring they don't touch layout edges and content has breathing room.\nIn the current design, elements lack proper margins/padding, causing them to crowd the edges and potentially overflow.\nTo fix this, introduce margins or padding around elements, creating breathing room and preventing overflow.",
"source": "human"
},
{
"text": "The expected standard is that the design should be visually appealing,  easy to read and understand.\nIn the current design, the font is  difficult to read due to color contrast.\nTo fix this,  enhance the color contrast for better readability.",
"source": "both"
}
]
},
{
"ricoId": "37451",
"task": "Copy contacts to be safe.",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is to have high contrast between text and background for optimal readability.\nIn the current design, gray text on a white background creates low contrast, making it difficult to read.\nTo fix this,  increase the contrast between the text and background by either darkening the text or lightening the background.",
"source": "human"
},
{
"text": "The expected standard is to have clear labels on buttons to signify their function.\nIn the current design, the button lacks clear visual cues or labels that communicate its purpose and importance.\nTo fix this, add a clear label to the button, highlighting its purpose.",
"source": "human"
},
{
"text": "The expected standard is that the design utilizes space efficiently, with minimal irrelevant blank space, for a visually appealing layout.\nIn the current design,  it suffers from excessive irrelevant blank space throughout the layout. This creates a sense of emptiness and reduces the visual appeal of the interface.\nTo fix this,  restructure content or add visuals to eliminate dead space and enhance visual appeal.",
"source": "human"
},
{
"text": "The expected standard is to have clear, well-aligned images that effectively communicate their importance.\nIn the current design,  the image is unclear, misaligned, and doesn't communicate its purpose effectively.\nTo fix this, use a high-resolution, aligned image and explain its importance with a caption or highlight key details.",
"source": "human"
},
{
"text": "The expected standard is that the design should be visually appealing and easy to read. \nIn the current design, the gray text is difficult to read on the white background.\nTo fix this, the designer should use a better color scheme and contrast.",
"source": "both"
}
]
},
{
"ricoId": "12808",
"task": "Tap on the play button to play",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is that all the elements should clearly state their purpose/ function. \nIn the current design,\nthe function of this element is not clear. Is it a clickable element? Or is it only an illustration? This is unclear. To fix this, use illustrations in a theme which won't confuse the user. The illustration of the record (disk) is not at all matching with this element (in white). If this is a clickable element, then replace it with something familiar to the user.",
"source": "human"
},
{
"text": "The expected standard is that all the elements used should be clearly visible. \nIn the current design,\nthe image in the background is not visible. To fix this, use a solid background color.",
"source": "human"
}
]
},
{
"ricoId": "11519",
"task": "Choose your location",
"designQualityRating": "4",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is The text’s visual treatment and formatting should should make it easy to read and respect rules of typography.\n\nIn the current design, the cancel button must be of different color to get highlighted\nTo fix this,use a dark color background for cancel button",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is The text’s visual treatment and formatting should should make it easy to read and respect rules of typography.\n\nIn the current design, the font style is not visually appealing\nTo fix this,font style must be bold for better reading",
"source": "human"
},
{
"text": "LLM Comment 3\n\nThe expected standard is that the text should be easy to read and respect rules of typography. In the current design, the text is difficult to read because the font is too small . To fix this, the font size should be increased",
"source": "both"
}
]
},
{
"ricoId": "30306",
"task": "Search menu items and place a order at Helmand palace",
"designQualityRating": "4",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is  The text’s visual treatment and the elements must be placed in an organized way to make the design visually prominent\nIn the current design,search bar is in the center which looks awkward due to its position\nTo fix this, place the search bar at the top position which helps to use search option in a well organized way",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is The design needs to fulfill the original goals (the design brief) and deliver the message in a way that the user understands easily\nIn the current design,suggestions and full menu is included in  menu list which doesn't make any sense \nTo fix this,remove the full menu and suggestions options from the menu list as the list must have the options of the food items to select",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is The design needs to fulfill the goals of the design  layout\nIn the current design,the purpose of the delivery and pickup doesn't seems to be understandable\nTo fix this,use the text that gives proper content for the user to make easy to understand",
"source": "both"
}
]
},
{
"ricoId": "41144",
"task": "Proceed with the side menu bar options",
"designQualityRating": "4",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is The design should use elements  to achieve its goals. Each visual element should contribute to the overall message\nIn the current design,there is no header ,Without a header, it's difficult to understand the purpose and content of the design\nTo fix this,use a appropriate header which significantly improve the design's clarity and understanding.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that a design’s controls follow real-world conventions and correspond to desired outcomes,  easier for users to learn and remember how the interface works. .\nIn the current design, icon is inappropriate and  makes it difficult for users to remember and navigate settings,\nTo fix this,add helpful icon next to the text , to make them clearer.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is design should address the design brief and should appropriately communicate the content with user\nIn the current design,the icon and text doesn't communicate and represent each other making it difficult for the user to understand the purpose of the icon and text\nTo fix this,use a proper icon that visually represent the text and help the user to understand and create a balanced design",
"source": "both"
}
]
},
{
"ricoId": "69899",
"task": "Health Reminders checklist",
"designQualityRating": "4",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is the text’s visual treatment and formatting should should make it easy to read and respect rules of typography.\n\nIn the current design,the text colors on the screen should be calm and go well together, and the words should be clear and easy to see, even for people who don't see very well.\nTo fix this,use a color that is easily visible and can be read",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is The text’s visual treatment and formatting should should make it easy to read and respect rules of typography.\n\nIn the current design, the font size is smaller in order to read properly\nTo fix this, use a legible font type",
"source": "human"
},
{
"text": "LLM Comment 3\n\nThe expected standard is that the design should be visually appealing and use a consistent color scheme. In the current design, the colors are \n not bright and saturated, and they clash with each other. To fix this, the designer should use a more muted and harmonious color scheme.",
"source": "both"
}
]
},
{
"ricoId": "7017",
"task": "Check the Shopping Bag  or Click on the 'Go Shopping' button.",
"designQualityRating": "4",
"comments": [
{
"text": "The expected standard is to have essential menu icons (home, user profile, add to cart, etc.) in the footer for efficient navigation and enhanced user experience.\nIn the current design,  crucial footer menu icons (home, user profile, add to cart, etc.) are absent, hindering user navigation and functionality. \nTo fix this, promptly integrate the missing menu icons (home, user profile, add to cart, etc.) into the footer layout to ensure efficient navigation and enhanced functionality.",
"source": "human"
},
{
"text": "The expected standard is to have 'search' and 'reload' icons in the layout for enhanced functionality and user experience.\nIn the current design, the absence of 'search' and 'reload' icons undermines functionality and user experience, falling short of expected standards.\nTo fix this, ensure the integration of 'search' and 'reload' icons into the layout, enhancing functionality and meeting expected standards.",
"source": "human"
},
{
"text": "The expected standard is that each section, such as the header, body, and footer, should feature distinct visual elements, facilitating easy differentiation and enhancing overall user experience.\nIn the current design, the lack of differentiation between the header, body, and footer, all sharing the same white background, fails to meet the expected standard of clear section distinction for optimal user experience.\nTo fix this, consider implementing contrasting backgrounds or subtle shading te...",
"source": "human"
}
]
},
{
"ricoId": "19512",
"task": "Upload a photo and view its progress",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is that all the icons in the same hierarchy should be given similar graphic treatment. \nIn the current design, these icons do not have a similar graphic treatment. \nTo fix this, give similar treatment to the three dots icon and share icon. Omit the image icon if not needed.",
"source": "human"
},
{
"text": "The expected standard is that the design should provide a clearly marked \"emergency exit\" to leave the unwanted action without having to go through an extended process. In the current design, there is no clear way to cancel the photo upload. The user has to press the back button, which may not be obvious to all users. To fix this, the design should provide a clear way to cancel the photo upload, such as a \"Cancel\" button.",
"source": "human"
},
{
"text": "The expected standard is that the design should not contain information that is irrelevant or rarely needed. In the current design, the image at the top of the screen is irrelevant to the task of uploading a photo. To fix this, the design should remove the image at the top of the screen.",
"source": "both"
}
]
},
{
"ricoId": "2610",
"task": "login with the facebook or enter details to login with the Virtuagym or register an account.",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is to have high contrast between text and background for optimal readability.\nIn the current design, the small white and orange text lacks contrast with the background, hindering readability.\nTo fix this, adjust the background or text color for high contrast and increase text size for better readability.",
"source": "human"
},
{
"text": "The expected standard is to have a noticeable clickable element with clear contrast. \nIn the current design, the element on the screen appears non-clickable and seamlessly integrated with the background, giving users the impression that it is merely a static part of the display rather than an interactive component.\nTo fix this,  add a border or make a tile, so it doesn't blend in with the background.",
"source": "human"
},
{
"text": "The expected standard is to have a back icon/button for easy navigation to the previous page.\nIn the current design, design lacks a back button or arrow left icon, hindering navigation to the previous page.\nTo fix this,  implement a back icon (arrow left) in the top left corner for intuitive navigation back.",
"source": "human"
},
{
"text": "The expected standard is that the design should be responsive, easy to read and use.\nIn the current design, the text is too small and low contrast with the background which makes it difficult to read.\nTo fix this,  the designer should increase the size of the text and enhance the contrast.",
"source": "both"
}
]
},
{
"ricoId": "342",
"task": "Send Feedback about Great Sword.",
"designQualityRating": "5",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is text’s visual treatment and formatting should make it easy to read.\nIn the current design, the background makes the foreground text difficult to read.\nTo fix this, choose a background that provides better contrast.",
"source": "human"
}
]
},
{
"ricoId": "61904",
"task": "Check, Like, or View with the post in Basic Match.",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to read.\nIn the current design, the text font size is small and difficult to read.\nTo fix this, we can increase the text font size.",
"source": "human"
},
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the buttons are not visually prominent.\nTo fix this, we can enlarge the size of the buttons.",
"source": "human"
},
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to read.\nIn the current design, the background makes the foreground text difficult to read.\nTo fix this, we can choose a different contrasting background or we can choose a different font color.",
"source": "human"
},
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the plus sing is not visually prominent.\nTo fix this, we can increase the size of the plus sign.",
"source": "human"
},
{
"text": "The expected standard is that the design should address the design brief and should appropriately communicate the content to its intended audience.\nIn the current design, the app's appearance lacks visual appeal.\nTo fix this, we can redesign the interface with attention to aesthetics, incorporating visually pleasing elements such as colors, typography, and imagery.",
"source": "human"
}
]
},
{
"ricoId": "33633",
"task": "Set temperature for the AC",
"designQualityRating": "5",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that nothing should be placed on the page arbitrarily.\n\nIn the current design,  Important information gets cropped from this visual element. The digits (23,27) are outside the box. \nTo fix this, try rearranging how the elements appear in the design. The digits representing the temperature should be reduced in size and placed inside the box.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is every element should have some connection to another element on the page. Nothing should be placed on the page arbitrarily.\nIn the current design, these elements are not aligned in any organized way. The bigger digits (21/24 ) along with the smaller digits (24/25) are neither aligned with the content in the box nor with the box itself.\nTo fix this, try aligning the elements along a common line to create a clear and organized look.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is users should not have the wonder about the meaning of the icon provided in the design.\nIn the current design, this icon does not match the real world. It looks like a mountain but it is unclear about what it represents. \nTo fix this, change the icon that is relevant to the real world.",
"source": "human"
},
{
"text": "LLM Comment 4\nThe expected standard is to use clear contrast to distinguish between background and the elements. \nIn the current design, the background color and the color of the boxes are the same.\nTo fix this, Select a different background or a different color for the box.",
"source": "human"
},
{
"text": "LLM Comment 5\nThe expected standard is the design should be visually appealing and easy to use.\nIn the current design, the different elements are not aligned properly.\nTo fix this, align the elements more evenly.",
"source": "both"
}
]
},
{
"ricoId": "23020",
"task": "Enter details to sign up or sign up with the Facebook.",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is to have high contrast between text and background for optimal readability. \nIn the current design, orange text on the background creates poor contrast, hindering readability.\nTo fix this, adjust the text color for better contrast or lighten the background.",
"source": "human"
},
{
"text": "The expected standard is to have a recognizable Facebook icon with the text \"Facebook\".\nIn the current design, the Facebook button likely lacks  the official \"f\" logo.\nTo fix this, use the official Facebook \"f\" logo with the text.",
"source": "human"
},
{
"text": "The expected standard is to have visual consistency across elements. This means the sign-up button should be aligned with other elements in the layout. \nIn the current design,  the sign up button is not properly aligned with the other elements in the layout.\nTo fix this,  use the layout frameworks to achieve the desired alignment.",
"source": "human"
},
{
"text": "The expected standard is that the design should use the proper alignment with others.\nIn the current design, the alignment of the element on the screen is different from the other elements.\nTo fix this, change the alignment of the element on the screen to match with the other elements alignment.",
"source": "both"
}
]
},
{
"ricoId": "71737",
"task": "View Rosters of sports",
"designQualityRating": "5",
"comments": [
{
"text": "LLM Comment 1\nThe Expected standard is to ensure sufficient color contrast for text to improve readability and accessibility.\n\nIn the current design, the text for \"all sports\" has low contrast against its background, making it difficult to read.\n\nTo fix this, adjust the color of the text to increase the contrast with the background, ensuring that it is easily legible for all users.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe Expected standard is to maintain visual consistency between icons and text sizes for a balanced and harmonious interface.\n\nIn the current design, the icons of menu items are larger than the accompanying text, which may disrupt visual balance and hierarchy.\n\nTo fix this, adjust the size of the icons to be consistent with the size of the text, ensuring that both elements are proportionate and visually aligned.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe Expected standard is to use universally recognized icons or provide clear labels for interface elements to ensure user understanding and interaction.\n\nIn the current design, the icons for facilities and game day may not be easily recognized by users, leading to confusion about their purpose.\n\nTo fix this, consider using more universally recognized icons or providing clear labels alongside the icons to indicate their functions.",
"source": "human"
},
{
"text": "LLM Comment 4\nThe Expected standard is to use appropriately sized headings to provide hierarchy and emphasis in content presentation.\n\nIn the current design, the heading for \"My Settings\" is not large enough, potentially lacking prominence and visual hierarchy.\n\nTo fix this, increase the size of the heading to ensure it stands out prominently and effectively communicates its importance.",
"source": "human"
}
]
},
{
"ricoId": "45333",
"task": "Read information about sequential",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is to maintain consistency and alignment throughout the design, ensuring a cohesive visual hierarchy.\n\nIn the current design, the heading (Sequential) and subheading are not aligned, which can create a disjointed appearance and affect readability.\n\nTo fix this, align the heading and subheading either horizontally or vertically to create a harmonious layout.",
"source": "human"
},
{
"text": "The expected standard is to ensure sufficient color contrast between interactive elements and their background to improve accessibility and usability.\n\nIn the current design, there is a lack of color contrast between the checkbox and the background color, making it difficult for users to distinguish the checkbox.\n\nTo fix this, increase the color contrast between the checkbox and the background by either darkening the checkbox color or lightening the background color.",
"source": "human"
},
{
"text": "The expected standard is that the design should be responsive and easy to use on different devices. In the current design, the design is not responsive and is difficult to use on different devices. The text is too small to read on a small screen, and the layout is not optimized for touch input. To fix this, the designer should use a more responsive design, with a larger font size and a layout that is optimized for touch input.",
"source": "both"
}
]
},
{
"ricoId": "4349",
"task": "find the location on the map.",
"designQualityRating": "5",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that the design should be visually appealing and easy to use.\nIn the current design, elements are misplaced which appears cluttered, difficult to understand.\nTo fix this, prioritize a clear hierarchy and spacing between the elements in the layout.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is to have margins or padding around elements, ensuring they don't touch layout edges and content has breathing room.\nIn the current design, elements lack proper margins/padding, causing them to crowd the edges and potentially overflow.\nTo fix this, introduce margins or padding around elements, creating breathing room and preventing overflow.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is that the design should be visually appealing and easy to use. In the current design, the layout is cluttered, making it difficult to read and understand. To fix this, the designer should use a  more organized layout.",
"source": "both"
}
]
},
{
"ricoId": "63642",
"task": "View/add information under metrics",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is that text should be clearly readable. \nIn the current design, the text is not readable due to low font weight, size and color. \nTo fix this, increase the font size, weight and change the color.",
"source": "human"
},
{
"text": "The expected standard is that text should be clearly readable. \nIn the current design, the text is not readable due to low font weight, size and color. \nTo fix this, increase the font size, weight and change the color.",
"source": "human"
}
]
},
{
"ricoId": "5898",
"task": "Enter Input Codes and search in Google.",
"designQualityRating": "5",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is text’s visual treatment and formatting should make it easy to read.\nIn the current design, the background makes the foreground text difficult to read.\nTo fix this, we can choose a background that provides better contrast.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is to make the most important information visually dominant.\nIn the current design, the search button is not visually prominent.\nTo fix this, some prominence should be given to the search button.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is that every element should have some connection to another element on the page. Nothing should be placed on the page arbitrarily.\nIn the current design, the text is left aligned.\nTo fix this, the text should be center aligned.",
"source": "human"
},
{
"text": "LLM Comment 4\nThe expected standard is that the design should match the importance of content to its visual prominence.\nIn the current design, the look of the app is quite simple and not eye-catching.\nTo fix this, we should incorporate visually appealing elements such as icons, illustrations, or images to make the interface more vibrant and interesting.",
"source": "human"
}
]
},
{
"ricoId": "42706",
"task": "Enter required details to sign up on school leader",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is to ensure legibility and clarity in design elements. In the current design, the text \"have an account\" suffers from low font width and a font color (gray) that blends too closely with the background color (white).To fix this, increase the font width of the text \"have an account\" to improve readability. Additionally, consider adjusting the font color to a darker shade of gray or a contrasting color to enhance visibility against the white background.",
"source": "human"
},
{
"text": "The expected standard is to ensure optimal layout and alignment of design elements for intuitive user interaction. In the current design, the position of the login button below the \"Have an account\" text appears awkward and disrupts the visual flow.\nTo fix this,consider moving the login button closer to the \"Have an account\" text and vertically aligning them for a more cohesive layout.",
"source": "human"
},
{
"text": "The expected standard is to maintain adequate color contrast between text and background elements for improved readability and accessibility. In the current design, the email address font color is sky blue, while the password font color is light gray. This color combination may not provide sufficient contrast against the white background, making it difficult for users to discern the text.\nTo fix this,ensure consistency in font color for both the email address and password fields. By using the...",
"source": "human"
},
{
"text": "he expected standard is to maintain clarity and coherence in the visual design elements used throughout the layout. In the current design, a green line is present, but its purpose or significance is not clearly defined or explained.\nTo fix this,consider removing the green line altogether.",
"source": "human"
},
{
"text": "The expected standard is that the text should be clear and easy to read. In the current design, the text is not clear and easy to read. The font is too small, and the colors are too similar to the background. To fix this, the font should be increased in size, and the colors should be changed to make the text more readable.",
"source": "both"
}
]
},
{
"ricoId": "12773",
"task": "Proceed to next page on onboarding screen",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is every element should have some connection to another element on the page. \nIn the current design,\nthe way these visual elements overlap makes them difficult to see\nTo fix this, Try rearranging how the elements appear in the design.",
"source": "human"
},
{
"text": "The expected standard is that the user should be able to understand what the app is trying to communicate. \nIn the current design, the user is not able to understand what the app is trying to communicate because there is another screen on the welcome page.\nTo fix this, Try removing content that does not help convey the primary message.Maybe add some images/ icons to convey information",
"source": "human"
},
{
"text": "The expected standard is that the user should be able to understand what the app is trying to communicate. In the current design, the user is not able to understand what the app is trying to communicate because the text is too small and there is too much of it on the screen. To fix this, the text should be made larger and more concise.",
"source": "both"
}
]
},
{
"ricoId": "39710",
"task": "View instant plays of spuul",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is to include a back icon or button within the layout, providing users with a convenient way to navigate back to the main screen .\nIn the current design, the absence of a back icon or button disrupts the expected navigation flow and may lead to user frustration or confusion.\nTo fix this,  incorporate a back icon or button in a prominent and easily accessible location within the layout, typically in the top-left corner.",
"source": "human"
}
]
},
{
"ricoId": "48668",
"task": "choose one from the list of options",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is to use icons that match to the real world.\nIn the current design,\nthis icon does not give a clear meaning. To fix this, change the icon.",
"source": "human"
},
{
"text": "The expected standard is that icons should clearly convey function state (active/inactive).\nIn the current design, these icons are grayed out indicating that they are not active. To fix this, consider changing the color palette for the icons to signify their current state and maintain a visually intuitive interface.",
"source": "human"
}
]
},
{
"ricoId": "28800",
"task": "Choose the title from the list",
"designQualityRating": "5",
"comments": [
{
"text": "LLM Comment 1\nThe Expected standard is to use appropriate icons that complement the heading and enhance user understanding.\n\nIn the current design, the home icon may not be suitable for the heading, potentially causing confusion about its relevance.\n\nTo fix this, consider using a more relevant icon or removing the icon altogether if it does not add value to the heading.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe Expected standard is to maintain adequate contrast between text and background for readability and accessibility.\n\nIn the current design, the text has low contrast against the background, which can make it difficult for users to read.\n\nTo fix this, adjust the color of the text to ensure it contrasts sufficiently with the background, making it more legible and improving overall readability.",
"source": "human"
}
]
},
{
"ricoId": "59391",
"task": "Explore the available features within the FB Free Video Downloader section.",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the back button is not visually prominent.\nTo fix this, we can enlarge the back button.",
"source": "human"
},
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to read.\nIn the current design, the font size of the options text is too small.\nTo fix this, we can increase the options text font size.",
"source": "human"
},
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to read.\nIn the current design, the text font size is small.\nTo fix this, we can increase the text font size.",
"source": "human"
},
{
"text": "The expected standard is that nothing should be placed on the page arbitrarily.\nIn the current design, the option buttons are too closely spaced, resulting in a cluttered appearance.\nTo fix this, we can add more space between each option button to provide visual separation and improve clarity.",
"source": "human"
}
]
},
{
"ricoId": "24599",
"task": "Read about the new version",
"designQualityRating": "5",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is to maintain a visually balanced layout with sufficient spacing between elements to avoid clutter and congestion, thereby enhancing user readability and comprehension.\n\nIn the current design, the layout appears cluttered, with too many elements occupying a small space, resulting in congestion and visual overload.\n\nTo fix this, streamline the layout by removing unnecessary elements and prioritizing essential content. Create more space between elements to r...",
"source": "human"
},
{
"text": "LLM Comment 2\nhe expected standard is for the UI to use consistent formatting and capitalization throughout to improve readability.\nIn the current design, there is a mix of uppercase and lowercase letters in the list items. For example, \"Enhanced color palette\" is all lowercase, while \"New Shapes\" is uppercase.\nTo fix this, all of the list items should be formatted in the same way. You could choose either uppercase or lowercase for better consistency.",
"source": "human"
},
{
"text": "LLM Comment 4\nThe expected standard is that the design should be simple and easy to understand. In the current design, there are too many elements and the design is too cluttered, making it difficult to understand what the app is trying to communicate. To fix this, the design should be simplified and the number of elements should be reduced.",
"source": "human"
}
]
},
{
"ricoId": "48049",
"task": "To initiate the design creation process, simply click on the plus sign icon.",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the logo is not clear.\nTo fix this, we can ensure that the logo image used in the design is of high resolution.",
"source": "human"
},
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to read.\nIn the current design, the background makes the foreground text difficult to read.\nTo fix this, we can choose a different font color or use a different contrasting background.",
"source": "human"
},
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the plus sign is not visually prominent.\nTo fix this, we can make the plus sign icon bolder or thicker to increase its visual weight or we can adjust the color of the plus sign icon to ensure it stands out from the background or surrounding elements.",
"source": "human"
},
{
"text": "The expected standard is that the design should address the design brief and should appropriately communicate the content to its intended audience.\nIn the current design, the app's appearance lacks attention-grabbing elements.\nTo fix this, we can introduce vibrant and eye-catching colors.",
"source": "human"
}
]
},
{
"ricoId": "32240",
"task": "Browse all options for shopping",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is to maintain sufficient color contrast between icons and text for clear visibility and readability.\n\nIn the current design, there is a lack of color contrast between the icons and text, making them difficult to distinguish from each other.\nTo fix this,the color scheme should be adjusted to ensure that there is enough contrast between the icons and text.",
"source": "human"
},
{
"text": "The expected standard is to maintain a readable text size that ensures comfortable legibility for users.\n\nIn the current design, the text size is too small, making it difficult for users to read the text comfortably.\nTo fix this,the text size should be increased to a level that provides better readability.",
"source": "human"
},
{
"text": "The expected standard is to ensure that text buttons are sufficiently sized and have an appropriate font width for clear visibility and usability.\n\nIn the current design, the text button size is too small, and the font width is too low, resulting in poor visibility of the text.\nTo fix this,the size of the text buttons should be increased to make them more prominent and easier to interact with. Additionally, adjusting the font width to a more appropriate level will improve the legibility of th...",
"source": "human"
},
{
"text": "he expected standard is that the text should be easy to read and understand. In the current design, the font is too small and the text is too dense, making it difficult to read. To fix this, the designer should use a larger font size.",
"source": "both"
},
{
"text": "The expected standard is that the buttons should be easy to tap and understand. In the current design, the buttons are too small and too close together, making them difficult to tap. To fix this, the designer should make the buttons larger and space them out more.",
"source": "both"
}
]
},
{
"ricoId": "46173",
"task": "View current projection and search players",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is for white space to be used to create separation between elements and improve readability. In the current design, there is very little white space between the player names, stats, and other elements, making the UI feel cluttered and hard to read.\nTo fix this, add more white space between the different elements in the UI. This will make it easier for users to scan and find the information they are looking for.",
"source": "human"
},
{
"text": "The expected standard is for important information to be clearly visible and not obscured by other elements. In the current design, the message about needing a subscription to view all projections partially obscures the bottom player's stats.\nTo fix this, move the subscription message to a different location where it does not obscure any content.",
"source": "human"
},
{
"text": "The expected standard is to ensure that user interface elements, such as search placeholders, are clearly distinguishable and intuitive for users to understand their purpose.\n\nIn the current design, the 'player name' search placeholder lacks visual distinction from the background, making it difficult for users to recognize it as a placeholder. \nTo fix this,it's crucial to enhance the visual appearance of the search placeholder.",
"source": "human"
},
{
"text": "The expected standard is to maintain legible text and digit sizes to ensure ease of readability and comprehension for users.\n\nIn the current design, both the text size and digit size appear to be too small, making it challenging for users to read and interpret the content effectively. \nTo fix this,increase the size of both the text and digits throughout the interface.",
"source": "human"
}
]
},
{
"ricoId": "51689",
"task": "Manage synchronizing settings and view information",
"designQualityRating": "5",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is elements that occupy similar positions in the information hierarchy should be given similar graphic treatment.\nIn the current design, the icons (i) are too large as compared to the text besides them. Instead of the text heading/ sub - heading, the icons are prominently visible.\nTo fix this, reduce the size of these icons.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is Elements that occupy similar positions in the information hierarchy should be given similar graphic treatment.Every element should have some connection to another element on the page.\nIn the current design, The font size of the text is quite smaller and the icons are bigger in comparison. Also the items which seem to be in a group are not aligned with each other. The icon (synchronizing) is placed arbitrarily beside the title. Also the description (resto...",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is the text’s visual treatment and formatting should make it easy to read \nIn the current design, the text does not support readability. The chosen font size is too small.\nTo fix this, increase the font size and change the color too.",
"source": "human"
},
{
"text": "LLM Comment 5\nThe expected standard is The expected standard is that the user should be able to easily interact with the controls.\nIn the current design, the settings icon is difficult to interact with due to its small size.\nTo fix this,the icon should be made larger and easier to tap.",
"source": "both"
}
]
},
{
"ricoId": "69946",
"task": "Explore foodnut and read about \"Caesars bacchanal buffet, Las Vegas \"",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is to ensure that essential icons, like the search icon, are clearly visible and accessible to users. In this current design, the low contrast between the gray search icon and the black background hinders its visibility. To fix this issue, adjust either the background color or the icon color to create a higher contrast, making the search icon more visible and improving overall usability.",
"source": "human"
},
{
"text": "The expected standard is to provide clear and intuitive navigation elements for social media platforms in the user interface.\n\nIn the current design, the purpose of the Facebook icon is evident, but the icons for Twitter and Instagram lack clarity. \nTo fix this,add labels or text descriptions to specify the use of the Twitter and Instagram icons.",
"source": "human"
},
{
"text": "The expected standard is that the design should be visually appealing and use whitespace effectively. In the current design, the large amount of empty space at the top of the screen is not visually appealing. To fix this, the empty space should be reduced and the content should be moved up.",
"source": "human"
},
{
"text": "The Expected standard is to utilize images with appropriate dimensions to maximize content visibility and minimize unnecessary white space.\n\nIn the current design, the images are displayed with a small width, resulting in excessive white space around them.\n\nTo fix this, use images with larger dimensions or resize the existing images to better fill the available space.",
"source": "human"
},
{
"text": "The expected standard is that the links should be easy to see and understand. In the current design, the links are not clearly marked, making it difficult to see where they will take the user. To fix this, the designer should use a different color or underline the links to make them more visible.",
"source": "both"
}
]
},
{
"ricoId": "71733",
"task": "Manage settings for the application",
"designQualityRating": "5",
"comments": [
{
"text": "The expected standard is that headings should be prominently visible. \nIn the current design, the heading is not prominent. The font size is lower than the sub headings and the font color is light. \nTo fix this, change the font color and increase the font size.",
"source": "human"
},
{
"text": "The expected standard is that the text should be easy to read and respect rules of typography. In the current design, the text is difficult to read because it is too small and there is not enough contrast between the text and the background. To fix this, the text should be increased in size and the contrast between the text and the background should be increased.",
"source": "both"
}
]
},
{
"ricoId": "33502",
"task": "Scanning barcode",
"designQualityRating": "6",
"comments": [
{
"text": "LLM Comment 1\nThe Expected standard is to use icons that accurately represent their corresponding functions or actions for intuitive user understanding.\n\nIn the current design, the icon used for the scan option does not clearly convey its intended function.\n\nTo fix this, replace the current icon with one that more accurately represents the action of scanning, such as a barcode or scanner icon.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe Expected standard is to maintain visual consistency in button design throughout the interface.\n\nIn the current design, the \"Remove Ads\" button has a different color compared to other buttons, potentially disrupting the visual harmony.\n\nTo fix this, ensure that the color of the \"Remove Ads\" button matches the color scheme of other buttons in the interface",
"source": "human"
}
]
},
{
"ricoId": "26275",
"task": "Play to listen the audio under radio",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is that label and icons should be clearly visible.\nIn the current design,\nthe color used for the label and icon is white which has low contrast with the background. To fix this, change the color of the icons and the label.",
"source": "human"
},
{
"text": "The expected standard is that the font color should have enough contrast against the background color to be easily readable. In the current design, the light gray font color blends in with the white background color, making it difficult to read. To fix this, increase the contrast between the font color and the background color.",
"source": "both"
}
]
},
{
"ricoId": "64853",
"task": "Continue to finish managing Ad setting",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to understand. In the current design, the texts (Learn more about Acceptable Ads by clicking on the thumbnail when you first launch the browser.) are too small and difficult to read. To fix this, increase font size and weight to make it easier to read.",
"source": "human"
},
{
"text": "The expected standard is that elements should be given similar treatment.\nIn the current design, there is no consistency in texts. The font size of all texts are different from each other in the whole design.\nTo fix this, use the same font size and weight to give a similar visual appearance.",
"source": "human"
},
{
"text": "The expected standard is,that there should be maximum space utilization\nIn the current design,there is enough white space to adjust other elements on the screen\nTo fix this,try adding more elements on the screen or increase the size of the present elements to cover up blank space.",
"source": "human"
},
{
"text": "The expected standard is  design should convey a clear message\nIn the current design Finish button is there in the page in place of the next button\nTo fix this try adding texts like  (Continue or next) to navigate further",
"source": "human"
},
{
"text": "The expected standard is that the page should have a link back to the home page. In the current design, there is no link back to the home page. To fix this, a link back to the home page could be added to the top of the page.",
"source": "human"
}
]
},
{
"ricoId": "30702",
"task": "Select an option from the given list to explore.",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is to include a back button for easy navigation and user experience.\nIn the current design, the back button is missing, which can make it challenging for users to navigate backward through the interface.\nTo fix this, add a back button in a prominent location, typically in the top-left corner of the screen, to allow users to navigate back to the previous page or screen.",
"source": "human"
},
{
"text": "The expected standard is that the text should be easy to read and understand. In the current design, the text is small and difficult to read, and the colors are too similar to each other, making it difficult to distinguish between the text and the background. To fix this, the text should be increased in size and the colors should be changed to provide more contrast.",
"source": "human"
},
{
"text": "The expected standard is to ensure that interface elements, such as the footer, have appropriate color schemes that contribute to visual harmony and readability.\n\nIn the current design, the footer color is excessively light, which may result in poor visibility and contrast with the rest of the interface.\nTo fix this,consider using a muted color for the footer. A muted color maintains visual consistency while providing better contrast with the background.",
"source": "human"
},
{
"text": "The expected standard is to maintain consistent and legible text sizes within interface design, ensuring that all text elements, including buttons, are easily readable and accessible to users.\n\nIn the current design, the text size on the buttons appears too small, which may hinder readability and usability.\nTo fix this,consider increasing the size of the text on the buttons to make it more prominent and easier to read.",
"source": "human"
},
{
"text": "The expected standard is that the design should be visually appealing and use elements that are appropriate for the target audience. In the current design, the font is difficult to read and the colors are not very appealing. To fix this, the font should be changed to something more readable and the colors should be changed to something more appropriate for the target audience.",
"source": "both"
}
]
},
{
"ricoId": "66433",
"task": "Select an option from the menu to explore",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is to include a back button for easy navigation and user experience.\nIn the current design, the back button is missing, which can make it challenging for users to navigate backward through the interface.\nTo fix this, add a back button in a prominent location, typically in the top-left corner of the screen, to allow users to navigate back to the previous page or screen.",
"source": "human"
},
{
"text": "The expected standard is that the user can easily distinguish between the different sections of the app.\nIn the current design, the different sections are not visually distinct from each other, making it difficult for the user to see where one section ends and another begins.\nTo fix this, the designer could add a visual separator between each section.",
"source": "human"
}
]
},
{
"ricoId": "23858",
"task": "Personalize the City Owl good night message and choose recipients.",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the back button is not visually prominent.\nTo fix this, we can enlarge the back button.",
"source": "human"
},
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the text \"City Owl\" is sufficient, but enlarging it may improve its appearance.\nTo fix this, we can enlarge it.",
"source": "human"
},
{
"text": "The expected standard is that the tests should be visually treated and formatted for easy readability.\nIn the current design, the text font size is small.\nTo fix this, we can increase the text font size.",
"source": "human"
},
{
"text": "The expected standard is that the texts should be visually treated and formatted for easy readability.\nIn the current design, the background makes the foreground text difficult to read.\nTo fix this, we can choose a different font color or use a different contrasting background.",
"source": "human"
},
{
"text": "The expected standard is that the texts should be visually treated and formatted for easy readability.\nIn the current design, the highlighted text is small.\nTo fix this, we can increase the text font size.",
"source": "human"
}
]
},
{
"ricoId": "18251",
"task": "Look up information about engine trouble codes",
"designQualityRating": "6",
"comments": [
{
"text": "LLM Comment 1\nThe Expected standard is to ensure that interface elements convey clear and meaningful information to users.\n\nIn the current design, the combination of the profile icon and the number \"11\" may not be immediately understandable to users.\n\nTo fix this, provide additional context or labels to clarify the meaning of the \"11\" associated with the profile icon or remove this.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe Expected standard is to ensure that icons have sufficient contrast with their background for clear visibility and recognition.\n\nIn the current design, the info icon has low contrast, making it difficult to distinguish against its background.\n\nTo fix this, adjust the color or shading of the info icon to increase contrast with the background, ensuring it is clearly visible and recognizable by users.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe Expected standard is to provide clear visual cues to indicate selected or active sections for improved user understanding and navigation.\n\nIn the current design, when the lookup section is selected, it should be differentiated from other sections, such as being bolded or having different graphics, to make it visually distinct.\n\nTo fix this, apply a bold font style or use a different graphic treatment to the lookup section when it is selected, making it stand out from other s...",
"source": "human"
},
{
"text": "LLM Comment 4\nThe Expected standard is to use universally recognized icons for intuitive user understanding and interaction.\n\nIn the current design, the home icon is not easily recognizable, potentially causing confusion about its function.\n\nTo fix this, replace the unclear home icon with a universally recognized symbol, such as a house or home outline, to clearly convey the home functionality and enhance user understanding and interaction.",
"source": "human"
}
]
},
{
"ricoId": "27264",
"task": "Explore/review the blogs to buy product on banggood",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to understand. In the current design, the texts (Going dual with Blueboo) are  too small even when it is heading. To fix this, increase font size and weight to make it easier to read.",
"source": "human"
},
{
"text": "The expected standard is that the text and background colors used in the design should be complementary and easy to read. In the current design, texts are in white color on an orange background  which are difficult to read. To fix this, change colors to be more complementary to each other (change texts to dark colors) to make it easier to read.",
"source": "human"
},
{
"text": "The expected standard is that design should convey a clear message \nIn the current design, it does not provide enough information to the users to understand what the app itself is all about.\nTo fix this, redesign it by adding additional information with features to communicate the content to its intended users.",
"source": "human"
},
{
"text": "The expected standard is that the page should be easy understandable and  have a next button to navigate. In the current design, there is no button on the page for navigating further. To fix this, add a button for further navigation with mentioning words like (next or continue)",
"source": "human"
},
{
"text": "The expected standard is that the design should be aesthetically pleasing and consistent with the platform's design guidelines. In the current design, the fonts are too small, making it difficult to read. To fix this, the designer should increase the font size to make it easy to read.",
"source": "both"
}
]
},
{
"ricoId": "44125",
"task": "Invite your friends",
"designQualityRating": "6",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that the visual treatment and formatting of text should make it easy to understand the text hierarchy and respect the rules of typography.\nThe current design uses a smaller font size for the header compared to the rest of the text. This creates an unexpected hierarchy and might make the header less prominent. \nTo fix this,for a clearer design, consider using a larger font size for the header to differentiate it from the body text. This will create a visu...",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that the design should address the design brief and should appropriately communicate the content to its intended audience.\nIn the current design, this choice of design element(LS1MLB) is inappropriate for the overall message.\nTo fix this,try choosing more suitable visual features to carry the intended message.",
"source": "human"
}
]
},
{
"ricoId": "43000",
"task": "Choose/view  Car from the list",
"designQualityRating": "6",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is to implement a grid layout to establish consistent spacing and alignment for all elements. This provides a strong structure for your design.\nIn the current design, the misalignment of elements like \"SUB-CATEGORIES\" and \"ALL CATEGORY ADS\" creates a cluttered and confusing layout\nTo fix this, the elements should be aligned and  Use space around \"SUB-CATEGORIES\" and \"ALL CATEGORY ADS\" to help frame the content.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that the text should be easy to read and understand and follow  hierarchy.\nThe car model name has the same weight and color as all other text, making it difficult to distinguish and hindering readability.\nTo fix this,Utilize a larger font size , dark color for the car model name compared to the rest of the text. This creates a visual emphasis on the model as the primary focus.",
"source": "human"
},
{
"text": "LLM Comment 4\nThe expected standard is that the design should use the positioning of elements relative to each other to deliberately achieve an active or restive appearance. In the current design, the elements are not positioned in a way that creates a sense of balance or movement. To fix this, move the elements around to create a more balanced and dynamic composition.",
"source": "both"
}
]
},
{
"ricoId": "4938",
"task": "Sign-up & login for earn points",
"designQualityRating": "6",
"comments": [
{
"text": "LLM Comment 1\nThe Expected standard is to ensure that buttons have sufficient contrast with their background for clear visibility and user interaction.\n\nIn the current design, if the button color is grey and the layout background is white, there may be low contrast, making the button difficult to distinguish.\n\nTo fix this, adjust the button color to create better contrast against the white background, ensuring that it stands out clearly and is easily identifiable for users.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe Expected standard is to ensure adequate contrast between text and background for readability and accessibility.\n\nIn the current design, the text in the \"Terms & Privacy\" section has low contrast, which may make it difficult for users to read.\n\nTo fix this, increase the contrast between the text and background, such as using a darker text color against a lighter background or vice versa.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe Expected standard is to use color schemes that enhance readability and visual appeal in headings.\n\nIn the current design, the color scheme for the heading \"Earn Points\" is poor, potentially impacting readability and visual aesthetics.\n\nTo fix this, consider using a more appropriate color scheme for the heading that complements the overall design and improves readability.",
"source": "human"
}
]
},
{
"ricoId": "66205",
"task": "Set wallpaper from Hindi SMS Collection",
"designQualityRating": "6",
"comments": [
{
"text": "The Expected standard is to include a back icon for easy navigation to the previous screen, improving user experience and usability.\n\nIn the current design, the layout lacks a back icon, potentially making it difficult for users to navigate back from the current screen.\n\nTo fix this, add a back icon to the layout, allowing users to easily return to the previous screen with a single tap or click.",
"source": "human"
}
]
},
{
"ricoId": "28800",
"task": "Please choose the Title.",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the back button is not visually prominent.\nTo fix this, we can enlarge the back button.",
"source": "human"
},
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to read.\nIn the current design, the text font size is small and a little difficult to read.\nTo fix this, we can increase the text font size.",
"source": "human"
},
{
"text": "The expected standard is that the design should use as few elements as possible to achieve its goals.\nIn the current design, the title has too many options.\nTo fix this, we can consider narrowing down the choices based on relevance, importance, or user preferences. We can also provide filters or categories to help users find the most suitable title more efficiently.",
"source": "human"
},
{
"text": "The expected standard is that nothing should be placed on the page arbitrarily.\nIn the current design, the buttons are too close to each other.\nTo fix this, we can create more spacing between the buttons.",
"source": "human"
},
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the Home button and the text (Title) are small in size.\nTo fix this, we can enlarge them.",
"source": "human"
}
]
},
{
"ricoId": "25926",
"task": "Select a category of product from women categories",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is to use up-to-date icons throughout the interface, including the \"Add to bag\" icon, to maintain a modern and cohesive design aesthetic.\nIn the current design,  the \"Add to bag\" icon appears to be an older version, potentially creating inconsistency with the overall look and feel of the interface.\nTo fix this,  update the \"Add to bag\" icon to the latest version available, ensuring that it aligns with current design.",
"source": "human"
}
]
},
{
"ricoId": "12408",
"task": "Explore the main dishes or search for specific ones.",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the back button is not visually prominent.\nTo fix this, we can enlarge the back button.",
"source": "human"
},
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the search button is not visually prominent.\nTo fix this, we can enlarge the search button.",
"source": "human"
},
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to read.\nIn the current design, the text font size is small and a little difficult to read.\nTo fix this, we can increase the text font size.",
"source": "human"
},
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the heart icons are not visually prominent.\nTo fix this, we can enlarge the heart icons.",
"source": "human"
},
{
"text": "The expected standard is that the design should use clear and concise language that is easy to understand. In the current design, the text is difficult to read because it is too small and there is too much of it on the screen. To fix this, the designer should use a larger font size and break up the text into smaller paragraphs.",
"source": "both"
}
]
},
{
"ricoId": "57973",
"task": "view/track pregnancy",
"designQualityRating": "6",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that Every element should have some connection to another element on the page. Nothing should be placed on the page arbitrarily.\nIn the current ,the advertisement is placed at the top of the layout and the ads at the top can disrupt the visual flow of the design. \nTo fix this,ads should be placed below  for maintaining a clear visual hierarchy.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that the elements should be aligned in an organized way. In the current design, the elements are not aligned in an organized way, which makes the design look cluttered and difficult to understand. To fix this, the elements should be aligned  to create a clear and organized look.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is that the design should be visually appealing and easy to read\nIn the current design,there is not enough contrast between the text color and the background color.\nTo fix this, the contrast between the text color and the background color should be increased.",
"source": "human"
},
{
"text": "LLM Comment 4\nThe expected standard is that the design should be visually appealing and easy to use. In the current design, the UI is cluttered and difficult to read, the poor color contrast. To fix this, the designer should use a more readable font and a more contrast color scheme. The layout should also be simplified, with more white space between elements.",
"source": "both"
}
]
},
{
"ricoId": "10089",
"task": "Explore the ACC Tournament schedules and match locations for the North Carolina team.",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the Menu option is not visually prominent.\nTo fix this, we can enlarge the button.",
"source": "human"
},
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to read.\nIn the current design, the background makes the foreground text difficult to read.\nTo fix this, we can choose a different font color or choose a different contrasting background.",
"source": "human"
},
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the arrow key buttons are not visually prominent.\nTo fix this, we can enlarge the buttons.",
"source": "human"
},
{
"text": "The expected standard is that nothing should be placed on the page arbitrarily.\nIn the current design, the menu bar is aligned to the left side of the page.\nTo fix this, we can provide a padding to the left side of the page.",
"source": "human"
},
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to read.\nIn the current design, the text font size is small and a little difficult to read.\nTo fix this, we can increase the text font size.",
"source": "human"
}
]
},
{
"ricoId": "5005",
"task": "Select an option from support menu for the Uber app",
"designQualityRating": "6",
"comments": [
{
"text": "The Expected standard is to include a back icon for easy navigation to the previous screen, improving user experience and usability.\n\nIn the current design, the layout lacks a back icon, potentially making it difficult for users to navigate back from the current screen.\n\nTo fix this, add a back icon to the layout, allowing users to easily return to the previous screen with a single tap or click.",
"source": "human"
},
{
"text": "The Expected standard is to maintain sufficient color contrast between headings and other elements for readability and visual hierarchy.\n\nIn the current design, the heading has less color contrast compared to the options, potentially affecting its visibility and prominence.\n\nTo fix this, adjust the color of the heading to ensure it stands out clearly against the background and other elements, such as options.",
"source": "human"
}
]
},
{
"ricoId": "25535",
"task": "Select Android beam app to send email",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to understand. In the current design, the texts (Android Beam) are too small and difficult to read. To fix this, increase font size and weight to make it easier to read.",
"source": "human"
},
{
"text": "The expected standard is that the text and background colors used in the design should be complementary and easy to read. In the current design, texts (Photo cube Lite Settings) are in grey color on a  grey background  which are difficult to read. To fix this, change colors of texts and backgrounds to be more complementary to each other and make it easier to read.",
"source": "human"
},
{
"text": "The expected standard is design should be well organized. In the current design, the lack of margins around the left and right edges looks awkward. To fix this, leave a little space between elements and the left and right edge of the design to give an organized look.",
"source": "human"
},
{
"text": "The expected standard is that elements should be given similar treatment.\nIn the current design, there is no consistency in texts. The font size of all texts are different from each other in the whole design.\nTo fix this, use the same font size and weight to give a similar visual appearance.",
"source": "human"
},
{
"text": "The expected standard is that design should convey a clear message \nIn the current design, it does not provide enough information to the users to understand what the app itself is all about.\nTo fix this, redesign it by adding additional information with features to communicate the content to its intended users.",
"source": "human"
}
]
},
{
"ricoId": "2879",
"task": "Choose an option to share",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is for UI elements to be consistent in size and appearance. This creates a sense of order and makes the interface easier to scan.\nIn the current design, the icons in the share menu are not all the same size.\nTo fix this, the icons could be resized so that they are all the same size.",
"source": "human"
},
{
"text": "The expected standard is to maintain an optimal text size and font width for improved readability and user experience.\n\nIn the current design, the text size appears to be too small, and the font width is narrow, which may make it difficult to read the content.\nTo fix it,increase both the text size and font width.",
"source": "human"
}
]
},
{
"ricoId": "35428",
"task": "Review Raphael Tan's messages or switch to Alerts or Connections.",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the back button is not visually prominent.\nTo fix this, we can enlarge the back button.",
"source": "human"
},
{
"text": "The expected standard is to make the most important information visually dominant.\nIn the current design, the highlighted buttons are not visually prominent.\nTo fix this, we can enlarge the buttons.",
"source": "human"
},
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to read.\nIn the current design, the text font size is small and the background makes the foreground text difficult to read.\nTo fix this, we can increase the text font size and choose a different contrasting background.",
"source": "human"
}
]
},
{
"ricoId": "32469",
"task": "Update account information and add friends from contacts",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is to place essential navigation elements in intuitive locations for easy access and usability.\n\nIn the current design, the search icon positioned at the bottom of the screen appears out of place and may not be easily accessible to users.\n\nTo fix this, relocate the search icon to a more prominent and commonly used location, such as the top of the screen.",
"source": "human"
},
{
"text": "The expected standard is to include a back button for easy navigation and user experience.\n\nIn the current design, the back button is missing, which can make it challenging for users to navigate backward through the interface.\n\nTo fix this, add a back button in a prominent location, typically in the top-left corner of the screen, to allow users to navigate back to the previous page or screen.",
"source": "human"
},
{
"text": "The expected standard is to present filter button icons with horizontal alignment for better visual consistency and user familiarity.\n\nIn the current design, the filter button icon, represented by three dots, is arranged vertically, which may disrupt the visual flow and consistency within the interface.\n\nTo fix this, adjust the layout of the filter button icon so that the three dots are horizontally aligned. This adjustment will maintain visual harmony with other interface elements and ensure...",
"source": "human"
}
]
},
{
"ricoId": "38191",
"task": "Click to pick/accept incoming call",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is that the text’s visual treatment and formatting should make it easy to understand. In the current design, the texts (Incoming call) are small and difficult to read. To fix this, increase font size and weight to make it easier to read.",
"source": "human"
},
{
"text": "The expected standard is that the text and background colors used in the design should be complementary and easy to read. In the current design, texts (Incoming call) are in white color on a blue background which are not making a good contrast.\n To fix this, change colors of texts and backgrounds to be more complementary to each other and make it easier to read.",
"source": "human"
},
{
"text": "The expected standard is that design should be well organized.\nIn the current design, the element is disappearing at the bottom edge of the layout leaving no marginal space which is making it difficult for users to use the function properly.\nTo fix this, redesign the UI to fit the elements within the page layout.",
"source": "human"
},
{
"text": "The expected standard is that the page should be visually appealing. In the current design, the page is very bland and unappealing. The layout is very basic. To fix this, redesign the page to be more visually appealing and make the layout more interesting.",
"source": "human"
},
{
"text": "The expected standard is that the text should be readable and easy to understand. In the current design, the text is small and difficult to read. To fix this, the text should be increased in size and made bolder.",
"source": "both"
}
]
},
{
"ricoId": "40995",
"task": "View Auto news article",
"designQualityRating": "6",
"comments": [
{
"text": "The expected standard is to maintain consistent spacing between elements, such as the title and date, for a cohesive and visually appealing layout.\n\nIn the current design, there is a gap between the title and date in all articles except for one, which lacks this spacing.\n\nTo fix this inconsistency, ensure that all articles have the same spacing between the title and date to maintain visual consistency throughout the interface.",
"source": "human"
}
]
},
{
"ricoId": "58804",
"task": "Click \"Rate this app\" to provide feedback.",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is that utilize color associations from the real world to guide users.\nIn the current design,The 'Rate This App' button currently uses red, which might be interpreted as a warning or error message, potentially discouraging users from providing feedback.\nTo fix this,consider changing the 'Rate This App' button's color from red to a more inviting and positive tone.Example: Using red for errors, green for success, and blue for links.",
"source": "human"
},
{
"text": "The expected standard is that the text should be easy to read and respect rules of typography. In the current design, the text is difficult to read because there is not enough contrast between the text and the background. To fix this,  use a darker gray color for the text.",
"source": "human"
},
{
"text": "The expected standard is that the text should be readable and easy to understand. In the current design, the text is difficult to read, and the colors are too light and distracting. To fix this, text colors should be changed.",
"source": "both"
}
]
},
{
"ricoId": "30702",
"task": "Explore the menu list .",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is that effective use of a grid structure helps create a clear and organized design.\nIn the current design, the group of the element (icons and texts) are misaligned.The excessive left margins disrupt the visual flow of the information.\nTo fix this, adjusting the left margins.",
"source": "human"
},
{
"text": "The expected standard is that the text should be easy to read and respect rules of typography. In the current design, the text is difficult to read because there is not enough contrast between the text and the background. To fix this,  use a darker color for the text.",
"source": "human"
},
{
"text": "The expected standard is that the design should be visually appealing and use elements that are appropriate for the target audience. In the current design, the font is difficult to read and the colors are not very appealing. To fix this, the font should be changed to something more readable and the colors should be changed to something more appropriate for the target audience.",
"source": "both"
}
]
},
{
"ricoId": "38615",
"task": "View  details about the timer",
"designQualityRating": "7",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that  ensures the interface is not just visually appealing but also functionally valuable.\nIn the current design, The purpose and function of the element is not clear\nTo fix this,  element functionality should  be cleared",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is to use different font sizes ,color and weights to create a visual hierarchy, helping users identify headings, body text, and call-to-action elements.\nIn the current design, text hierarchy is not followed ( Name is displayed in the wrong color )\nTo fix this,  Choose fonts designed for easy on-screen reading, avoiding decorative",
"source": "human"
}
]
},
{
"ricoId": "42125",
"task": "Place your meal order",
"designQualityRating": "7",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is there should be visual clarity between sections/ options to select.\nIn the current design, separation lines between the two options color too lite\n.\nTo fix this, Change the color of the separator lines between the options.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is for the layout to utilize white space effectively to guide the user's eye towards the most important information. In the current design, there is a large amount of empty space at the bottom of the screen, below the \"Fish Bites\" text. \nTo fix this,  create a more visually balanced composition.",
"source": "human"
}
]
},
{
"ricoId": "19298",
"task": "Fill in your details to create your profile.",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is that elements that occupy similar positions in the information hierarchy should be given similar graphic treatment. In the current design, elements that occupy similar positions in the images are not given similar graphic treatment, which makes the design look inconsistent and difficult to understand. To fix this, the design should be revised(add images) to make elements that occupy similar positions in the information hierarchy look similar.",
"source": "human"
},
{
"text": "The expected standard is that the form fields should be clear and easy to understand.\nIn the current design,the form fields lack clarity and fail to clearly indicate the required information.\nTo fix this, improve clarity, the form should have clear and concise labels for each field.",
"source": "human"
},
{
"text": "The expected standard is that the form fields should be clear and easy to understand. In the current design, the form fields are not clear and it is not obvious what information is required. To fix this, the designer should use more descriptive labels and provide more instructions.",
"source": "both"
}
]
},
{
"ricoId": "35391",
"task": "Press any of the four buttons to proceed",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is that buttons should be given graphic treatment according to their importance. \nIn the current design,\nthe important button is \"start now\". Although, both of the buttons are given the same graphic treatment. To fix this, remove the white background for the \n\"skip\" button and change the font color to white.",
"source": "human"
},
{
"text": "The expected standard is that elements should be in a similar alignment.\nIn the current design, these elements are not aligned with each other.\nTo fix this, align these elements to make the design organized.",
"source": "human"
}
]
},
{
"ricoId": "45373",
"task": "After entering your details,  proceed by clicking the 'Register.",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is that Interfaces should not contain information that is irrelevant or rarely needed. Every extra unit of information in an interface competes with the relevant units of information and diminishes their relative visibility.\nIn the current design,text fields are already pre-filled with text which can lead to a less engaging experience.\nTo fix this,the text fields should be blank",
"source": "human"
},
{
"text": "The expected standard is that the design should be visually appealing and easy to use. In the\n current design, the use of white space is excessive,making it difficult to focus on the important information.and\n difficult to use. To fix this, the amount of white space should be reduced and the elements\n should be arranged in a more organized manner.",
"source": "human"
},
{
"text": "The expected standard is that the text should be aligned center. In the current design, the text \"Sign in with another account\" is aligned left, which makes them look unbalanced. To fix this, the text should be aligned centered.",
"source": "human"
},
{
"text": "The expected standard is that every element should have some connection to another element on the page, and nothing should be placed on the page arbitrarily. In the current design, the \"Sign in with another account\" section is not aligned with the other elements on the page, and it looks like it was added as an afterthought. To fix this, align the \"Sign in with another account\" section with the other elements on the page, and make it look like it belongs.",
"source": "both"
}
]
},
{
"ricoId": "38201",
"task": "Track the contact.",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is that the text should be easy to read and respect rules of typography. In the current design, the text is difficult to read because  there is not enough contrast between the text and the background. To fix this,  the contrast between the text and the background should be increased.",
"source": "human"
},
{
"text": "The expected standard is that the most important information in a design should be visually emphasized. \nIn the current design,The menu icon is smaller than the standard size.The small size of the menu icon makes it difficult to see and interact with.\nTo fix this, adjust the size of menu.",
"source": "human"
},
{
"text": "The expected standard is that the design should use a consistent color scheme throughout the app. In the current design, the color scheme changes throughout the app. To fix this, use a consistent color scheme throughout the app.",
"source": "both"
}
]
},
{
"ricoId": "26372",
"task": "Cut/Edit Your ringtone",
"designQualityRating": "7",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that The text on the design should be free of errors.\nIn the current design,In the current design, there are spelling errors, for example ringtonecutter is grammatically incorrect.\nTo fix this, the spelling errors should be corrected.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that the design should use as few elements as possible to achieve its goals. In the current design, there are too many elements, which makes the design look cluttered and difficult to understand. To fix this, the number of elements should be reduced and the design should be simplified.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is that The design should address the design brief and should appropriately communicate the content to its intended audience.\nIn the current design,contact is inappropriate for the overall message. \nTo fix this,try choosing a more suitable visual element to carry the intended message.",
"source": "human"
},
{
"text": "LLM Comment 4\nThe expected standard is that the layout should be organized and easy to follow. In the current design, the layout is cluttered and difficult to follow. To fix this, the designer should use a more organized layout and make it easier to follow.",
"source": "both"
}
]
},
{
"ricoId": "20853",
"task": "Press \"Talk\" to Start Recording.",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is that the images should be high-quality and relevant to the content. In the current design, the images are low-quality and not relevant to the content. To fix this, the images could be replaced with high-quality images that are relevant to the content.",
"source": "human"
},
{
"text": "The expected standard is that every element should have some connection to another element on the page. Nothing should be placed on the page arbitrarily.\nIn the current design,The current overlap between text and the \"Talk\" button creates a visually unappealing and potentially confusing experience.\nTo fix this,Ensure the button design is  free from text overlap.",
"source": "human"
},
{
"text": "The expected standard is that The text is understandable and free of spelling/grammatical errors.\nIn the current design,text (helium,macho,princess,zeus)written entirely in lowercase  letters hinders readability and professionalism.\nTo fix this,implement a proper sentence, The first letter of each sentence is capitalized. This is the standard for written communication .",
"source": "human"
}
]
},
{
"ricoId": "2778",
"task": "Select your identification option.",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is that the design should use a consistent color scheme and be  visually appealing .\nIn the current design,design uses the same color for both the navigation section and the \"I live in the U.S. as a\" section making it harder for users to distinguish between navigation and the 'I live in the U.S. as a' section.\nTo fix this, improve clarity for users, we should consider using different colors to visually distinguish these important areas.",
"source": "human"
},
{
"text": "The expected standard is that the design should be visually appealing and easy to use. In the current design, the visual design is not visually appealing and may be difficult to use. For example, the colors used in the design are not very attractive and the layout is not very organized. To fix this, the visual design of the app should be improved to make it more visually appealing and easier to use. For example, the colors used in the design could be changed to be more attractive and the layo...",
"source": "both"
}
]
},
{
"ricoId": "45798",
"task": "Click button to update/close the notice",
"designQualityRating": "7",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is for the text  to be centered , The alignment of visual elements creates a well organized design.\nIn the current design,the text is off center placed ,\nTo fix this,Try aligning the text   to create a clear and organized look.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is The expected standard is that elements should be visible and the importance of the content should match its visual prominence – making the most important information visually prominent\nIn the current design, The text (notice, check update , close) lacks visual hierarchy and text is not visible due to light font color.\nTo fix this, text should be followed by a  visible hierarchy and use different font color and weight.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is that the text should be easy to read and understand. In the current design, the colors are too similar to each other, making it difficult to distinguish between the text and the background. To fix this,  the colors should be changed to provide more contrast.",
"source": "both"
}
]
},
{
"ricoId": "17584",
"task": "Submit/ Send your feedback.",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is that every element should have some connection to another element on the page. Nothing should be placed on the page arbitrarily.\nIn the current design,the use of rotation makes this visual text difficult to see.\nTo fix this,Try aligning it along a horizontal and vertical layout.",
"source": "human"
},
{
"text": "The expected standard is that the design should be visually appealing and easy to use. In the current design, the use of white space is excessive, making the design difficult to use. To fix this,  the amount of white space should be reduced and the elements\n should be arranged/added in a more organized manner.",
"source": "human"
}
]
},
{
"ricoId": "190",
"task": "",
"designQualityRating": "7",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is The text’s visual treatment and formatting should should make it easy to read and respect rules of typography.\nIn the current design, The header is written in a combination of numeric and icons, it is difficult for the user to recognize the header of this section To fix this, Make header text more visually prominent for optimal hierarchy in the UI",
"source": "human"
},
{
"text": "LLM Comment 3\nhe expected standard is that the design should use as few elements as possible to achieve its goals, and each visual element should contribute to the overall message; all non-essential elements should be omitted. In the current design, the \"Pics\" tab is unnecessary and should be removed. To fix this, remove the \"Pics\" tab.",
"source": "both"
}
]
},
{
"ricoId": "51326",
"task": "Explore/View Saved Searches",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is for design elements to have a comfortable amount of space around it for clarity. In the current design, the lack of margin between the text and the edge of the design is awkward. To fix this, consider increasing the left margin around the text.",
"source": "human"
},
{
"text": "The expected standard is that the text should be easy to read and respect rules of typography. In the current design, the text is difficult to read because there is not enough contrast between the text and the background. To fix this,  use a darker color for the text.",
"source": "human"
},
{
"text": "The expected standard is that the design should be visually appealing and easy to use. In the\n current design, the use of white space is excessive, disrupts the visual flow of information. To fix this, the amount of white space should be reduced  by adding elements in more  organized manner",
"source": "human"
},
{
"text": "The expected standard is that the design should be visually appealing and use a consistent color scheme. In the current design, the colors used in the \"Saved Searches\" section are not visually appealing and do not match the rest of the app. The background color is too light and the text color is too dark, making it difficult to read. Additionally, the font used in the section is not consistent with the rest of the app. To fix this, the background color could be changed to a darker shade of gr...",
"source": "both"
}
]
},
{
"ricoId": "40508",
"task": "Explore movie  videos.",
"designQualityRating": "7",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that elements that occupy similar positions in the information hierarchy should be given similar graphic treatment. In the current design, the elements that occupy similar positions in the information hierarchy are not given similar graphic treatment, Elements with similar importance (e.g., information after documentaries) don't have the same visual treatment. Additionally, some details like actress names etc are missing in the first section.\nTo fix this...",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that elements that occupy similar positions in the information hierarchy should be given similar graphic treatment.\nIn the current design, The words \"Cine\" and \"Trailer\" have different font weights.\nTo fix this,If \"CineTrailer\" is meant to be a single brand name, use the same font weight for both words.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is that elements that occupy similar positions in the information hierarchy should be given similar graphic treatment. In the current design, the elements that occupy similar positions in the information hierarchy are not given similar graphic treatment. To fix this, the elements that occupy similar positions in the information hierarchy should be given similar graphic treatment.",
"source": "both"
}
]
},
{
"ricoId": "44854",
"task": "Manage notifications settings",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is to ensure that every element should have a visual connection to each other on the page. When elements are aligned, they create a stronger, visually cohesive unit\nIn the current design, the placement of the heading ( notification bar) and the sub heading (display ongoing  notification) is not correct. The same is with all the headings and subheadings.\nTo fix this, try aligning the text along a common line to create a clear and organized look.",
"source": "human"
},
{
"text": "The expected standard is that the design should make the most important information visually dominant.\nIn the current design, font hierarchy is missing. The heading/ labels (ringtone/notification bar) and the sub headings are of the same font size.\nTo fix this, Consider using different font sizes to segregate between headings and subheadings.",
"source": "human"
},
{
"text": "The expected standard is that the hierarchy of information should be clear and visually distinct. In the current design, the hierarchy of information is unclear because all of the text is the same size and weight. To fix this, the text should be organized into a clear hierarchy, using different sizes and weights of text to indicate the importance of each piece of information.",
"source": "both"
}
]
},
{
"ricoId": "54855",
"task": "choose stickers to share",
"designQualityRating": "7",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is  that Proper alignment establishes a sense of order and organization within the UI. \nIn the current design,\nThe elements are too close together and lack proper spacing\nTo fix this,\nThe elements require more space between them to achieve proper spacing.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that the design should use as few elements as possible to achieve its goals. Each visual element should contribute to the overall message; all non-essential elements and should be omitted\nThe current design appears overwhelming due to the  number of stickers\nTo fix this,\nTo improve clarity and user experience, we should consider simplifying the design by reducing the number of stickers",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is that the design should be simple and easy to understand. In the current design, there are too many stickers on the screen. To fix this, the number of stickers on the screen should be reduced",
"source": "both"
}
]
},
{
"ricoId": "71244",
"task": "Select an option to explore",
"designQualityRating": "7",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is the design should make the most important information visually dominant.\nIn the current design, font hierarchy is missing. The heading/ labels (connect or Drive to/On my way/Meet up) and the sub headings are of the same font size.\nTo fix this, Consider using different font sizes to segregate between headings and subheadings.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that the UI should be clear, concise, and easy to navigate for users. \nIn the current design, The text color in the menu is light gray on a white background, which can be difficult to read for users with visual impairments or in low-light conditions.\nTo fix this,Use a darker text color or a different background color to improve the legibility of the text in the menu.",
"source": "human"
}
]
},
{
"ricoId": "59507",
"task": "Browse Upcoming Show Episode",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is that elements that occupy similar positions in the information hierarchy should be given similar graphic treatment.\nIn the current design,The navigation bar appears inconsistent due to poorly organized elements and missing items.\nTo fix this,ensure clear spacing and visual hierarchy between elements and some elements.",
"source": "human"
},
{
"text": "The expected standard is that the design should be easy to use and navigate. In the current design, the navigation is not very clear. There is a menu button in the top left corner, but it is not clear what it does. There is also a search button in the top right corner, but it is not clear what it does. To fix this, the navigation could be made more clear.",
"source": "both"
}
]
},
{
"ricoId": "65806",
"task": "Search friends and Invite them by available options.",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is to have high contrast between UI elements and the background for optimal readability.\nIn the current design, gray text and icons blend into the background, reducing readability.\nTo fix this,  increase the contrast between text/icons and background.",
"source": "human"
},
{
"text": "The expected standard is to have margins/padding and  alignments around elements, ensuring they don't touch layout edges and content has breathing room.\nIn the current design, elements lack proper margins/padding and alignment causing them to crowd the edges and potentially overflow.\nTo fix this, introduce proper alignment, margins or padding around elements, creating breathing room and preventing overflow.",
"source": "human"
}
]
},
{
"ricoId": "7051",
"task": "Explore the company's details.",
"designQualityRating": "7",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that  the design should address the design brief and should appropriately communicate the content to its intended audience\nIn the current design,\nThe\"Done\" button is inappropriate for the overall message.\nTo fix this, Try choosing a more suitable button  to carry the intended message or \"Done\"  button should be remove.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that the design should use the positioning of elements relative to each other to deliberately achieve an active or restive appearance. In the current design, the elements are not positioned in a way that creates a sense of balance. To fix this, the elements should be repositioned to create a more balanced design.",
"source": "both"
}
]
},
{
"ricoId": "64711",
"task": "Click 'Get Started' to proceed.",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is that the text should be easy to read. In the current design, the text is difficult to read because i there is not enough contrast between the text and the background. To fix this, the designer should  use a darker color for the text.",
"source": "human"
},
{
"text": "The expected standard is that the design should be visually appealing and easy to use. \nIn the current design, The current logo size might be difficult for users to see clearly.\nTo fix this,We can potentially increase the logo size for better visibility and user experience.",
"source": "human"
},
{
"text": "The expected standard is that the design should be visually appealing and easy to use.\nIn the current design,The logo appears too small, potentially making it difficult for users to see clearly. Additionally, it seems to be overlapping with another logo, which can be visually confusing.\nTo fix this,improve the layout, explore options for either increasing the logo size or adjusting the placement of both logos to avoid any overlap.",
"source": "human"
},
{
"text": "The expected standard is that the design should be consistent with other apps on the platform. In the current design, the app uses a different font and color scheme than other apps on the platform, making it look out of place. To fix this, the designer should use the same font and color scheme as other apps on the platform.",
"source": "both"
}
]
},
{
"ricoId": "38467",
"task": "Browse Latest to watch from the movie list.",
"designQualityRating": "7",
"comments": [
{
"text": "The expected standard is to use the positioning of elements relative to each other to deliberately achieve an active or restive appearance.\nIn the current design,The current padding in the top box office section creates excessive white space. This can make the section feel visually empty and reduce the information density on the page.\nTo fix this,he top box office section could benefit from a tighter visual layout. This might involve reducing some of the white space between elements.\"",
"source": "human"
},
{
"text": "The expected standard is for design elements to have a comfortable amount of space around it for clarity. In the current design, the lack of margin between the image and the edge of the design is awkward. To fix this, consider increasing the left margin around the image.",
"source": "human"
},
{
"text": "The expected standard is that the elements should be aligned and organized in a way that is visually appealing and easy to understand. In the current design, the elements are not aligned and organized in a way that is visually appealing and easy to understand. To fix this, the elements should be aligned and organized in a way that is visually appealing and easy to understand.",
"source": "both"
},
{
"text": "The expected standard is that the design should be balanced and have a sense of order. In the current design, the design is not balanced and does not have a sense of order. To fix this, the design should be balanced and given a sense of order.",
"source": "both"
}
]
},
{
"ricoId": "39217",
"task": "Enter numbers(mathematical problem) using the keyboard and calculate it.",
"designQualityRating": "8",
"comments": [
{
"text": "The expected standard is to have a clear and consistent back arrow icon in the layout to navigate back to the previous page.\n In the current design, lacking a back arrow icon hinders navigation back to the previous page.\nTo fix this, implement a universally recognized back arrow icon for intuitive navigation",
"source": "human"
}
]
},
{
"ricoId": "51722",
"task": "Explore the courses",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is the expected standard is to use clear contrast to distinguish between different levels of information.\nIn the current design,\nIt has Inconsistent information architecture,the title \"Courses on Sale\" is visually separated from the actual courses displayed below. This can make it difficult for users to understand the connection between the title and the content.\nTo fix this, Move the title \"Courses on Sale\" above the course cards to create a clear hierarch...",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is the expected standard is to use clear contrast to distinguish between different levels of information.\nIn the current design,\nIt has Inconsistent information architecture,the title \"Courses on Sale\" is visually separated from the actual courses displayed below. This can make it difficult for users to understand the connection between the title and the content.\nTo fix this, Move the title \"Other Students Are Viewing\" above the course cards to create a cle...",
"source": "human"
}
]
},
{
"ricoId": "8488",
"task": "Read about the LLC.",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is to have a clear and concise main heading in the layout.\nIn the current design,  it  lacks a clear main heading, hindering user understanding.\nTo fix this, Adding a concise main heading improves clarity.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is to have an icon which ensures a visually cohesive and intuitive user interface for optimal user experience and navigation.\nIn the current design, the absence of a specific \"three-dot\" icon compromises the user interface, hindering seamless navigation.\nTo fix this, promptly incorporate the missing icon into the layout.",
"source": "human"
}
]
},
{
"ricoId": "46628",
"task": "Activate/ deactivate Google fit by using the switch",
"designQualityRating": "8",
"comments": [
{
"text": "The expected standard is that an important label should be prominently visible. \nIn the current design,\nthe label \"deactivated is not clearly visible. To fix this, increase the font size of the label.",
"source": "human"
}
]
},
{
"ricoId": "54468",
"task": "View Document List",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that the design should use a clear and easy-to-read font. In the current design, the font is too small and difficult to read. To fix this, the font size should be increased and a more legible font should be used.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that the design should use as few elements as possible to achieve its goals, and that each visual element should contribute to the overall message. In the current design, there are too many elements on the page, making it cluttered and difficult to focus on the important information. To fix this, the number of elements on the page should be reduced, and the remaining elements should be arranged in a more organized way.",
"source": "both"
}
]
},
{
"ricoId": "41272",
"task": "Choose the caller ID.",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is to include the three dots icon for additional options in the design, as users are familiar with its meaning.\nIn the current design, the three dots icon, commonly used for additional options.\nTo fix this, it's important to adhere to the expected standard by adding the three dots icon where users typically anticipate it, ensuring a more intuitive and user-friendly interface.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is to have a visually appealing and user-friendly design where the background color complements the front text, ensuring readability and aesthetic harmony.\n\nIn the current design, the background color does not complement the front text, leading to a lack of visual appeal.\nTo fix this issue, it is essential to reassess and adjust the color scheme. Choose background colors that complement the front text, ensuring a visually pleasing.",
"source": "human"
}
]
},
{
"ricoId": "59009",
"task": "View the food recipe for jalapeno-olive Salsa",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that the image of the \" jalapeno-olive salsa\" is visually appealing ensuring that it is high resolution and well-centered\nIn the current design, The image lacks clear organization, making its elements appear scattered and confusing. \nTo fix this, Resize the image to a smaller dimension while maintaining its aspect ratio and center it horizontally within its container.",
"source": "human"
}
]
},
{
"ricoId": "31563",
"task": "Go back to previous page",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is to ensure optimal visibility and legibility of text in the design.\n\nIn the current design, the text is not visible enough due to the light text weight and background color. \nTo fix this, adjust the text weight to be bolder and modify the background color to provide ample contrast.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that the text should be legible and easy to read. In the current design, the text is not legible and easy to read because it is too small and the font is not clear. To fix this, the text should be made larger and the font should be changed to something more legible.",
"source": "both"
}
]
},
{
"ricoId": "61875",
"task": "Read news articles from The New York Times.",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that Standard fonts are generally considered a safer choice for headers when prioritizing readability and accessibility\nIn the current design,\nHeavily decorative fonts are irrelevant, and often difficult to read,\nTo fix this, The font should be standard to make it easy to read",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that text overflowing creates an unbalanced and unprofessional look.\nIn the current design,\ntexts are not placed and clearly visible on the correct position ,Users cannot access all the information when it's cut off and light color. \nTo fix this,\nensure clear and consistent formatting throughout the UI. Text size, line spacing, and color contrast should be optimized for readability.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is that The text’s visual treatment and formatting should make it easy to read and respect rules of typography\nIn the current design, \nThis font type and  choice makes the text difficult to read\nTo fix this,\nTry choosing a more legible font.",
"source": "human"
},
{
"text": "LLM Comment 4\nThe expected standard is that The text’s visual treatment and formatting should should make it easy to read and respect rules of typography\nIn the current design,\nThese lines of text create a ragged appearance\nTo fix this,\nTry using justified paragraphs to get a uniform, rectangular visual appearance.",
"source": "both"
}
]
},
{
"ricoId": "7145",
"task": "Log in or create an account",
"designQualityRating": "8",
"comments": [
{
"text": "The expected standard is that every label should convey its function. \nIn the current design, this label does not convey a clear meaning.\nTo fix this, add a relevant meaning.",
"source": "human"
}
]
},
{
"ricoId": "3710",
"task": "Choose from the various options to proceed",
"designQualityRating": "8",
"comments": [
{
"text": "The expected standard is that a hierarchy should be followed to present the information in the design. \nIn the current design, there is no hierarchy. It is difficult to understand which one of these labels are important and which ones are the less important ones. \nTo fix this, maintain a hierarchy by making the important labels bold. Make the title bolder. Avoid using all CAPS alphabets.",
"source": "human"
}
]
},
{
"ricoId": "33470",
"task": "View Competitions",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that the text should be readable and easy to scan. In the current design, the text is small and difficult to read.\nTo fix this, the text should be increased in size.",
"source": "human"
}
]
},
{
"ricoId": "28494",
"task": "Purchase new version of OBD II",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that Make the text easy to read by applying appropriate visual treatment and formatting that follows typographic principles\nIn the current design,\nThe current text color and font weight lack contrast and readability\nTo fix this,\nFor better readability,choose  higher contrast text color or adjust the font weight.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is that icons should be distinct, ensure overall stylistic consistency within the interface\nIn the current design, \nthe interface lacks differentiation between icons for different functionalities, leading to potential confusion for users. \nTo fix this,\nUtilize distinct icons  for each functionality to improve user experience",
"source": "human"
}
]
},
{
"ricoId": "3753",
"task": "Learn Japanese",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is The text’s visual treatment and formatting should  make it easy to read and respect rules of typography.\nIn the current design,In all buttons text color which is not matching to the background \nTo fix this,change the text color with bright  color.",
"source": "human"
}
]
},
{
"ricoId": "8214",
"task": "View about the articles: A/An/The",
"designQualityRating": "8",
"comments": [
{
"text": "The expected standard is to ensure that icons maintain a sufficient level of contrast against their background.\nIn the current design, the icons suffer from low contrast, making them less distinguishable and potentially causing usability issues, especially for users with visual impairments.\nTo fix this, adjust the colors of the icons to increase their contrast against the background.",
"source": "human"
}
]
},
{
"ricoId": "6048",
"task": "Explore the menu options for weight loss diet app.",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that the text should be easy to read and understand.\nIn the current design,  the font is  small and the text is packed, making it difficult to read.\nTo fix this, use a larger font size and more white space.",
"source": "human"
},
{
"text": "LLM Comment 2\n\nThe expected standard is to ensure that space is used purposefully and efficiently in the design, avoiding irrelevant gaps and unnecessary spacing. \nIn the current design, It has too much unnecessary space between elements, making it look messy and not meeting the expected standard.\n\nTo fix this issue,  reorganize the layout, implement a grid system, and ensure consistent spacing to achieve a cleaner and more user-friendly design.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is that the text should be easy to read and understand. In the current design, the font is too small and the text is too dense, making it difficult to read. To fix this, the designer should use a larger font size and more white space.",
"source": "both"
}
]
},
{
"ricoId": "50071",
"task": "View Account details",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe Expected standard is to ensure adequate color contrast between text and background for improved readability.\n\nIn the current design, the light gray text on a white background has low contrast, which can hinder readability, particularly for users with visual impairments or in low-light conditions.\n\nTo fix this, consider adjusting the color of the text to increase the contrast with the background. Choosing a darker shade of gray or black for the text can enhance readability wi...",
"source": "human"
},
{
"text": "LLM Comment 2\nThe Expected standard is to use universally recognized icons for common functionalities to ensure clarity and ease of use.\n\nIn the current design, the setting icon may not be universally recognized by users.\n\nTo fix this, consider replacing the setting icon with a more universally understood icon, such as a gear icon or a cogwheel icon, which is commonly associated with settings.",
"source": "human"
},
{
"text": "LLM Comment 3\nThe expected standard is that the text in the screen should be a dark color. In the current design, the text in the screen is a light color. To fix this, the text in the screen should be a dark color.",
"source": "both"
}
]
},
{
"ricoId": "62782",
"task": "Select a Strike count threshold.",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is elements should appropriately communicate the content to its intended audience.\nIn the current design, the disabled option could be omitted.\nTo fix this, remove the  disable option.",
"source": "human"
}
]
},
{
"ricoId": "59840",
"task": "Click on the \"Go To Recipe\"  button, check the recipe and like it to save it for later.",
"designQualityRating": "8",
"comments": [
{
"text": "The expected standard is to have high visual contrast between the gray image and the white background for clear visibility.\nIn the current design, the gray image blends into the white background, reducing its visibility and impact.\nTo fix this, increase the contrast between the image and background for better visibility.",
"source": "human"
}
]
},
{
"ricoId": "43625",
"task": "View the help page to login or register",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that the design is consistent with the rest of the operating system. In the current design, the design is not consistent with the rest of the operating system. For example, the buttons are not the same style as the buttons in other apps, and the text is not the same font as the text in other apps. To fix this, the design should be made consistent with the rest of the operating system. For example, the buttons should be the same style as the buttons in ot...",
"source": "both"
},
{
"text": "LLM Comment 2\nThe expected standard is that the design should use a clear and easy-to-read font. In the current design, the font is too small and difficult to read. To fix this, the font size should be increased and a more legible font should be used.",
"source": "human"
}
]
},
{
"ricoId": "34667",
"task": "Choose an option from the menu",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe Expected standard is to ensure consistency in the presentation of clickable options throughout the interface for clear user understanding and interaction.\n\nIn the current design, \"My Points\" is presented as a button, while \"Rate Talk,\" \"Share This App,\" and \"Settings\" are not, potentially causing confusion about their interactive nature.\n\nTo fix this, ensure that all clickable options, including \"Rate Talk,\" \"Share This App,\" and \"Settings,\" are presented consistently as but...",
"source": "human"
}
]
},
{
"ricoId": "27254",
"task": "sign in or Register for the account.",
"designQualityRating": "8",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is that text’s visual treatment and formatting should should make it easy to read and respect rules of typography.\nIn the current design, The use of font modifications makes the text difficult to read i.e. the icons for 'email' and 'password' and the placeholder text is not clearly visible enough.\nTo fix this, use a  different font color and size.",
"source": "human"
}
]
},
{
"ricoId": "17314",
"task": "Select the Week Name from the list.",
"designQualityRating": "8",
"comments": [
{
"text": "The expected standard is that the design should use as few elements as possible to achieve its goals. Each visual element should contribute to the overall message; all non-essential elements should be omitted. \nIn the current design,The month name \"January\" is mistakenly included in the list of week names and there's an error in the design, where \"January\" appears to list the days of the week.\nTo fix this,Simply remove the month name from the list of week names.",
"source": "human"
}
]
},
{
"ricoId": "34797",
"task": "Enable email notifications to receive  best deals and weekly specials.",
"designQualityRating": "8",
"comments": [
{
"text": "The expected standard is to have high color contrast between text and background for readability.\nIn the current design, small size gray text on white background creates low contrast, making it difficult to read.\nTo fix this, increase the text size, change the text color to a high-contrast option (black preferred) or lighten the background.",
"source": "human"
},
{
"text": "The expected standard is that the text should be easy to read and respect rules of typography. In the current design, the text is difficult to read because it is too small and there is not enough contrast between the text color and the background color. To fix this, the text should be increased in size and the contrast between the text color and the background color should be increased.",
"source": "both"
}
]
},
{
"ricoId": "40882",
"task": "Choose a product to view more information",
"designQualityRating": "9",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is to have a good color scheme for the text.\nIn the current design, the text color used, makes it under-exposed and not visible enough to the eyes.\nTo fix this, try choosing a text color with better contrast.",
"source": "human"
},
{
"text": "LLM Comment 2\nThe expected standard is to have nothing placed on the page arbitrarily. These elements are not aligned in any organized way.\nIn the current design, these elements should be placed at a general position. Also, there's more gap between the icon and text.\nTo fix this, try positioning the back button icon at a more ideal location and align the text where it looks more universally correct.",
"source": "human"
},
{
"text": "LLM Comment 4\nThe expected standard is that the design should be visually appealing.\nIn the current design, the UI is plain and text-heavy, with no images or other visual elements to break up the content. This makes it difficult to understand.\nTo fix this, the designer could add images, icons, or other visual elements to make the UI more visually appealing. They could also use different fonts and colors to make the text easier to read.",
"source": "both"
}
]
},
{
"ricoId": "69965",
"task": "Download Mod Apk",
"designQualityRating": "9",
"comments": [
{
"text": "LLM Comment 1\nThe expected standard is to have a good text visual treatment and formatting should make it easy to read and respect rules of typography.\n\n\nIn the current design, there is a poor font color provided for text \"paychex. com\".This font type choice makes the text difficult to read.\n\nTo fix this, try using a different font color.",
"source": "human"
}
]
}
].map((r, i) => ({
  id: `ext-uicrit-${String(i + 1).padStart(3, "0")}`,
  source: "UICrit",
  license: "CC BY 4.0",
  platform: "mobile",
  ricoId: r.ricoId,
  task: r.task,
  designQualityRating: r.designQualityRating,
  comments: r.comments,
}));

const CLASSIFICATION_PROMPT = `Analizá esta imagen de interfaz y devolvé EXCLUSIVAMENTE un objeto JSON, sin texto adicional, sin markdown, con esta forma:
{
  "screenType": "checkout" | "dashboard" | "formulario" | "landing" | "onboarding" | "configuracion" | "listado" | "detalle" | "otro",
  "components": ["select","combobox","modal","tabs","accordion","form","buttons","toast","table","empty-state","menu","navigation"],
  "platform": "web" | "ios" | "android" | "desktop" | "cross-platform"
}
En "components" incluí solo los que estén realmente visibles en la imagen, usando exactamente esos nombres. No inventes componentes que no se vean.`;

function seedCriteriaIfNeeded(existingKeys) {
  const batch1Done = existingKeys.some((k) => k.startsWith("criterion:seed-"));
  const batch2Done = existingKeys.some((k) => k.startsWith("criterion:seed2-"));
  const batch3Done = existingKeys.some((k) => k.startsWith("criterion:seed3-"));
  const batch4Done = existingKeys.some((k) => k.startsWith("criterion:seed4-"));
  const batch5Done = existingKeys.some((k) => k.startsWith("criterion:seed5-"));
  const batch6Done = existingKeys.some((k) => k.startsWith("criterion:seed6-"));
  const batch7Done = existingKeys.some((k) => k.startsWith("criterion:seed7-"));
  const batch8Done = existingKeys.some((k) => k.startsWith("criterion:seed8-"));
  const writes = [];
  if (!batch1Done) writes.push(...SEED_CRITERIA.map((c) => window.storage.set(`criterion:${c.id}`, JSON.stringify(c), true)));
  if (!batch2Done) writes.push(...SEED_CRITERIA_BATCH2.map((c) => window.storage.set(`criterion:${c.id}`, JSON.stringify(c), true)));
  if (!batch3Done) writes.push(...SEED_CRITERIA_BATCH3.map((c) => window.storage.set(`criterion:${c.id}`, JSON.stringify(c), true)));
  if (!batch4Done) writes.push(...SEED_CRITERIA_BATCH4.map((c) => window.storage.set(`criterion:${c.id}`, JSON.stringify(c), true)));
  if (!batch5Done) writes.push(...SEED_CRITERIA_BATCH5.map((c) => window.storage.set(`criterion:${c.id}`, JSON.stringify(c), true)));
  if (!batch6Done) writes.push(...SEED_CRITERIA_BATCH6.map((c) => window.storage.set(`criterion:${c.id}`, JSON.stringify(c), true)));
  if (!batch7Done) writes.push(...SEED_CRITERIA_BATCH7.map((c) => window.storage.set(`criterion:${c.id}`, JSON.stringify(c), true)));
  if (!batch8Done) writes.push(...SEED_CRITERIA_BATCH8.map((c) => window.storage.set(`criterion:${c.id}`, JSON.stringify(c), true)));
  if (!writes.length) return Promise.resolve(false);
  return Promise.all(writes).then(() => true);
}

async function loadAllCriteria() {
  const list = await window.storage.list("criterion:", true);
  const keys = list?.keys || [];
  const seeded = await seedCriteriaIfNeeded(keys);
  const finalList = seeded ? await window.storage.list("criterion:", true) : list;
  // Los ~181 criterios se guardan como filas individuales — pedirlas una por
  // una en un for-await secuencial significa 181 round-trips en fila contra
  // Supabase (segundos, no milisegundos, sobre todo la primera vez que
  // recién se sembró). Promise.all las pide todas en paralelo — mismo
  // volumen de pedidos, pero de una sola vez en vez de en fila.
  const items = await Promise.all((finalList?.keys || []).map((key) => window.storage.get(key, true).catch(() => null)));
  const records = [];
  for (const item of items) {
    if (!item?.value) continue;
    try { records.push(JSON.parse(item.value)); } catch (e) { /* skip unreadable */ }
  }
  return records;
}

// Categoría 2 — referencias visuales externas (hoy: UICrit). Namespace propio
// (external-reference:), nunca se mezcla con criterion: ni con critique:.
// Se guarda en lotes de 30 registros por key para no hacer 151 llamadas de
// storage individuales.
async function seedExternalReferencesIfNeeded(existingKeys) {
  const alreadySeeded = existingKeys.some((k) => k.startsWith("external-reference:uicrit-batch-"));
  if (alreadySeeded) return false;
  const chunkSize = 30;
  const chunks = [];
  for (let i = 0; i < EXTERNAL_REFERENCE_SEED_UICRIT.length; i += chunkSize) {
    chunks.push(EXTERNAL_REFERENCE_SEED_UICRIT.slice(i, i + chunkSize));
  }
  await Promise.all(
    chunks.map((chunk, i) =>
      window.storage.set(`external-reference:uicrit-batch-${String(i + 1).padStart(2, "0")}`, JSON.stringify(chunk), true)
    )
  );
  return true;
}

async function loadAllExternalReferences() {
  const list = await window.storage.list("external-reference:", true);
  const keys = list?.keys || [];
  const seeded = await seedExternalReferencesIfNeeded(keys);
  const finalList = seeded ? await window.storage.list("external-reference:", true) : list;
  const items = await Promise.all((finalList?.keys || []).map((key) => window.storage.get(key, true).catch(() => null)));
  const records = [];
  for (const item of items) {
    if (!item?.value) continue;
    try {
      const chunk = JSON.parse(item.value);
      if (Array.isArray(chunk)) records.push(...chunk);
    } catch (e) { /* skip unreadable */ }
  }
  return records;
}

// Regla dura de categoría 2: 100% mobile, cero web/desktop, sin excepciones.
function matchExternalReferences(classification, allRefs) {
  if (!classification || !allRefs?.length) return [];
  const platform = classification.platform;
  if (platform === "web" || platform === "desktop") return []; // regla explícita, no se negocia
  const screenType = (classification.screenType || "").toLowerCase();
  if (!screenType || screenType === "otro") return [];
  const words = screenType.split(/[\s/]+/).filter((w) => w.length > 3);
  const scored = allRefs
    .map((r) => {
      const task = (r.task || "").toLowerCase();
      const hits = words.filter((w) => task.includes(w)).length;
      return { r, hits };
    })
    .filter((s) => s.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 2); // acotado a propósito — son inspiración, no autoridad
  return scored.map((s) => s.r);
}

function formatExternalReferences(matched) {
  if (!matched.length) return "";
  const blocks = matched.map((r) => {
    const comments = r.comments.slice(0, 2).map((c) => `  - ${c.text}`).join("\n");
    return `· Pantalla similar de UICrit (rico_id ${r.ricoId}, calidad de diseño ${r.designQualityRating}/10): ${r.task}\n${comments}`;
  });
  return `\n\nREFERENCIAS EXTERNAS DE UICRIT (dataset de terceros, categoría 2 — NO es nuestro criterio oficial ni pasó por nuestra revisión humana; son solo inspiración de qué tipo de problemas buscar en pantallas similares, nunca las cites como si fueran una fuente normativa):\n${blocks.join("\n\n")}`;
}

function matchCriteria(classification, contextTags, allCriteria) {
  if (!allCriteria?.length) return [];
  const components = classification?.components || [];
  const userTags = expandTagsWithLegacyAliases(contextTags);
  const CORE_CAP = 8;
  const core = allCriteria.filter((c) => c.core).slice(0, CORE_CAP);
  const byComponent = classification
    ? allCriteria.filter((c) => c.component && components.includes(c.component))
    : [];
  const byContextTag = allCriteria.filter(
    (c) => !c.core && c.contextTags?.length && c.contextTags.some((t) => userTags.includes(t))
  );
  const seen = new Set();
  const combined = [...core, ...byComponent, ...byContextTag].filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  return combined.slice(0, 40); // tope razonable para no volver a inflar el prompt
}

function formatMatchedCriteria(matched) {
  if (!matched.length) return "";
  const lines = matched.map(
    (c) => `- [${c.dimension} / ${c.component}] ${c.statement} (Fuente: ${c.principle}, confianza: ${c.evidenceTier})`
  );
  return `\n\nCRITERIOS APLICABLES A ESTA PANTALLA (recuperados de la base de criterios, priorizalos por sobre generalidades):\n${lines.join("\n")}`;
}

// Círculo de alimentación de categoría 3: nuestras propias críticas, pero SOLO
// las que un humano aprobó explícitamente (status === "approved"). Nunca se usan
// críticas pendientes o rechazadas como calibración — evita que un hallazgo malo
// sin revisar contamine las próximas críticas.
async function loadApprovedCritiques() {
  const list = await window.storage.list("critique:", true);
  const keys = list?.keys || [];
  const items = await Promise.all(keys.map((key) => window.storage.get(key, true).catch(() => null)));
  const records = [];
  for (const item of items) {
    if (!item?.value) continue;
    try {
      const parsed = JSON.parse(item.value);
      if (parsed.status === "approved") records.push(parsed);
    } catch (e) { /* skip unreadable */ }
  }
  return records;
}

// Journeys — namespace propio (journey:), nunca se mezcla con critique:.
// Un journey NO duplica los datos de cada pantalla: es una capa liviana de
// agrupación + orden sobre críticas que ya existen en critique: (mismo
// storage, mismo flujo de revisión individual por pantalla — un journey no
// tiene su propio estado de aprobación en esta fase). Ver comentario sobre
// JourneyView más abajo para el alcance exacto (Fase 1: agrupar y ordenar;
// Fase 2, todavía no construida: síntesis cruzada entre pantallas del mismo
// flujo).
async function loadAllJourneys() {
  const list = await window.storage.list("journey:", true);
  const keys = list?.keys || [];
  const items = await Promise.all(keys.map((key) => window.storage.get(key, true).catch(() => null)));
  const records = [];
  for (const item of items) {
    if (!item?.value) continue;
    try { records.push(JSON.parse(item.value)); } catch (e) { /* skip unreadable */ }
  }
  records.sort((a, b) => b.createdAt - a.createdAt);
  return records;
}

// Journeys aprobados por un humano — cumplen el mismo rol que "corpus
// propio" (categoría 3) cumple para críticas de una sola pantalla: ejemplos
// de calibración para futuras críticas DE FLUJO. No hay todavía clasificador
// de "tipo de flujo" para matchear por similitud (eso es la contraparte de
// matchPastCritiques/matchExternalReferences para journeys, pendiente si el
// volumen lo justifica) — por ahora se usan simplemente los más recientes
// como referencia de tono y nivel de detalle esperado. Importante: esto
// alimenta la calibración de futuras críticas de flujo, NO se promueve
// automáticamente a SEED_CRITERIA — pasar de "hallazgo de flujo aprobado" a
// "criterio atómico permanente de la documentación" sigue siendo una
// decisión editorial humana explícita, con el mismo corte de curación
// (≥9/12, ver CRITERIA-BACKLOG.md) que cualquier otra fuente.
async function loadApprovedJourneyCritiques() {
  const journeys = await loadAllJourneys();
  return journeys.filter((j) => j.status === "approved" && j.critique);
}

function formatApprovedJourneyCritiques(approvedJourneys) {
  if (!approvedJourneys?.length) return "";
  const sample = approvedJourneys.slice(0, 3);
  const blocks = sample.map((j) => {
    const c = j.critique || {};
    const findingsSummary = (c.findings || [])
      .slice(0, 3)
      .map((f) => `  - [${f.type || "?"}] ${f.issue}`)
      .join("\n");
    return `· Flujo similar aprobado ("${j.title || "sin título"}", ${j.screenIds?.length || "?"} pantallas, revisado por ${j.reviewedBy || "el equipo"}): ${c.summary || ""}\n${findingsSummary}`;
  });
  return `\n\nEJEMPLOS DE CRÍTICAS DE FLUJO YA APROBADAS (calibración de tono y nivel de detalle esperado — no las copies literal, son referencia de estilo y prioridad):\n${blocks.join("\n\n")}`;
}

function matchPastCritiques(classification, approved) {
  if (!classification || !approved?.length) return [];
  const components = classification.components || [];
  const screenType = classification.screenType;
  const scored = approved
    .map((rec) => {
      const detected = rec.detectedScreen || {};
      let score = 0;
      if (detected.screenType && detected.screenType === screenType) score += 2;
      (detected.components || []).forEach((c) => { if (components.includes(c)) score += 1; });
      return { rec, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  return scored.map((s) => s.rec);
}

function formatPastCritiques(matched) {
  if (!matched.length) return "";
  const blocks = matched.map((rec) => {
    const c = rec.critique || {};
    const findingsSummary = (c.findings || [])
      .slice(0, 3)
      .map((f) => `  - [${f.type || "?"}] ${f.issue}`)
      .join("\n");
    return `· Pantalla similar aprobada ("${rec.title || "sin título"}", revisada por ${rec.reviewedBy || "el equipo"}): ${c.summary || ""}\n${findingsSummary}`;
  });
  return `\n\nEJEMPLOS DE CRÍTICAS PROPIAS YA APROBADAS PARA PANTALLAS SIMILARES (calibración de tono y nivel de detalle esperado — no las copies literal, son referencia de estilo y prioridad, no una lista a repetir):\n${blocks.join("\n\n")}`;
}

// Taxonomía de contexto (v2, dos grupos): "tipo de experiencia" es de
// selección única — describe qué está tratando de hacer la persona usuaria
// en esta pantalla — y "consideraciones" es opcional y de selección
// múltiple — condiciones transversales que pueden aplicar sin importar el
// tipo de experiencia (una pantalla de "Crear / editar" puede ser también
// "Alto riesgo" y "Uso experto" a la vez).
const EXPERIENCE_TYPES = [
  "Onboarding",
  "Tarea / transacción",
  "Explorar / encontrar",
  "Crear / editar",
  "Monitorear / analizar",
  "Comunicar / colaborar",
  "Administrar / configurar",
  "Marketing / convertir",
];

const CONSIDERATIONS = [
  "Tarea compleja",
  "Alta densidad",
  "Alto riesgo",
  "IA asistida",
  "Multilenguaje",
  "Accesibilidad",
  "Uso experto",
];

// Todos los tags usados en CONTEXT_TAGS (v1, plana) — se mantiene solo para
// mostrar correctamente las etiquetas de críticas viejas ya guardadas con
// esa taxonomía (record.contextTags), que no se reescriben retroactivamente.
const CONTEXT_TAGS = [...EXPERIENCE_TYPES, ...CONSIDERATIONS];

// Puente entre la taxonomía nueva y la vieja: ~180 criterios de la base ya
// están taggeados con nombres de la v1 (ej. "Flujo transaccional",
// "Dashboard / datos densos"). En vez de reescribir cada entrada de
// SEED_CRITERIA, un tag nuevo "hereda" el/los tag(s) viejo(s) equivalentes
// solo para efectos de matcheo — así el retrieval por tag sigue funcionando
// sin tocar la base de criterios. Los curadores de rondas futuras deberían
// taggear criterios nuevos ya con la taxonomía v2 directamente.
const LEGACY_TAG_ALIASES = {
  "Onboarding": ["Onboarding"],
  "Tarea / transacción": ["Flujo transaccional"],
  "Explorar / encontrar": ["Exploración / descubrimiento"],
  "Marketing / convertir": ["Marketing / landing"],
  "Monitorear / analizar": ["Dashboard / datos densos"],
  "Alta densidad": ["Dashboard / datos densos"],
  "Tarea compleja": ["Alta carga cognitiva"],
  "IA asistida": ["Feature con IA"],
  "Multilenguaje": ["Internacionalización"],
};

function expandTagsWithLegacyAliases(tags) {
  const expanded = new Set(tags || []);
  (tags || []).forEach((t) => (LEGACY_TAG_ALIASES[t] || []).forEach((legacy) => expanded.add(legacy)));
  return [...expanded];
}

// Biblioteca de 14 heurísticas (v1.13) — reemplaza el "ajustá el peso según
// el tag" ad-hoc por un sistema de pesos contextual real, calculado en JS y
// mandado a la IA ya resuelto (no le pedimos que haga la cuenta ella). Cada
// heurística arranca en peso base 2/4 y el tipo de experiencia + las
// consideraciones lo suben o bajan, con clamp a [1,4]. H14 (transparencia de
// IA) es la única que se activa/desactiva entera según si se marcó "IA
// asistida" — no aplica a pantallas sin IA.
const HEURISTICS = [
  { id: "H1", label: "Propósito y próxima acción", prompt: "Si la pantalla comunica para qué sirve, qué se puede lograr, qué importa más, y cuál es la próxima acción lógica." },
  { id: "H2", label: "Jerarquía visual y atención", prompt: "Si la estructura visual dirige la atención según importancia real — no solo contraste: también espaciado, orden, tipografía, agrupación." },
  { id: "H3", label: "Comprensión y contenido", prompt: "Si labels, terminología, instrucciones y microcopy son entendibles sin conocimiento interno del producto." },
  { id: "H4", label: "Navegación y ubicabilidad", prompt: "Si la persona entiende dónde está, dónde puede ir, cómo volver, y cómo encontrar lo que busca (navegación, búsqueda, filtros, breadcrumbs)." },
  { id: "H5", label: "Affordance y claridad de interacción", prompt: "Si se distingue qué es interactivo, cómo interactuar, y qué va a pasar después." },
  { id: "H6", label: "Feedback y estado del sistema", prompt: "Si la interfaz comunica qué está pasando: cargando, guardado, seleccionado, pendiente, error, vacío, etc." },
  { id: "H7", label: "Prevención y recuperación de errores", prompt: "Si el producto previene errores, los detecta, los comunica, y permite recuperarse (validación, confirmación, deshacer, defaults seguros)." },
  { id: "H8", label: "Carga cognitiva y divulgación progresiva", prompt: "Cuánto esfuerzo mental innecesario exige: decisiones simultáneas, dependencia de memoria, secuenciación. Menos información no es sinónimo de menos carga." },
  { id: "H9", label: "Consistencia y previsibilidad", prompt: "Si objetos y acciones similares se ven y comportan igual, con terminología y patrones consistentes." },
  { id: "H10", label: "Eficiencia y continuidad del flujo de trabajo", prompt: "El esfuerzo para completar trabajo repetido o complejo: pasos innecesarios, interrupciones, atajos, persistencia." },
  { id: "H11", label: "Densidad de información y comprensión", prompt: "Si mucha información puede escanearse, compararse y priorizarse. La densidad no es un problema en sí misma." },
  { id: "H12", label: "Accesibilidad e inclusión", prompt: "Evidencia visible de contraste, legibilidad, tamaño de objetivos táctiles, dependencia del color — solo lo observable en una imagen estática." },
  { id: "H13", label: "Confianza, control y consecuencias", prompt: "Si la persona entiende qué va a pasar, el alcance de su acción, permisos, y consecuencias irreversibles." },
  { id: "H14", label: "Transparencia de IA y control humano", prompt: "Solo aplica si hay IA en la experiencia: si se comunica qué generó la IA, con qué certeza, y si la persona puede editar/rechazar/deshacer lo que la IA hizo." },
];

const EXPERIENCE_MODIFIERS = {
  "Onboarding": { H1: 1, H2: 1, H3: 1, H6: 1, H8: 1, H10: -1, H11: -1 },
  "Tarea / transacción": { H1: 1, H5: 1, H6: 1, H7: 1, H13: 1 },
  "Explorar / encontrar": { H2: 1, H4: 1, H8: 1, H11: 1 },
  "Crear / editar": { H5: 1, H6: 1, H7: 1, H9: 1, H10: 1 },
  "Monitorear / analizar": { H2: 1, H8: 1, H10: 1, H11: 1 },
  "Comunicar / colaborar": { H3: 1, H6: 1, H7: 1, H9: 1, H13: 1 },
  "Administrar / configurar": { H3: 1, H4: 1, H7: 1, H9: 1, H13: 1 },
  "Marketing / convertir": { H1: 1, H2: 1, H3: 1, H5: 1, H13: 1, H6: -1, H10: -1, H11: -1 },
};

const CONSIDERATION_MODIFIERS = {
  "Tarea compleja": { H3: 1, H6: 1, H7: 1, H8: 1 },
  "Alta densidad": { H2: 1, H10: 1, H11: 2 },
  "Alto riesgo": { H6: 1, H7: 2, H12: 1, H13: 2 },
  "IA asistida": { H6: 1, H7: 1, H13: 1 }, // H14 se fuerza a 4 aparte, no suma acá
  "Multilenguaje": { H3: 1, H8: 1, H12: 1 },
  "Accesibilidad": { H12: 2 },
  "Uso experto": { H9: 1, H10: 2, H11: 1, H8: -1 },
};

const HEURISTIC_WEIGHT_LABELS = { 1: "Secundario", 2: "Importante", 3: "Muy importante", 4: "Crítico" };

function computeHeuristicWeights(experienceType, considerations) {
  const weights = {};
  HEURISTICS.forEach((h) => { weights[h.id] = 2; });
  const expMod = EXPERIENCE_MODIFIERS[experienceType] || {};
  Object.entries(expMod).forEach(([id, delta]) => { weights[id] += delta; });
  (considerations || []).forEach((tag) => {
    const mod = CONSIDERATION_MODIFIERS[tag] || {};
    Object.entries(mod).forEach(([id, delta]) => { weights[id] += delta; });
  });
  const aiAssisted = (considerations || []).includes("IA asistida");
  if (aiAssisted) weights.H14 = 4;
  Object.keys(weights).forEach((id) => { weights[id] = Math.min(4, Math.max(1, weights[id])); });
  return { weights, aiAssisted };
}

// Perfil de pesos formateado como texto para inyectar en el prompt — mismo
// patrón que formatMatchedCriteria/formatPastCritiques/formatExternalReferences:
// se calcula acá en JS con datos reales (no se le pide a la IA que "calcule"
// nada) y se le manda ya resuelto y ordenado de más a menos importante.
function formatHeuristicProfile(experienceType, considerations) {
  if (!experienceType && !(considerations || []).length) return "";
  const { weights, aiAssisted } = computeHeuristicWeights(experienceType, considerations);
  const relevant = HEURISTICS.filter((h) => h.id !== "H14" || aiAssisted);
  const sorted = [...relevant].sort((a, b) => weights[b.id] - weights[a.id]);
  const lines = sorted.map(
    (h) => `- ${h.id} (${h.label}) → peso ${weights[h.id]}/4 · ${HEURISTIC_WEIGHT_LABELS[weights[h.id]]}: ${h.prompt}`
  );
  return `\n\nPERFIL DE PESOS HEURÍSTICOS PARA ESTA PANTALLA (calculado a partir del tipo de experiencia y las consideraciones elegidas al subir la captura — está resuelto, no lo recalcules):
Tipo de experiencia: ${experienceType || "no especificado"}. Consideraciones: ${considerations?.length ? considerations.join(", ") : "ninguna"}.
${lines.join("\n")}

Cómo usarlo: los heurísticos en peso 4 (Crítico) son los que más importan en este contexto puntual — priorizalos al elegir qué hallazgos surfacear, y tratalos con mayor severidad si encontrás un problema ahí. Los de peso 1 (Secundario) siguen aplicando, pero no deberían dominar la lista si hay problemas de mayor peso disponibles. Completá "heuristic" en cada hallazgo/win con el código (ej. "H7") de la heurística más relevante de esta lista. Si "H14" no aparece es porque no se marcó "IA asistida" — no evalúes transparencia de IA en ese caso.`;
}

const RUBRIC_PROMPT = `Actúa como una persona evaluadora senior de diseño de producto. Tu objetivo principal es la reducción de fricción cognitiva. Evaluás primero la estructura funcional y el modelo mental de la persona usuaria. Solo después de eso emitís juicio sobre la ejecución de la dirección de arte. Nunca justifiques un patrón de baja usabilidad argumentando innovación estética — la belleza visual no compensa una falla estructural.

DISCIPLINA DE OBSERVABILIDAD (crítica): estás viendo una única imagen estática. Nunca afirmes como hecho algo que solo podría confirmarse con interacción, analítica o datos de producto (ej. "esto aumenta el abandono", "esto confunde a los usuarios", "el foco de teclado funciona mal"). Si el problema requiere interacción para confirmarse, marcá ese hallazgo con "type": "hipotesis" y completá "validationNeeded" explicando qué habría que observar (inspección interactiva, árbol de accesibilidad, datos de embudo, test con usuarios). Lo que sí podés afirmar directamente son cosas visibles en la imagen: jerarquía, contraste aproximado, texto visible, densidad, recorte, ausencia de un elemento esperado.

Analizás la imagen de una interfaz y devolvés EXCLUSIVAMENTE un objeto JSON válido, sin texto adicional, sin markdown, sin backticks, con esta forma exacta:

{
  "summary": "1-2 frases con la primera impresión general, en español",
  "blocks": {
    "usability": <entero 0-50>,
    "consistency": <entero 0-30>,
    "artDirection": <entero 0-20>
  },
  "criticalFailReason": "si usability quedó por debajo de 30/50, explicá en máximo 20 palabras por qué; si no, string vacío",
  "findings": [
    {
      "block": "A" | "B" | "C",
      "category": "Jerarquía visual" | "Consistencia y sistema de diseño" | "Tipografía" | "Color y contraste" | "Espaciado y alineación" | "Componentes y affordance" | "Copy y microcopy" | "Accesibilidad" | "Claridad del propósito" | "Patrones oscuros",
      "type": "violacion" | "riesgo" | "hipotesis" | "convencion" | "preferencia",
      "heuristic": "el código (ej. \"H7\") de la heurística más relevante de las 14 listadas en PERFIL DE PESOS HEURÍSTICOS, si esa sección aparece en tu contexto; si no aparece, string vacío",
      "severity": "menor" | "moderada" | "mayor" | "bloqueante",
      "confidence": "alta" | "media" | "baja",
      "principle": "el principio, componente o marco específico en el que se basa este hallazgo",
      "issue": "qué está mal, específico y observable en la imagen, máximo 18 palabras",
      "recommendation": "qué cambiar, concreto y accionable, máximo 18 palabras",
      "validationNeeded": "solo si type es hipotesis: qué evidencia adicional se necesita, si no string vacío",
      "anchor": { "x": <entero 0-100>, "y": <entero 0-100> } | null
    }
  ],
  "wins": [
    {
      "category": "Jerarquía visual" | "Consistencia y sistema de diseño" | "Tipografía" | "Color y contraste" | "Espaciado y alineación" | "Componentes y affordance" | "Copy y microcopy" | "Accesibilidad" | "Claridad del propósito" | "Patrones oscuros",
      "heuristic": "el código (ej. \"H9\") de la heurística más relevante, igual criterio que en findings; si no aplica, string vacío",
      "principle": "el principio, componente o marco específico que esta pantalla cumple bien",
      "description": "qué está bien hecho, específico y observable en la imagen, máximo 18 palabras",
      "confidence": "alta" | "media" | "baja",
      "anchor": { "x": <entero 0-100>, "y": <entero 0-100> } | null
    }
  ]
}

Qué significa cada "type" (tomalo en serio, no lo uses decorativamente):
- "violacion" → contradice un criterio normativo claro (ej. WCAG AA, comportamiento de teclado definido por ARIA APG).
- "riesgo" → evidencia empírica o de investigación aplicada sugiere un problema, pero no es una regla absoluta (ej. Baymard, estudios de aesthetics-usability).
- "convencion" → se aparta de una convención madura de plataforma/design system, no de una regla universal (ej. Apple HIG, GOV.UK, Fluent 2).
- "hipotesis" → tu sospecha razonable, pero requiere interacción/datos para confirmarse.
- "preferencia" → es gusto/dirección de arte, no un problema funcional — nunca lo mezcles con Bloque A.

Qué significa cada "severity" (mide impacto si el hallazgo es real, es independiente del "type"):
- "menor" → fricción cosmética o de pulido; no impide ni retrasa la tarea.
- "moderada" → genera confusión, esfuerzo extra o duda, pero la persona puede resolverlo sola.
- "mayor" → probablemente causa error, abandono parcial o pérdida de confianza en un flujo importante.
- "bloqueante" → impide completar la tarea, causa pérdida de datos, o una acción irreversible sin confirmación adecuada. Usalo con criterio estricto: no es "el hallazgo más grave de la lista", es "literalmente no se puede seguir" o "riesgo alto de daño real".

"confidence" es tu certeza de que la observación Y su aplicación del criterio son correctas — es independiente de "severity" (que mide impacto si el hallazgo es real).

"anchor" ubica el hallazgo (o el acierto) sobre un punto concreto de la imagen, en porcentaje del ancho ("x") y alto ("y") de la captura, con (0,0) en la esquina superior izquierda. Usalo SOLO cuando el hallazgo se refiere a un elemento puntual y señalable con el dedo (un botón, un ícono, un bloque de texto, una tarjeta específica) — estimá el centro aproximado de ese elemento. Si el hallazgo es sobre la pantalla en general, un patrón que se repite en varios lugares, o algo no puntual (jerarquía general, tono del copy en conjunto, consistencia del sistema), usá "anchor": null — no inventes una coordenada solo para llenar el campo.

"wins" es la contraparte positiva de "findings": entre 2 y 4 aciertos reales de la pantalla, fundamentados en los mismos marcos que arriba (citá el "principle" igual que en un hallazgo). Un win debe ser específico y observable, nunca relleno genérico como "buen diseño" o "se ve limpio" — decí qué decisión concreta está bien resuelta y por qué (ej. "el CTA principal usa el color de mayor contraste de la pantalla, siguiendo jerarquía de Refactoring UI"). Si la pantalla no tiene aciertos claros y específicos, es preferible devolver menos de 2 wins (incluso 0) antes que inventar uno.

Los tres bloques de puntuación (escala 0-100 total):
- Bloque A — Usabilidad y Arquitectura Funcional (0-50 puntos): cumplimiento de heurísticas de Nielsen, accesibilidad (contraste, áreas de toque), prevención de errores, affordance claro, claridad del propósito.
- Bloque B — Consistencia Sistémica y Lógica de Producto (0-30 puntos): reutilización correcta de patrones, jerarquía de información coherente, consistencia con el sistema de diseño de la plataforma.
- Bloque C — Dirección de Arte y Refinamiento (0-20 puntos): espacio negativo, emparejamiento tipográfico, color con propósito, micro-interacciones que suman deleite sin fricción.

Regla estricta: si "usability" queda por debajo de 30/50, es un fallo crítico sin importar qué tan bien ejecutada esté la interfaz visualmente — completá "criticalFailReason" en ese caso.

Cada hallazgo debe fundamentarse en uno de estos marcos (citá el nombre corto en "principle", ej. "Ley de Fitts", "WCAG 2.2 AA — contraste", "ARIA APG — dialog"):
- Jerarquía visual → Gestalt (proximidad, región común, similitud), Refactoring UI (peso visual), Ley de Fitts.
- Consistencia y sistema de diseño → Heurística de Nielsen #4, Ley de Jakob, Apple HIG / Material Design 3 / Fluent, IBM Carbon Design System (para interfaces empresariales o de alta densidad de datos), ISO 9241-210 (proceso centrado en el usuario).
- Tipografía → Refactoring UI, Butterick's Practical Typography / Thinking with Type.
- Color y contraste → WCAG 2.2 AA (4.5:1 texto normal, 3:1 texto grande) cuenta como Bloque A; uso armónico o expresivo del color cuenta como Bloque C.
- Espaciado y alineación → Gestalt (proximidad), sistemas de espaciado de Refactoring UI.
- Componentes y affordance → Heurística de Nielsen #1 y #6, Don Norman (affordances/signifiers), Fitts/WCAG (objetivos táctiles mínimo 44x44px), IBM Carbon (tablas/notificaciones de alta densidad), más los criterios específicos de componente que se te pasen en "CRITERIOS APLICABLES A ESTA PANTALLA" más abajo, cuando existan.
- Copy y microcopy → Heurística de Nielsen #2, Steve Krug (Don't Make Me Think), voz activa y mensajes de error específicos, Shopify Polaris (voz y tono, estados de error/vacío), GOV.UK (lenguaje claro).
- Accesibilidad → WCAG 2.2 AA completo en lo observable desde una imagen estática, ARIA APG (semántica y foco, cuando sea inferible visualmente).
- Claridad del propósito → Heurística de Nielsen #1 y #6, Ley de Hick (exceso de opciones), Baymard Institute (fricción conocida en flujos de e-commerce/checkout, cuando aplique), Shopify Polaris (confianza en flujos transaccionales).
- Patrones oscuros → Harry Brignull / deceptive.design (confirmshaming, interferencia visual, trick questions, publicidad disfrazada, roach motel, forced continuity, urgencia artificial, prueba social fabricada, privacy Zuckering), reporte de la FTC "Bringing Dark Patterns to Light" (casos reales de aplicación regulatoria), WCAG 2.2 1.4.1 (cuando el patrón se apoya solo en color). Usalo solo cuando el patrón sea observable en la imagen estática (peso visual, presencia/ausencia de etiqueta, contraste) — nunca afirmes manipulación basada en comportamiento a lo largo del tiempo (ej. nagging) que una sola captura no puede mostrar.
- Transversal, si corresponde: Efecto Zeigarnik (progreso en flujos multi-paso), Ley de Miller (sobrecarga por exceso de elementos simultáneos).

Si en tu mensaje de usuario aparece una sección "CRITERIOS APLICABLES A ESTA PANTALLA", son reglas específicas recuperadas de una base de criterios (con su propia fuente y nivel de confianza) porque matchean el tipo de pantalla/componentes detectados. Priorizalas por sobre generalidades cuando apliquen — vienen con evidencia más específica que las heurísticas genéricas. Si esa sección no aparece o viene vacía, evaluá solo con los marcos generales de arriba.

Anti-patrones que tenés terminantemente prohibido cometer:
- No digas "la mayoría de las apps hacen X, por lo tanto X es correcto" (prevalencia no es calidad).
- No digas "Apple/Material dice X, por lo tanto todo producto debe hacer X" (convención de plataforma no es ley universal).
- No confundas "poco convencional" con "inutilizable" (moralismo estético).
- No inventes comportamiento de teclado, tiempos de respuesta, datos de embudo o comprensión del usuario a partir de una sola imagen.
- No des una solución ("hacé el botón azul") sin antes establecer el problema y su evidencia.
- No uses relleno genérico ("mejorá la jerarquía", "agregá más espacio en blanco", "hacelo más intuitivo") sin un objetivo concreto y un criterio citado.
- No afirmes causalidad de negocio ("esto va a aumentar la conversión") sin evidencia de producto real.
- No reduzcas accesibilidad solo a contraste de color.
- No cites una "ley" popular de UX como si fuera verdad establecida sin que tengas razones para confiar en ella.

Si se te da un tipo de experiencia, ajustá el peso de tu evaluación (elegí uno solo, es la tarea principal de la persona en esta pantalla):
- "Onboarding" → priorizá progreso visible y baja carga inicial (Efecto Zeigarnik).
- "Tarea / transacción" → priorizá prevención de errores y confianza por sobre creatividad visual; sé más estricto en Bloque A.
- "Explorar / encontrar" → Bloque C tiene más margen; la exploración tolera más riesgo estético.
- "Crear / editar" → priorizá prevención de pérdida de datos, claridad del estado guardado/no guardado, y affordance de las herramientas de edición disponibles.
- "Monitorear / analizar" → evaluá contra patrones de IBM Carbon y la sección de Data tables de la biblioteca de componentes; priorizá legibilidad de datos densos por sobre decoración.
- "Comunicar / colaborar" → priorizá claridad de quién ve/recibe qué y de acciones irreversibles (enviar, borrar, compartir de más).
- "Administrar / configurar" → priorizá claridad de las consecuencias de cada opción, agrupación lógica de configuraciones, y prevención de cambios accidentales de alto impacto.
- "Marketing / convertir" → Bloque C pesa más en la impresión general, pero Bloque A sigue siendo innegociable.

Si además se te dan una o más consideraciones (pueden combinarse entre sí y con cualquier tipo de experiencia), sumalas a lo anterior:
- "Tarea compleja" → priorizá Ley de Miller y agrupación Gestalt; penalizá exceso de elementos simultáneos.
- "Alta densidad" → evaluá contra patrones de IBM Carbon y la sección de Data tables de la biblioteca de componentes.
- "Alto riesgo" → subí el estándar de Bloque A al nivel de un flujo transaccional aunque el tipo de experiencia sea otro: prevención de errores y confirmaciones antes de acciones irreversibles no son negociables.
- "IA asistida" → priorizá que quede clara la frontera entre lo que generó la IA y lo que hizo la persona, y que exista forma visible de corregir o rechazar la sugerencia de la IA; seguí sin afirmar nada sobre el comportamiento real del modelo que no sea observable en la imagen.
- "Multilenguaje" → prestá atención a truncamiento de texto, etiquetas cortadas o layouts que no tolerarían una traducción más larga, si es observable en la imagen.
- "Accesibilidad" → subí el estándar del bloque de Accesibilidad por sobre el resto; seguí marcando como hipótesis lo que no sea verificable desde una imagen estática (foco de teclado, lector de pantalla, etc.).
- "Uso experto" → tolerá más densidad y atajos si sirven a una persona usuaria frecuente; no penalices patrones poco amigables para un principiante si el contexto es explícitamente de uso experto/power-user.

Reglas generales:
- Entre 3 y 7 hallazgos, ni relleno ni recorte artificial: si la pantalla da para menos de 3 hallazgos genuinos, devolvé menos; nunca inventes uno débil solo para llegar al mínimo.
- Ordená "findings" de mayor a menor prioridad real. La prioridad de un hallazgo es la combinación de tres factores: qué tan crítica es la heurística que toca en el perfil de pesos (si ese perfil está en tu contexto), qué tan alta es su "severity", y qué tan alta es tu "confidence". Un hallazgo "bloqueante" con heurística en peso 4 y confianza alta va primero; uno "menor" con heurística en peso 1 y confianza baja va al final. No expliques este cálculo en la respuesta, solo aplicalo al ordenar.
- Entre 2 y 4 wins, solo si son genuinos y específicos (ver criterio de "wins" arriba).
- No repitas el mismo hallazgo en categorías distintas.
- Si una categoría no aplica o no se puede evaluar por la imagen dada, no la incluyas.
- Sé específico: mencioná elementos concretos visibles (botones, textos, colores, posiciones) en vez de generalidades. Un hallazgo que podría pegarse sin cambios a cualquier otra pantalla del mismo tipo ("mejorá la jerarquía visual", "simplificá el flujo") no es un hallazgo válido — si no podés señalar el elemento exacto y la evidencia exacta, no lo incluyas.
- No confundas preferencia estética propia con problema funcional: una decisión de diseño que no seguís vos personalmente pero que es consistente, accesible y no genera confusión real no es un hallazgo — como mucho es "preferencia" y nunca va en Bloque A.
- Completá "anchor" solo para hallazgos y wins puntuales y señalables; usá null para todo lo que sea general o esté disperso en la pantalla.
- Respondé en español, en tono directo y profesional, sin adornos.
- No incluyas nada fuera del objeto JSON.`;

// Prompt de crítica a nivel FLUJO (journey) — Fase 2 de la arquitectura de
// journeys. A diferencia de RUBRIC_PROMPT (una pantalla sola), acá se le
// pasan las N imágenes del flujo juntas, en orden, y se le pide EXPLÍCITAMENTE
// que ignore lo que ya se evalúa pantalla por pantalla (eso ya existe, cada
// pantalla tiene su propio critique completo) y se concentre en lo que solo
// es visible comparando pantallas entre sí: consistencia, progreso,
// continuidad de contexto, redundancia de pasos. Sin "anchor" (no tiene
// sentido señalar un punto x/y cuando el hallazgo es sobre la relación entre
// varias imágenes) — en su lugar, "steps" indica qué pasos (1-indexados)
// están involucrados.
const JOURNEY_RUBRIC_PROMPT = `Actúa como una persona evaluadora senior de diseño de producto, especializada en analizar FLUJOS completos (varias pantallas en secuencia), no pantallas sueltas. Cada pantalla del flujo que se te muestra ya tiene su propia crítica individual completa — tu trabajo NO es repetir eso. Tu trabajo es evaluar exclusivamente lo que solo se puede ver comparando las pantallas entre sí: consistencia, continuidad, progreso, redundancia, y coherencia narrativa del flujo como conjunto.

Te llegan las imágenes en el orden real del flujo (paso 1, paso 2, etc.), seguidas de una lista con el título de cada paso.

DISCIPLINA DE OBSERVABILIDAD (crítica, igual que para una pantalla sola): solo podés afirmar como hecho lo que es visible comparando las imágenes entre sí. Nunca afirmes tiempos de carga, tasas de abandono, o comprensión real de la persona usuaria — eso requiere datos de producto, no imágenes. Si tu sospecha requiere interacción o datos para confirmarse, marcala con "type": "hipotesis".

Analizás el flujo y devolvés EXCLUSIVAMENTE un objeto JSON válido, sin texto adicional, sin markdown, sin backticks, con esta forma exacta:

{
  "summary": "1-2 frases con la impresión general del flujo COMO CONJUNTO (no de una pantalla individual), en español",
  "findings": [
    {
      "category": "Jerarquía visual" | "Consistencia y sistema de diseño" | "Tipografía" | "Color y contraste" | "Espaciado y alineación" | "Componentes y affordance" | "Copy y microcopy" | "Accesibilidad" | "Claridad del propósito" | "Patrones oscuros",
      "type": "violacion" | "riesgo" | "hipotesis" | "convencion" | "preferencia",
      "severity": "menor" | "moderada" | "mayor" | "bloqueante",
      "confidence": "alta" | "media" | "baja",
      "principle": "el principio o marco específico en el que se basa este hallazgo",
      "issue": "qué está mal ENTRE pantallas, específico y observable, máximo 22 palabras",
      "recommendation": "qué cambiar, concreto y accionable, máximo 18 palabras",
      "steps": [<enteros 1-indexados de los pasos involucrados, ej. [1,3] si el problema es entre el paso 1 y el paso 3; array vacío si aplica al flujo entero>]
    }
  ],
  "wins": [
    {
      "category": "igual lista que arriba",
      "principle": "qué principio o marco cumple bien el flujo",
      "description": "qué está bien resuelto ENTRE pantallas, específico, máximo 18 palabras",
      "confidence": "alta" | "media" | "baja",
      "steps": [<enteros 1-indexados>]
    }
  ]
}

Qué SÍ es un hallazgo de flujo (esto es lo único que te interesa acá):
- Consistencia: un mismo componente, patrón, ícono o término cambia de forma o de nombre entre pasos sin razón (ej. el botón de "Continuar" se llama distinto en cada paso, o un mismo dato se muestra con formato distinto).
- Progreso: el flujo no deja claro en qué paso está la persona ni cuántos faltan (Efecto Zeigarnik) — o al revés, lo hace bien y eso es un win.
- Continuidad de contexto: información que la persona ya dio en un paso anterior se pierde, se pide de nuevo, o no se refleja en un paso posterior donde debería aparecer.
- Redundancia: dos pasos consecutivos piden esencialmente lo mismo, o un paso podría eliminarse sin perder información necesaria.
- Orden: el orden de los pasos no sigue una progresión lógica esperada para este tipo de flujo.
- Recuperación de errores: un error mostrado en un paso no tiene continuidad clara en el paso siguiente (ej. desaparece sin resolución visible).
- Tono y voz: el copy cambia de tono o de nivel de formalidad entre pasos sin razón.
- Entrada y salida: no queda claro cómo se llega al flujo ni qué pasa al completarlo (pantalla de cierre/confirmación ausente o inconsistente con el resto).

Qué NO es un hallazgo de flujo (no lo incluyas, ya está cubierto en la crítica de cada pantalla individual):
- Problemas de una sola pantalla que no dependen de compararla con otra (contraste, tipografía, espaciado dentro de un mismo paso, etc.) — si el problema se ve con solo mirar una imagen, no es un hallazgo de flujo.

Reglas generales (mismo criterio que para una pantalla sola):
- Entre 2 y 6 hallazgos de flujo genuinos — ninguno inventado solo para llenar un mínimo.
- Entre 1 y 3 wins genuinos.
- Ordená "findings" de mayor a menor severity × confidence.
- Sé específico: nombrá el paso ("paso 2") y el elemento concreto, nunca generalidades tipo "el flujo podría ser más consistente".
- Respondé en español, en tono directo y profesional, sin adornos.
- No incluyas nada fuera del objeto JSON.`;

// Escala de severidad v1.13 (4 niveles, con "bloqueante" como techo — se
// alinea con el concepto de "blockers" que va a usar el Review Summary más
// adelante). Colores restringidos a texto+borde salvo "bloqueante", que sí
// lleva relleno a propósito: es la única severidad que necesita saltar a la
// vista por sobre el resto de la interfaz clara.
const SEVERITY_STYLES = {
  menor: { bg: "transparent", fg: "var(--sev-menor)", border: "rgba(107, 114, 128, 0.3)", label: "Menor" },
  moderada: { bg: "transparent", fg: "var(--sev-moderada)", border: "rgba(138, 90, 18, 0.32)", label: "Moderada" },
  mayor: { bg: "transparent", fg: "var(--sev-mayor)", border: "rgba(179, 38, 30, 0.35)", label: "Mayor" },
  bloqueante: { bg: "var(--danger)", fg: "#ffffff", border: "var(--danger)", label: "Bloqueante" },
  // Alias de compatibilidad: críticas guardadas antes de v1.13 usaban esta
  // escala vieja de 3 niveles (alta/media/baja) — se siguen mostrando bien,
  // no se reescriben retroactivamente.
  alta: { bg: "transparent", fg: "var(--sev-mayor)", border: "rgba(179, 38, 30, 0.35)", label: "Alta" },
  media: { bg: "transparent", fg: "var(--sev-moderada)", border: "rgba(138, 90, 18, 0.32)", label: "Media" },
  baja: { bg: "transparent", fg: "var(--sev-menor)", border: "rgba(107, 114, 128, 0.3)", label: "Baja" },
};

const CRITERIA_SECTIONS = [
  {
    title: "Jerarquía visual",
    sources: ["Gestalt (proximidad, región común, similitud)", "Refactoring UI — peso visual", "Ley de Fitts"],
  },
  {
    title: "Consistencia y sistema de diseño",
    sources: ["Heurística de Nielsen #4", "Ley de Jakob", "Apple HIG / Material Design 3 / Fluent", "IBM Carbon Design System (enterprise / alta densidad de datos)"],
  },
  {
    title: "Tipografía",
    sources: ["Refactoring UI", "Butterick's Practical Typography", "Thinking with Type — Lupton"],
  },
  {
    title: "Color y contraste",
    sources: ["WCAG 2.2 AA (4.5:1 texto normal, 3:1 texto grande)", "Roles de color de Material Design"],
  },
  {
    title: "Espaciado y alineación",
    sources: ["Gestalt — ley de proximidad", "Sistemas de espaciado de Refactoring UI"],
  },
  {
    title: "Componentes y affordance",
    sources: ["Heurísticas de Nielsen #1 y #6", "Don Norman — affordances y signifiers (DOET)", "Fitts/WCAG — objetivos táctiles mínimo 44×44px", "IBM Carbon — patrones para tablas, notificaciones y datos densos"],
  },
  {
    title: "Copy y microcopy",
    sources: ["Heurística de Nielsen #2", "Steve Krug — Don't Make Me Think", "Voz activa, errores específicos", "Shopify Polaris — voz y tono, estados de error/vacío"],
  },
  {
    title: "Accesibilidad",
    sources: ["WCAG 2.2 AA completo (lo observable en una imagen estática)"],
  },
  {
    title: "Claridad del propósito",
    sources: ["Heurísticas de Nielsen #1 y #6", "Ley de Hick", "Baymard Institute — fricción en flujos de e-commerce", "Shopify Polaris — confianza y claridad en flujos transaccionales"],
  },
  {
    title: "Patrones oscuros",
    sources: ["Harry Brignull — deceptive.design (taxonomía de dark patterns)", "FTC — \"Bringing Dark Patterns to Light\" (2022)", "WCAG 2.2 — 1.4.1 uso del color como único indicador"],
  },
];

const CRITERIA_CROSS_CUTTING = [
  "Efecto Zeigarnik — progreso visible en flujos multi-paso",
  "Ley de Miller (7±2) — sobrecarga por exceso de elementos simultáneos",
];

function computeScore(critique) {
  if (!critique) return { total: null, criticalFail: false, hasBlocks: false };
  if (critique.blocks) {
    const usability = Number(critique.blocks.usability) || 0;
    const consistency = Number(critique.blocks.consistency) || 0;
    const artDirection = Number(critique.blocks.artDirection) || 0;
    return {
      total: usability + consistency + artDirection,
      criticalFail: usability < 30,
      hasBlocks: true,
      usability,
      consistency,
      artDirection,
    };
  }
  if (typeof critique.overallScore === "number") {
    return { total: null, criticalFail: false, hasBlocks: false, legacyScore: critique.overallScore };
  }
  return { total: null, criticalFail: false, hasBlocks: false };
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

// Dispara la descarga de un archivo de texto en el navegador — sin backend,
// solo Blob + un <a download> temporal.
function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  downloadBlob(filename, blob);
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Arma el export de la skill (v1, uso interno — ver "Un paso más adelante" en
// el modal). Empaqueta lo que vive fijo en el prompt (RUBRIC_PROMPT,
// taxonomía, severidad, heurísticas) MÁS la base de criterios completa
// (categoría 1) — a pedido explícito: la base curada tiene que estar
// SIEMPRE adentro de la skill, nunca ser un "se supone que la usa" sin
// poder verificarlo. `criteriaRecords` es la lista real ya cargada (no un
// conteo) para poder listarla entera acá abajo, agrupada por dimensión.
function buildSkillMarkdown({ corpusCount, latestApproved, criteriaRecords, clientMaterialNote, designTokens }) {
  const generatedAt = formatDate(Date.now());
  const latestBlock = latestApproved
    ? `"${latestApproved.title || "sin título"}" — aprobado por ${latestApproved.reviewedBy || "el equipo"} el ${formatDate(latestApproved.reviewedAt)}`
    : "todavía no hay críticas aprobadas en el corpus propio";

  const severityLines = ["menor", "moderada", "mayor", "bloqueante"]
    .map((k) => `- **${SEVERITY_STYLES[k].label}**`)
    .join("\n");

  const heuristicLines = HEURISTICS
    .map((h) => `- **${h.id} — ${h.label}:** ${h.prompt}`)
    .join("\n");

  const criteriaCount = criteriaRecords.length;
  const isComplete = criteriaCount === EXPECTED_CRITERIA_COUNT;
  const completenessLine = isComplete
    ? `✅ Completa: ${criteriaCount}/${EXPECTED_CRITERIA_COUNT} criterios.`
    : `⚠️ INCOMPLETA: solo ${criteriaCount} de ${EXPECTED_CRITERIA_COUNT} criterios esperados cargaron al generar este export. No tratar como la base completa — recargar y volver a exportar.`;

  const byDimension = {};
  criteriaRecords.forEach((c) => { (byDimension[c.dimension] ||= []).push(c); });
  const criteriaLines = Object.entries(byDimension)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dimension, items]) => {
      const rows = items
        .map((c) => `- ${c.statement} _(${c.principle}${c.evidenceTier ? `, evidencia ${c.evidenceTier}` : ""})_`)
        .join("\n");
      return `### ${dimension} (${items.length})\n\n${rows}`;
    })
    .join("\n\n");

  // Si se adjuntó material del cliente (design system, docs extra), no vive
  // dentro de este markdown — se descarga como archivo aparte, con su
  // nombre original, junto a este .md. Cada archivo tiene un rol (material
  // general / composición de referencia / logo) elegido a mano al
  // adjuntarlo, y cada rol arma su propia sección con su propia instrucción
  // — el rol es lo que determina cómo debe tratarse el archivo, no solo que
  // "está ahí".
  const clientMaterialSection = clientMaterialNote
    ? [
        clientMaterialNote.generalFiles.length || clientMaterialNote.hasNotes
          ? `\n\n## Material del cliente (descargado junto a este archivo)\n\n` +
            `Este export vino acompañado de material específico del cliente, descargado por separado junto a este .md —\n` +
            `no es parte de la base curada general, es contexto puntual para este proyecto. Priorizalo por sobre las\n` +
            `convenciones genéricas de este documento cuando haya conflicto directo (por ejemplo: el design system del\n` +
            `cliente define su propio radio de borde o su propia escala tipográfica).\n\n` +
            clientMaterialNote.generalFiles.map((n) => `- ${n}`).join("\n") +
            (clientMaterialNote.generalFiles.length ? "\n" : "") +
            (clientMaterialNote.hasNotes ? `- notas-cliente.txt (notas adicionales escritas a mano)\n` : "")
          : "",
        clientMaterialNote.compositionFiles.length
          ? `\n\n## Composiciones de referencia del cliente (pantallas reales, descargadas junto a este archivo)\n\n` +
            `Estas son pantallas reales del producto del cliente hoy — ${clientMaterialNote.compositionFiles.map((n) => `\`${n}\``).join(", ")}.\n` +
            `Sirven para calibrar densidad, tono visual y patrones ya existentes del cliente — NO son una plantilla para\n` +
            `copiar 1:1.\n\n` +
            `**Jerarquía de autoridad, en caso de conflicto:**\n` +
            `1. Los criterios y reglas de este documento (arriba) siguen ganando por sobre lo que se ve en estas\n` +
            `   pantallas — si el cliente ya tiene un patrón que viola un criterio de la base de documentación, no se\n` +
            `   copia ese patrón solo porque "así lo tienen hoy".\n` +
            `2. Como referencia visual (estilo, densidad, tono, componentes reales), estas composiciones pesan MÁS que\n` +
            `   cualquier pantalla del corpus propio de críticas aprobadas (categoría 3) — son evidencia directa del\n` +
            `   producto actual de este cliente puntual, no un ejemplo genérico de otro proyecto.\n`
          : "",
        clientMaterialNote.logoFiles.length
          ? `\n\n## Logo del cliente\n\n` +
            `${clientMaterialNote.logoFiles.map((n) => `\`${n}\``).join(", ")} — es el logo real del cliente, descargado junto a este archivo. Usalo\n` +
            `tal cual donde haga falta un logo: no lo rediseñes, no generes una versión nueva ni una aproximación. Si\n` +
            `hace falta el color de marca exacto, sacalo de este archivo (se puede correr "Analizar con IA" sobre él\n` +
            `para obtener ese token de color) — pesa más que cualquier color inferido de una pantalla del corpus\n` +
            `propio de críticas.\n`
          : "",
      ].join("")
    : "";

  const tokensSection = designTokens ? buildTokensMarkdownSection(designTokens) : "";

  return `# With Taste — Skill de criterio (export interno)

**Versión:** ${CRITERIA_VERSION}
**Generado:** ${generatedAt}
**Último cambio de versión:** ${CRITERIA_LATEST_CHANGE}
**Último aporte al corpus propio:** ${latestBlock}
**Cobertura de la base de documentación:** ${completenessLine}
**Corpus propio:** ${corpusCount} críticas propias aprobadas (categoría 3)

> ⚠️ Uso interno de With Taste. Este documento no está pensado para salir del
> equipo todavía — es un export de trabajo, no la versión final que se
> distribuirá a builders externos (esa va a servirse desde un servicio propio,
> no como archivo suelto). No reenviar ni pegar en herramientas externas.

## Cómo pensar el criterio

${RUBRIC_PROMPT}

## Taxonomía de contexto

**Tipo de experiencia (se elige 1):** ${EXPERIENCE_TYPES.join(", ")}

**Consideraciones (opcional, varias):** ${CONSIDERATIONS.join(", ")}

## Severidad

${severityLines}

## Heurísticas (perfil de pesos contextual)

${heuristicLines}

## Base de criterios de documentación (categoría 1 — ${criteriaCount} registros)

Estos son los criterios curados reales, tal como se usan hoy en el matcheo por
tags antes de cada crítica — no un resumen ni una muestra.

${criteriaLines}
${clientMaterialSection}${tokensSection}`;
}

function resizeImageFile(file, maxWidth = 1100, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({ dataUrl, base64: dataUrl.split(",")[1] });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const TYPE_STYLES = {
  violacion: { label: "Incumplimiento", bg: "transparent", fg: "var(--type-violacion)", border: "rgba(179, 38, 30, 0.35)" },
  riesgo: { label: "Riesgo", bg: "transparent", fg: "var(--type-riesgo)", border: "rgba(138, 90, 18, 0.32)" },
  hipotesis: { label: "Hipótesis", bg: "transparent", fg: "var(--type-hipotesis)", border: "rgba(91, 78, 134, 0.32)" },
  convencion: { label: "Convención", bg: "transparent", fg: "var(--type-convencion)", border: "rgba(31, 107, 74, 0.32)" },
  preferencia: { label: "Preferencia", bg: "transparent", fg: "var(--type-preferencia)", border: "rgba(107, 114, 128, 0.3)" },
};

function TypeTag({ type }) {
  const s = TYPE_STYLES[type];
  if (!s) return null;
  return <span className="type-tag" style={{ background: s.bg, color: s.fg, borderColor: s.border }}>{s.label}</span>;
}

// Muestra qué heurística (de las 14) el hallazgo/win dice tocar — solo
// informativo, no afecta severidad ni orden. Se oculta sola si el registro
// es de antes de v1.13 (no tiene "heuristic") o si el código no matchea
// ninguna heurística conocida.
function HeuristicTag({ id }) {
  const h = HEURISTICS.find((x) => x.id === id);
  if (!h) return null;
  return <span className="heuristic-tag" title={h.prompt}>{h.id} · {h.label}</span>;
}

function StatusStamp({ status, size = "md" }) {
  const cfg = {
    approved: { text: "APROBADO", color: "var(--success)" },
    rejected: { text: "RECHAZADO", color: "var(--danger)" },
    pending: { text: "PENDIENTE", color: "var(--ink-faint)" },
  }[status] || { text: "PENDIENTE", color: "var(--ink-faint)" };
  return (
    <span
      className={`stamp stamp-${size}`}
      style={{ color: cfg.color, borderColor: cfg.color }}
    >
      {cfg.text}
    </span>
  );
}

function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.moderada;
  const isBlocker = severity === "bloqueante";
  return (
    <span
      className={`severity-badge ${isBlocker ? "is-blocker" : ""}`}
      style={{ background: isBlocker ? s.fg : "transparent", color: isBlocker ? "#fff" : s.fg, borderColor: s.border }}
    >
      <span className="severity-dot" style={{ background: isBlocker ? "#fff" : "currentColor" }} />
      {s.label}
    </span>
  );
}

// Modal de exportación de la skill (v1, uso interno). Muestra versión, qué
// cambió último, y quién/cuándo fue el último aporte real al corpus propio —
// para que se sienta "vivo" en vez de un archivo muerto que nadie sabe si
// está al día. El botón dispara una descarga local (buildSkillMarkdown +
// downloadTextFile). La descarga en sí no usa backend, pero el análisis de
// tokens de marca (más abajo) sí — reusa /api/critique, el mismo proxy
// serverless que ya usa el resto de la app para hablarle a Claude.
function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// --- Normalización de material del cliente a tokens de marca -------------
//
// Cuando alguien adjunta un brandbook/PDF/captura de UI del cliente, no
// alcanza con dejarlo como un archivo suelto — el pedido explícito fue
// convertirlo en tokens reales (color, tipografía, radios, sombras) que un
// builder pueda usar de una. Esto reusa /api/critique (el mismo proxy a
// Claude que ya paga y ya corre el resto de la app) con un prompt distinto,
// nunca inventa nada nuevo del lado del cliente ni agrega backend nuevo.
//
// Reglas de negocio clave, a propósito:
// - Es SIEMPRE opt-in por archivo (botón "Analizar con IA"), nunca
//   automático — cada análisis tiene costo real y no todo archivo lo
//   amerita.
// - El resultado SIEMPRE queda editable antes de bajar la skill — nunca se
//   confía a ciegas en lo que devuelve el modelo para algo tan sensible
//   como los tokens de marca de un cliente real.
// - Solo se analizan PDF/imagen (lo que Claude puede leer directo como
//   documento/imagen) y con un techo de tamaño conservador: la función
//   serverless de Vercel tiene un límite de body de ~4.5MB, y el archivo
//   crudo pesa ~33% más una vez codificado en base64 — 3MB crudos da
//   margen de sobra.
const TOKEN_ANALYZABLE_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);
const TOKEN_ANALYZE_MAX_BYTES = 3 * 1024 * 1024;
const TOKEN_CATEGORIES = ["colors", "typography", "radii", "shadows"];

// Rol que cumple cada archivo adjunto — se elige a mano, no lo adivina la
// IA (adivinar mal cuál archivo "es el logo" es un error tonto y evitable).
// El rol decide en qué sección del skill.md cae y con qué instrucción:
// "composicion" pide explícitamente NO copiar 1:1, "logo" pide usar tal
// cual sin rediseñar.
const CLIENT_FILE_ROLES = [
  { value: "material", label: "Material general" },
  { value: "composicion", label: "Composición / pantalla real" },
  { value: "logo", label: "Logo" },
];

function isTokenAnalyzable(file) {
  return TOKEN_ANALYZABLE_TYPES.has(file.type) && file.size <= TOKEN_ANALYZE_MAX_BYTES;
}

function tokenAnalyzeBlockReason(file) {
  if (!TOKEN_ANALYZABLE_TYPES.has(file.type)) return "Este tipo de archivo no se puede analizar automáticamente todavía — se adjunta tal cual.";
  if (file.size > TOKEN_ANALYZE_MAX_BYTES) return `Pesa más de ${formatBytes(TOKEN_ANALYZE_MAX_BYTES)} — muy pesado para analizar automáticamente por ahora. Se adjunta tal cual.`;
  return "";
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

const TOKEN_EXTRACTION_PROMPT = `Actuás como una persona especialista senior en design systems. Te muestro material de marca de un cliente (brandbook, guía de estilo, captura de una UI ya existente, u otro documento) y tu única tarea es extraer los tokens de diseño para los que haya evidencia directa y visible en ese material — nunca inventás ni completás con una convención genérica un valor que no esté ahí.

Reglas estrictas:
- Si un valor se ve pero no tiene un código explícito (ej. un color sin hex escrito, un tamaño de fuente sin número), estimalo lo más fiel posible a partir de lo que se ve y marcá "confidence": "estimado". Si el valor está escrito literalmente en el material (ej. un swatch con su hex al lado), marcá "confidence": "explicito".
- Si una categoría entera no tiene NINGUNA evidencia en el material, devolvé un array vacío para esa categoría. No rellenes con valores típicos de una UI genérica.
- Los "name" son identificadores cortos en kebab-case, en español, sin tildes (ej. "color-primario", "texto-heading-lg").
- Máximo 8 tokens por categoría — priorizá los que se repiten o se ven más centrales al sistema, no cada variación menor.

Devolvés EXCLUSIVAMENTE un objeto JSON válido, sin texto adicional, sin markdown, sin backticks, con esta forma exacta:

{
  "colors": [ { "name": "kebab-case", "hex": "#RRGGBB", "role": "uso corto (ej. 'acción primaria', 'fondo de superficie')", "confidence": "explicito" | "estimado" } ],
  "typography": [ { "name": "kebab-case", "family": "nombre de la fuente, o 'sans-serif genérica' si no se identifica una específica", "size": "ej. '24px', string vacío si no es legible", "weight": "ej. '600' o 'bold', string vacío si no es legible", "usage": "uso corto (ej. 'títulos de sección')", "confidence": "explicito" | "estimado" } ],
  "radii": [ { "name": "kebab-case", "value": "ej. '8px'", "usage": "uso corto", "confidence": "explicito" | "estimado" } ],
  "shadows": [ { "name": "kebab-case", "value": "valor o descripción del efecto (ej. '0 2px 8px rgba(0,0,0,0.12)' si es legible)", "usage": "uso corto", "confidence": "explicito" | "estimado" } ],
  "notes": "1-2 frases sobre qué tan completo o ambiguo fue el material para sacar tokens, en español"
}`;

async function analyzeClientFileForTokens(file) {
  const base64 = await readFileAsBase64(file);
  const contentBlock = file.type === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
    : { type: "image", source: { type: "base64", media_type: file.type, data: base64 } };

  const response = await fetch("/api/critique", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: TOKEN_EXTRACTION_PROMPT,
      messages: [{
        role: "user",
        content: [
          contentBlock,
          { type: "text", text: `Archivo: "${file.name}". Extraé los tokens de marca visibles en este material siguiendo las reglas del sistema y respondé solo con el JSON.` },
        ],
      }],
    }),
  });
  const data = await response.json();
  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) throw new Error(data.error?.message || "Sin respuesta de análisis.");
  const clean = textBlock.text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  return normalizeTokenResult(parsed);
}

// El modelo debería siempre devolver estos campos como string, pero nunca
// hay que confiar ciegamente en eso — un campo faltante como `undefined` en
// un <input value> vuelve el input "no controlado" y React tira warning (o
// peor, deja de reflejar ediciones). Se rellena todo con "" antes de que
// llegue a la UI.
const TOKEN_FIELD_SHAPE = {
  colors: { name: "", hex: "", role: "", confidence: "estimado" },
  typography: { name: "", family: "", size: "", weight: "", usage: "", confidence: "estimado" },
  radii: { name: "", value: "", usage: "", confidence: "estimado" },
  shadows: { name: "", value: "", usage: "", confidence: "estimado" },
};

function normalizeTokenResult(parsed) {
  const out = { notes: typeof parsed.notes === "string" ? parsed.notes : "" };
  TOKEN_CATEGORIES.forEach((cat) => {
    const shape = TOKEN_FIELD_SHAPE[cat];
    const list = Array.isArray(parsed[cat]) ? parsed[cat] : [];
    out[cat] = list.map((item) => {
      const merged = { ...shape };
      Object.keys(shape).forEach((key) => {
        if (item && item[key] != null) merged[key] = String(item[key]);
      });
      return merged;
    });
  });
  return out;
}

// Arma un design-tokens.json en formato DTCG ($value/$type/$description —
// el que hoy leen Tokens Studio, Style Dictionary, etc.) a partir de los
// tokens ya editados/confirmados en el modal. Un builder lo importa directo,
// sin copiar valores a mano de un markdown.
function buildDesignTokensJson(consolidated) {
  const color = {};
  consolidated.colors.forEach((t, i) => {
    const key = (t.name && t.name.trim()) || `color-${i + 1}`;
    color[key] = { $value: t.hex, $type: "color", $description: t.role || undefined };
  });
  const typography = {};
  consolidated.typography.forEach((t, i) => {
    const key = (t.name && t.name.trim()) || `tipografia-${i + 1}`;
    typography[key] = {
      $value: { fontFamily: t.family || undefined, fontSize: t.size || undefined, fontWeight: t.weight || undefined },
      $type: "typography",
      $description: t.usage || undefined,
    };
  });
  const radius = {};
  consolidated.radii.forEach((t, i) => {
    const key = (t.name && t.name.trim()) || `radio-${i + 1}`;
    radius[key] = { $value: t.value, $type: "dimension", $description: t.usage || undefined };
  });
  const shadow = {};
  consolidated.shadows.forEach((t, i) => {
    const key = (t.name && t.name.trim()) || `sombra-${i + 1}`;
    shadow[key] = { $value: t.value, $type: "shadow", $description: t.usage || undefined };
  });
  return { $description: "Tokens de marca del cliente, extraídos con IA a partir de material adjunto y revisados a mano antes de exportar.", color, typography, radius, shadow };
}

// Resumen legible de los tokens para meter dentro del skill.md mismo — el
// .json de al lado es para que lo importe una herramienta, esto es para que
// lo lea una persona (o el propio modelo) sin abrir un segundo archivo.
function buildTokensMarkdownSection(consolidated) {
  const total = TOKEN_CATEGORIES.reduce((sum, cat) => sum + consolidated[cat].length, 0);
  if (total === 0) return "";
  const lines = [];
  if (consolidated.colors.length) {
    lines.push("**Color**\n" + consolidated.colors.map((t) => `- \`${t.name}\`: ${t.hex} — ${t.role || "sin uso especificado"} _(${t.confidence === "explicito" ? "explícito en el material" : "estimado"})_`).join("\n"));
  }
  if (consolidated.typography.length) {
    lines.push("**Tipografía**\n" + consolidated.typography.map((t) => `- \`${t.name}\`: ${[t.family, t.size, t.weight].filter(Boolean).join(" · ")} — ${t.usage || "sin uso especificado"} _(${t.confidence === "explicito" ? "explícito en el material" : "estimado"})_`).join("\n"));
  }
  if (consolidated.radii.length) {
    lines.push("**Radios**\n" + consolidated.radii.map((t) => `- \`${t.name}\`: ${t.value} — ${t.usage || "sin uso especificado"} _(${t.confidence === "explicito" ? "explícito en el material" : "estimado"})_`).join("\n"));
  }
  if (consolidated.shadows.length) {
    lines.push("**Sombras**\n" + consolidated.shadows.map((t) => `- \`${t.name}\`: ${t.value} — ${t.usage || "sin uso especificado"} _(${t.confidence === "explicito" ? "explícito en el material" : "estimado"})_`).join("\n"));
  }
  return `\n\n## Tokens de marca del cliente (${total}, extraídos con IA y revisados a mano)\n\n` +
    `Sacados del material adjunto por el equipo, no de una convención genérica — priorizalos por sobre cualquier ` +
    `token por defecto de este documento cuando haya conflicto directo. El detalle estructurado (para importar a una ` +
    `herramienta) viaja aparte en \`design-tokens.json\`, descargado junto a este archivo.\n\n${lines.join("\n\n")}`;
}

function SkillExportModal({ onClose, corpusCount, latestApproved, criteriaRecords, loadingCriteria }) {
  const [downloaded, setDownloaded] = useState(false);
  const [clientFiles, setClientFiles] = useState([]); // File[]
  const [clientNotes, setClientNotes] = useState("");
  // Un análisis por nombre de archivo: { status: "loading"|"done"|"error", tokens?, error? }.
  // Nunca automático — solo se llena cuando alguien aprieta "Analizar con IA"
  // para ese archivo puntual.
  const [fileAnalyses, setFileAnalyses] = useState({});
  // Rol por nombre de archivo — "material" por defecto hasta que alguien lo
  // cambie a mano.
  const [clientFileRoles, setClientFileRoles] = useState({});
  const criteriaCount = criteriaRecords.length;
  const isComplete = !loadingCriteria && criteriaCount === EXPECTED_CRITERIA_COUNT;
  // Nunca dejar exportar una skill que dice "esta es la base" sin serlo de
  // verdad — si todavía está cargando o llegó incompleta, se bloquea el
  // botón en vez de dejar salir un archivo silenciosamente corto.
  const canDownload = isComplete;
  const hasClientFiles = clientFiles.length > 0;
  const hasClientMaterial = hasClientFiles || clientNotes.trim().length > 0;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const addClientFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    setClientFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const deduped = incoming.filter((f) => !existingNames.has(f.name));
      return [...prev, ...deduped];
    });
  };

  const removeClientFile = (name) => {
    setClientFiles((prev) => prev.filter((f) => f.name !== name));
    setFileAnalyses((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setClientFileRoles((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setFileRole = (name, role) => {
    setClientFileRoles((prev) => ({ ...prev, [name]: role }));
  };

  const runTokenAnalysis = async (file) => {
    setFileAnalyses((prev) => ({ ...prev, [file.name]: { status: "loading" } }));
    try {
      const tokens = await analyzeClientFileForTokens(file);
      setFileAnalyses((prev) => ({ ...prev, [file.name]: { status: "done", tokens } }));
    } catch (err) {
      setFileAnalyses((prev) => ({ ...prev, [file.name]: { status: "error", error: String((err && err.message) || err) } }));
    }
  };

  // Cualquier fila se puede editar o borrar antes de descargar — nunca se
  // manda a la skill lo que devolvió el modelo sin pasar por acá primero.
  const updateTokenField = (fileName, category, index, field, value) => {
    setFileAnalyses((prev) => {
      const entry = prev[fileName];
      if (!entry || !entry.tokens) return prev;
      const list = entry.tokens[category].slice();
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [fileName]: { ...entry, tokens: { ...entry.tokens, [category]: list } } };
    });
  };

  const removeTokenRow = (fileName, category, index) => {
    setFileAnalyses((prev) => {
      const entry = prev[fileName];
      if (!entry || !entry.tokens) return prev;
      const list = entry.tokens[category].filter((_, i) => i !== index);
      return { ...prev, [fileName]: { ...entry, tokens: { ...entry.tokens, [category]: list } } };
    });
  };

  // Junta lo confirmado/editado de TODOS los archivos analizados en un solo
  // set de tokens — lo que esté acá en el momento de descargar es lo que
  // viaja, ni más ni menos (borrar una fila arriba la saca de acá también).
  const consolidatedTokens = useMemo(() => {
    const merged = { colors: [], typography: [], radii: [], shadows: [] };
    Object.values(fileAnalyses).forEach((entry) => {
      if (!entry || entry.status !== "done" || !entry.tokens) return;
      TOKEN_CATEGORIES.forEach((cat) => merged[cat].push(...(entry.tokens[cat] || [])));
    });
    return merged;
  }, [fileAnalyses]);
  const tokenCount = TOKEN_CATEGORIES.reduce((sum, cat) => sum + consolidatedTokens[cat].length, 0);
  const hasTokens = tokenCount > 0;

  // Nada de .zip: el .md se descarga como siempre, y cada archivo del
  // cliente se descarga aparte con su nombre original — un PDF sigue siendo
  // un PDF en la carpeta de Descargas, sin que nadie tenga que desempaquetar
  // nada primero. Un pequeño delay escalonado entre cada uno para que el
  // navegador no las trate como una tanda de popups y las bloquee.
  const handleDownload = () => {
    if (!canDownload) return;
    const md = buildSkillMarkdown({
      corpusCount,
      latestApproved,
      criteriaRecords,
      clientMaterialNote: hasClientMaterial
        ? {
            generalFiles: clientFiles.filter((f) => (clientFileRoles[f.name] || "material") === "material").map((f) => f.name),
            compositionFiles: clientFiles.filter((f) => clientFileRoles[f.name] === "composicion").map((f) => f.name),
            logoFiles: clientFiles.filter((f) => clientFileRoles[f.name] === "logo").map((f) => f.name),
            hasNotes: clientNotes.trim().length > 0,
          }
        : null,
      designTokens: hasTokens ? consolidatedTokens : null,
    });
    const stamp = new Date().toISOString().slice(0, 10);
    downloadTextFile(`withtaste-criterio-${stamp}.md`, md);
    clientFiles.forEach((f, i) => {
      setTimeout(() => downloadBlob(f.name, f), (i + 1) * 200);
    });
    if (hasTokens) {
      const tokensJson = JSON.stringify(buildDesignTokensJson(consolidatedTokens), null, 2);
      setTimeout(() => downloadBlob(`withtaste-design-tokens-${stamp}.json`, new Blob([tokensJson], { type: "application/json" })), (clientFiles.length + 1) * 200);
    }
    setDownloaded(true);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3 className="modal-title">Descargar skill</h3>
          <button className="icon-btn" onClick={onClose} title="Cerrar"><X size={14} /></button>
        </div>

        <div className="modal-meta-list">
          <div className="modal-meta-row">
            <span className="muted small">Versión</span>
            <strong>{CRITERIA_VERSION}</strong>
          </div>
          <div className="modal-meta-row">
            <span className="muted small">Qué cambió último</span>
            <span>{CRITERIA_LATEST_CHANGE}</span>
          </div>
          <div className="modal-meta-row">
            <span className="muted small">Último aporte al corpus propio</span>
            <span>
              {latestApproved
                ? <>"{latestApproved.title || "sin título"}" — {latestApproved.reviewedBy || "el equipo"}, {formatDate(latestApproved.reviewedAt)}</>
                : "Todavía no hay críticas aprobadas."}
            </span>
          </div>
          <div className="modal-meta-row">
            <span className="muted small">Cobertura</span>
            <span>
              {loadingCriteria ? "Cargando base de criterios…" : `${criteriaCount}/${EXPECTED_CRITERIA_COUNT} criterios de documentación`} · {corpusCount} críticas propias aprobadas
            </span>
          </div>
        </div>

        {!loadingCriteria && !isComplete && (
          <p className="modal-warning">
            ⚠️ Solo cargaron {criteriaCount} de {EXPECTED_CRITERIA_COUNT} criterios — la base de documentación siempre tiene que estar completa adentro de la skill. Cerrá, recargá la página y volvé a intentar antes de descargar.
          </p>
        )}

        <div className="modal-client-material">
          <h4 className="modal-client-title">Material del cliente <span className="muted small">(opcional)</span></h4>
          <p className="muted small" style={{ margin: "0 0 10px" }}>
            Sumá el design system del cliente (PDF u otro documento) y cualquier otra cosa que te haya pasado — cada
            archivo se descarga aparte, con su nombre original, junto al .md. Nada se guarda en ningún servidor
            nuestro. Si además le das "Analizar con IA" a un archivo, ese archivo puntual sí se envía a la API de
            Claude para leerlo (nunca se guarda ahí tampoco) — el resto queda solo en tu navegador.
          </p>
          <label className="btn btn-secondary btn-sm modal-file-trigger">
            <Upload size={13} /> Adjuntar archivos
            <input
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => { addClientFiles(e.target.files); e.target.value = ""; }}
            />
          </label>
          {clientFiles.length > 0 && (
            <ul className="modal-file-list">
              {clientFiles.map((f) => {
                const analysis = fileAnalyses[f.name];
                const analyzable = isTokenAnalyzable(f);
                const blockReason = analyzable ? "" : tokenAnalyzeBlockReason(f);
                return (
                  <li key={f.name} className="modal-file-item">
                    <div className="modal-file-row">
                      <span className="modal-file-name">{f.name}</span>
                      <span className="modal-file-size">{formatBytes(f.size)}</span>
                      <button className="icon-btn ghost" onClick={() => removeClientFile(f.name)} title="Quitar archivo">
                        <X size={12} />
                      </button>
                    </div>
                    <div className="modal-file-role-row">
                      <span className="muted small">Es</span>
                      <select
                        className="modal-file-role-select"
                        value={clientFileRoles[f.name] || "material"}
                        onChange={(e) => setFileRole(f.name, e.target.value)}
                      >
                        {CLIENT_FILE_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                    {analyzable && (!analysis || analysis.status === "idle") && (
                      <button className="btn btn-secondary btn-sm modal-analyze-btn" onClick={() => runTokenAnalysis(f)}>
                        ✨ Analizar con IA — sacar tokens de marca
                      </button>
                    )}
                    {analysis?.status === "loading" && (
                      <p className="muted small modal-analyze-status"><Loader2 size={12} className="spin" /> Analizando "{f.name}"…</p>
                    )}
                    {analysis?.status === "error" && (
                      <div className="modal-analyze-status">
                        <p className="muted small" style={{ color: "var(--danger)" }}>⚠️ No se pudo analizar: {analysis.error}</p>
                        <button className="btn btn-secondary btn-sm" onClick={() => runTokenAnalysis(f)}>Reintentar</button>
                      </div>
                    )}
                    {analysis?.status === "done" && (
                      <TokenReviewPanel
                        fileName={f.name}
                        tokens={analysis.tokens}
                        onUpdateField={updateTokenField}
                        onRemoveRow={removeTokenRow}
                        onReanalyze={() => runTokenAnalysis(f)}
                      />
                    )}
                    {!analyzable && blockReason && (
                      <p className="muted small modal-analyze-status">{blockReason}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <label className="field" style={{ marginTop: 10 }}>
            <span>Notas adicionales del cliente</span>
            <textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              rows={2}
              placeholder="Cualquier otra cosa que nos haya pasado el cliente y que valga la pena que viaje junto al skill…"
            />
          </label>
        </div>

        <p className="modal-disclaimer"><Lock size={12} /> Uso interno del equipo — no compartir fuera todavía. El paso siguiente es servir esto desde un servicio propio en vez de un archivo suelto.</p>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
          <button className="btn btn-primary" onClick={handleDownload} disabled={!canDownload}>
            <Download size={14} />
            {loadingCriteria
              ? "Cargando…"
              : hasClientMaterial
                ? `Descargar .md + ${clientFiles.length} archivo${clientFiles.length === 1 ? "" : "s"}${hasTokens ? " + tokens.json" : ""}`
                : "Descargar .md"}
          </button>
        </div>
        {downloaded && (
          <p className="muted small modal-confirm">
            Descargado ✓ — {criteriaCount}/{EXPECTED_CRITERIA_COUNT} criterios incluidos
            {hasClientMaterial && ` + material del cliente (${clientFiles.length} archivo${clientFiles.length === 1 ? "" : "s"} descargado${clientFiles.length === 1 ? "" : "s"} aparte)`}
            {hasTokens && ` + ${tokenCount} tokens de marca (design-tokens.json)`}
          </p>
        )}
      </div>
    </div>
  );
}

// Panel de revisión de los tokens que devolvió el análisis de un archivo —
// TODO acá es editable o borrable, a propósito: nunca se manda a la skill
// lo que dijo el modelo sin que una persona lo haya mirado primero. Cada
// input es "controlado" contra el estado del padre (fileAnalyses), no tiene
// estado propio.
function TokenReviewPanel({ fileName, tokens, onUpdateField, onRemoveRow, onReanalyze }) {
  const [open, setOpen] = useState(true);
  const total = TOKEN_CATEGORIES.reduce((sum, cat) => sum + (tokens[cat] || []).length, 0);

  const confidenceLabel = (c) => (c === "explicito" ? "explícito" : "estimado");

  return (
    <div className="token-review">
      <div className="token-review-head">
        <button className="token-review-toggle" onClick={() => setOpen((v) => !v)}>
          <ChevronDown size={13} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
          {total > 0 ? `${total} token${total === 1 ? "" : "s"} detectado${total === 1 ? "" : "s"} — revisá antes de descargar` : "No se detectó ningún token claro en este archivo"}
        </button>
        <button className="icon-btn ghost" onClick={onReanalyze} title="Volver a analizar">↻</button>
      </div>
      {open && total > 0 && (
        <div className="token-review-body">
          {tokens.colors.length > 0 && (
            <div className="token-group">
              <span className="token-group-label">Color</span>
              {tokens.colors.map((t, i) => (
                <div className="token-row" key={i}>
                  <span className="token-swatch" style={{ background: /^#[0-9a-fA-F]{3,8}$/.test(t.hex) ? t.hex : "transparent" }} />
                  <input className="token-input token-input-name" value={t.name} onChange={(e) => onUpdateField(fileName, "colors", i, "name", e.target.value)} />
                  <input className="token-input token-input-hex" value={t.hex} onChange={(e) => onUpdateField(fileName, "colors", i, "hex", e.target.value)} />
                  <input className="token-input token-input-role" value={t.role} onChange={(e) => onUpdateField(fileName, "colors", i, "role", e.target.value)} />
                  <span className="token-confidence">{confidenceLabel(t.confidence)}</span>
                  <button className="icon-btn ghost" onClick={() => onRemoveRow(fileName, "colors", i)} title="Quitar"><X size={11} /></button>
                </div>
              ))}
            </div>
          )}
          {tokens.typography.length > 0 && (
            <div className="token-group">
              <span className="token-group-label">Tipografía</span>
              {tokens.typography.map((t, i) => (
                <div className="token-row" key={i}>
                  <input className="token-input token-input-name" value={t.name} onChange={(e) => onUpdateField(fileName, "typography", i, "name", e.target.value)} />
                  <input className="token-input token-input-role" value={t.family} placeholder="familia" onChange={(e) => onUpdateField(fileName, "typography", i, "family", e.target.value)} />
                  <input className="token-input token-input-hex" value={t.size} placeholder="tamaño" onChange={(e) => onUpdateField(fileName, "typography", i, "size", e.target.value)} />
                  <input className="token-input token-input-hex" value={t.weight} placeholder="peso" onChange={(e) => onUpdateField(fileName, "typography", i, "weight", e.target.value)} />
                  <span className="token-confidence">{confidenceLabel(t.confidence)}</span>
                  <button className="icon-btn ghost" onClick={() => onRemoveRow(fileName, "typography", i)} title="Quitar"><X size={11} /></button>
                </div>
              ))}
            </div>
          )}
          {tokens.radii.length > 0 && (
            <div className="token-group">
              <span className="token-group-label">Radios</span>
              {tokens.radii.map((t, i) => (
                <div className="token-row" key={i}>
                  <input className="token-input token-input-name" value={t.name} onChange={(e) => onUpdateField(fileName, "radii", i, "name", e.target.value)} />
                  <input className="token-input token-input-hex" value={t.value} onChange={(e) => onUpdateField(fileName, "radii", i, "value", e.target.value)} />
                  <input className="token-input token-input-role" value={t.usage} onChange={(e) => onUpdateField(fileName, "radii", i, "usage", e.target.value)} />
                  <span className="token-confidence">{confidenceLabel(t.confidence)}</span>
                  <button className="icon-btn ghost" onClick={() => onRemoveRow(fileName, "radii", i)} title="Quitar"><X size={11} /></button>
                </div>
              ))}
            </div>
          )}
          {tokens.shadows.length > 0 && (
            <div className="token-group">
              <span className="token-group-label">Sombras</span>
              {tokens.shadows.map((t, i) => (
                <div className="token-row" key={i}>
                  <input className="token-input token-input-name" value={t.name} onChange={(e) => onUpdateField(fileName, "shadows", i, "name", e.target.value)} />
                  <input className="token-input token-input-role" value={t.value} onChange={(e) => onUpdateField(fileName, "shadows", i, "value", e.target.value)} />
                  <input className="token-input token-input-role" value={t.usage} onChange={(e) => onUpdateField(fileName, "shadows", i, "usage", e.target.value)} />
                  <span className="token-confidence">{confidenceLabel(t.confidence)}</span>
                  <button className="icon-btn ghost" onClick={() => onRemoveRow(fileName, "shadows", i)} title="Quitar"><X size={11} /></button>
                </div>
              ))}
            </div>
          )}
          {tokens.notes && <p className="muted small token-notes">{tokens.notes}</p>}
        </div>
      )}
    </div>
  );
}

// ============================================================
// "Cómo evaluamos" — página editorial de storytelling, reemplaza al viejo
// "Ver criterio" como superficie principal de la sección. Objetivo: que
// alguien la recorra en 20-30 segundos y entienda cómo funciona una
// auditoría y de dónde viene el criterio, sin sentir que está leyendo
// documentación técnica ni mirando un panel de admin. Todo el detalle
// técnico (versiones, fuentes completas, backlog, decisiones de
// arquitectura, descargar skill) sigue existiendo intacto en
// MethodologyView — nada se borró, solo se sacó de esta experiencia
// principal y queda un nivel más abajo, detrás del link del final.
const HOW_DIMENSION_COPY = {
  "Jerarquía visual": { line: "¿Es evidente qué mirar y qué hacer primero?", tags: ["Jerarquía", "Peso visual"] },
  "Consistencia y sistema de diseño": { line: "¿La interfaz usa los mismos patrones de principio a fin?", tags: ["Consistencia", "Sistemas"] },
  "Tipografía": { line: "¿El texto es legible y tiene una jerarquía clara?", tags: ["Tipografía", "Legibilidad"] },
  "Color y contraste": { line: "¿Existe suficiente legibilidad y diferenciación?", tags: ["Contraste", "Color"] },
  "Espaciado y alineación": { line: "¿El espacio agrupa lo relacionado y separa lo distinto?", tags: ["Espaciado", "Alineación"] },
  "Componentes y affordance": { line: "¿Los elementos se comportan como la persona espera?", tags: ["Componentes", "Affordance"] },
  "Copy y microcopy": { line: "¿Las palabras ayudan o generan más fricción?", tags: ["Copy", "Claridad"] },
  "Accesibilidad": { line: "¿La interfaz cumple principios observables de accesibilidad?", tags: ["Accesibilidad"] },
  "Claridad del propósito": { line: "¿Es evidente qué puede hacer la persona y qué va a pasar después?", tags: ["Propósito"] },
  "Patrones oscuros": { line: "¿Alguna decisión empuja a la persona en contra de su propio interés?", tags: ["Confianza", "Ética"] },
};

const HOW_AUDIT_STEPS = [
  { title: "Entendemos la interfaz", body: "Leemos la captura: qué tipo de pantalla es y qué componentes tiene." },
  { title: "Identificamos el contexto", body: "Qué está tratando de hacer la persona y qué tan riesgosa es la tarea." },
  { title: "Elegimos el criterio relevante", body: "De una base curada, solo lo que aplica a esta pantalla puntual." },
  { title: "Analizamos", body: "Comparamos la imagen contra ese criterio, no contra una impresión general." },
  { title: "Generamos hallazgos", body: "Cada uno con su nivel de certeza y su fuente." },
];

const HOW_EVIDENCE_TYPES = [
  { key: "violacion", label: "Incumplimiento", body: "Incumple una regla verificable." },
  { key: "riesgo", label: "Riesgo", body: "Puede producir un problema, aunque no sea una regla absoluta." },
  { key: "hipotesis", label: "Hipótesis", body: "Necesita comportamiento o datos reales para confirmarse." },
  { key: "convencion", label: "Convención", body: "Se aleja de un patrón ampliamente esperado en la plataforma." },
  { key: "preferencia", label: "Preferencia", body: "Es una recomendación de calidad, no una regla." },
];

function HowWeEvaluateView({ onOpenMethodology, onBack }) {
  const [corpusCount, setCorpusCount] = useState(null);
  // Mismos datos que ya carga CriteriaView para su propio botón "Descargar
  // skill" — se duplica la carga acá (no el estado) porque esta vista no
  // comparte árbol con esa, y el botón de acá tiene que funcionar solo con
  // lo que esta vista misma tiene disponible.
  const [latestApproved, setLatestApproved] = useState(null);
  const [criteriaRecords, setCriteriaRecords] = useState([]);
  const [loadingCriteria, setLoadingCriteria] = useState(true);
  const [showSkillModal, setShowSkillModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadApprovedCritiques()
      .then((approved) => {
        if (cancelled) return;
        setCorpusCount(approved.length);
        const sorted = [...approved].sort((a, b) => (b.reviewedAt || 0) - (a.reviewedAt || 0));
        setLatestApproved(sorted[0] || null);
      })
      .catch(() => {});
    loadAllCriteria()
      .then((all) => { if (!cancelled) { setCriteriaRecords(all); setLoadingCriteria(false); } })
      .catch(() => { if (!cancelled) setLoadingCriteria(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="how-view">
      <button className="btn-link" onClick={onBack}><ArrowLeft size={14} /> Volver al índice</button>

      <div className="how-intro">
        <span className="how-eyebrow">Criterio</span>
        <h1 className="how-title">Cómo evaluamos una interfaz</h1>
        <p className="how-sub">
          De dónde viene el criterio, cómo lo aplica la IA y qué revisamos antes de convertirlo en una recomendación.
        </p>
      </div>

      <section className="how-module how-module-accent how-module-wide">
        <h2 className="how-module-title">Cómo funciona una auditoría</h2>
        <div className="how-steps">
          {HOW_AUDIT_STEPS.map((s, i) => (
            <div className="how-step" key={s.title}>
              <span className="how-step-index">{String(i + 1).padStart(2, "0")}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
              {i < HOW_AUDIT_STEPS.length - 1 && <span className="how-step-connector" aria-hidden="true">→</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="how-module how-module-wide">
        <h2 className="how-module-title">De dónde viene el criterio</h2>
        <p className="how-module-lede">El criterio no lo inventa la IA. Viene de tres fuentes distintas, cada una con su propio peso.</p>
        <div className="how-sources-grid">
          <button className="how-source-unit is-clickable" onClick={onOpenMethodology}>
            <h3>Estándares y buenas prácticas</h3>
            <p>Accesibilidad, UX, interacción y sistemas de diseño reconocidos.</p>
            <div className="how-chip-row">
              <span className="how-chip">WCAG</span><span className="how-chip">Nielsen</span><span className="how-chip">Apple HIG</span>
            </div>
            <span className="how-source-meta">{EXPECTED_CRITERIA_COUNT} criterios</span>
            <span className="how-card-cta">Ver banco de criterios →</span>
          </button>
          <button className="how-source-unit is-clickable" onClick={onOpenMethodology}>
            <h3>Investigación y referencias</h3>
            <p>Research, literatura especializada y datasets relevantes.</p>
            <div className="how-chip-row">
              <span className="how-chip">Baymard</span><span className="how-chip">UICrit</span><span className="how-chip">Refactoring UI</span>
            </div>
            <span className="how-card-cta">Ver bibliografía y referencias →</span>
          </button>
          <div className="how-source-unit">
            <h3>Criterio revisado por personas</h3>
            <p>Aprendizajes propios que solo entran al sistema después de revisión humana.</p>
            {corpusCount !== null && (
              <span className="how-source-meta">{corpusCount} crítica{corpusCount === 1 ? "" : "s"} propia{corpusCount === 1 ? "" : "s"} aprobada{corpusCount === 1 ? "" : "s"}</span>
            )}
          </div>
        </div>
      </section>

      <section className="how-module">
        <h2 className="how-module-title">Qué evaluamos</h2>
        <div className="how-dimension-grid">
          {CRITERIA_SECTIONS.map((s, i) => {
            const copy = HOW_DIMENSION_COPY[s.title] || { line: "", tags: [] };
            return (
              <button key={s.title} className={`how-dimension-card ${i < 2 ? "is-featured" : ""}`} onClick={onOpenMethodology}>
                <h3>{s.title}</h3>
                <p>{copy.line}</p>
                <div className="how-chip-row">
                  {copy.tags.map((t) => <span className="how-chip" key={t}>{t}</span>)}
                </div>
                <span className="how-card-cta">Explorar criterios →</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="how-module how-module-wide">
        <h2 className="how-module-title">No todas las interfaces se evalúan igual</h2>
        <p className="how-module-lede">Antes de aplicar el criterio, el sistema considera qué está tratando de hacer la persona.</p>
        <div className="how-pill-row">
          {EXPERIENCE_TYPES.map((t) => <span className="how-pill" key={t}>{t}</span>)}
        </div>
        <div className="how-pill-row how-pill-row-secondary">
          {CONSIDERATIONS.map((t) => <span className="how-pill how-pill-secondary" key={t}>{t}</span>)}
        </div>
      </section>

      <section className="how-module how-module-wide">
        <h2 className="how-module-title">Cómo interpretamos la evidencia</h2>
        <p className="how-module-lede">La IA distingue entre lo que puede observar y lo que solo puede inferir.</p>
        <div className="how-evidence-grid">
          {HOW_EVIDENCE_TYPES.map((e) => (
            <div className="how-evidence-item" key={e.key}>
              <span
                className="how-evidence-label"
                style={{ color: TYPE_STYLES[e.key].fg, background: TYPE_STYLES[e.key].bg, borderColor: TYPE_STYLES[e.key].border }}
              >
                {e.label}
              </span>
              <p>{e.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="how-module how-module-accent how-module-wide how-closing">
        <p className="how-closing-path">Fuente → criterio → revisión → sistema</p>
        <p className="how-closing-statement">La IA genera las auditorías.<br />El criterio está revisado por personas.</p>
        <button className="how-closing-download" onClick={() => setShowSkillModal(true)}>
          <Download size={13} /> Descargar skill
        </button>
      </section>

      <button className="how-methodology-cta" onClick={onOpenMethodology}>
        <span className="how-methodology-cta-title">¿Querés entrar en detalle?</span>
        <span className="muted small">Scoring, fuentes, biblioteca de componentes, metodología y límites.</span>
        <span className="how-card-cta">Explorar metodología completa →</span>
      </button>

      {showSkillModal && (
        <SkillExportModal
          onClose={() => setShowSkillModal(false)}
          corpusCount={corpusCount ?? 0}
          latestApproved={latestApproved}
          criteriaRecords={criteriaRecords}
          loadingCriteria={loadingCriteria}
        />
      )}

      <style>{`
        .how-view {
          --how-bg: #ffffff; --how-surface: #fffefb; --how-ink: #17181a; --how-ink-soft: #6b6a63;
          --how-accent: var(--accent); --how-accent-fg: #ffffff; --how-rule: rgba(23, 24, 26, 0.08);
          --how-radius-lg: 26px; --how-radius-md: 18px;
          background: var(--how-bg); color: var(--how-ink); border-radius: var(--how-radius-lg);
          padding: 44px 48px 64px;
        }
        .how-intro { max-width: 640px; margin: 8px 0 56px; }
        .how-eyebrow {
          display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--how-accent); margin-bottom: 14px;
        }
        .how-title { font-size: clamp(30px, 4vw, 44px); font-weight: 700; letter-spacing: -0.02em; margin: 0 0 14px; line-height: 1.12; }
        .how-sub { font-size: 16px; line-height: 1.55; color: var(--how-ink-soft); margin: 0; max-width: 520px; }

        .how-module { margin: 0 0 64px; }
        .how-module-title { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; margin: 0 0 10px; }
        .how-module-lede { font-size: 14.5px; color: var(--how-ink-soft); margin: 0 0 24px; max-width: 560px; line-height: 1.5; }
        .how-module-wide { max-width: 100%; }
        .how-module-accent {
          background: var(--how-accent); color: var(--how-accent-fg); border-radius: var(--how-radius-lg);
          padding: 40px 44px;
        }
        .how-module-accent .how-module-title { color: var(--how-accent-fg); }

        .how-steps { display: flex; flex-wrap: wrap; gap: 8px; align-items: stretch; }
        .how-step { flex: 1 1 160px; min-width: 160px; position: relative; padding-right: 20px; }
        .how-step-index { display: block; font-size: 11px; font-weight: 700; opacity: 0.65; margin-bottom: 10px; letter-spacing: 0.04em; }
        .how-step h3 { font-size: 14.5px; font-weight: 650; margin: 0 0 6px; }
        .how-step p { font-size: 12.5px; line-height: 1.45; margin: 0; opacity: 0.85; }
        .how-step-connector { position: absolute; right: -4px; top: 2px; font-size: 15px; opacity: 0.45; }
        .how-step:last-child { padding-right: 0; }

        .how-sources-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .how-source-unit { border-top: 2px solid var(--how-ink); padding-top: 16px; }
        .how-source-unit h3 { font-size: 15px; font-weight: 650; margin: 0 0 8px; }
        .how-source-unit p { font-size: 13px; color: var(--how-ink-soft); line-height: 1.5; margin: 0 0 12px; }
        .how-source-meta { display: block; margin-top: 10px; font-size: 12px; font-weight: 650; color: var(--how-accent); }
        .how-source-unit.is-clickable {
          background: transparent; border: none; border-top: 2px solid var(--how-ink); padding: 16px 0 0;
          text-align: left; width: 100%; cursor: pointer; font-family: inherit;
          display: flex; flex-direction: column;
        }
        .how-source-unit.is-clickable:hover h3 { color: var(--how-accent); }
        .how-source-unit.is-clickable .how-card-cta { margin-top: 10px; }

        .how-chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .how-chip {
          font-size: 11px; font-weight: 600; color: var(--how-ink-soft); background: rgba(23,24,26,0.05);
          border: 1px solid var(--how-rule); border-radius: 999px; padding: 3px 10px;
        }

        .how-dimension-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .how-dimension-card {
          grid-column: span 1; text-align: left; font-family: inherit; cursor: pointer;
          background: var(--how-surface); border: 1px solid var(--how-rule); border-radius: var(--how-radius-md);
          padding: 20px 20px 18px; display: flex; flex-direction: column; gap: 8px; min-height: 148px;
        }
        .how-dimension-card:hover { border-color: var(--how-accent); }
        .how-dimension-card.is-featured { grid-column: span 2; min-height: 168px; }
        .how-dimension-card h3 { font-size: 15.5px; font-weight: 650; margin: 0; }
        .how-dimension-card p { font-size: 13px; color: var(--how-ink-soft); margin: 0; line-height: 1.45; flex: 1; }
        .how-card-cta { font-size: 12px; font-weight: 650; color: var(--how-accent); margin-top: auto; }

        .how-pill-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
        .how-pill {
          font-size: 12.5px; font-weight: 600; padding: 6px 14px; border-radius: 999px;
          background: var(--how-surface); border: 1px solid var(--how-rule); color: var(--how-ink);
        }
        .how-pill-secondary { background: transparent; color: var(--how-ink-soft); font-weight: 500; border-style: dashed; }

        .how-evidence-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
        .how-evidence-item p { font-size: 12.5px; color: var(--how-ink-soft); line-height: 1.45; margin: 10px 0 0; }
        .how-evidence-label {
          display: inline-block; font-size: 11.5px; font-weight: 700; padding: 4px 11px; border-radius: 999px; border: 1px solid;
        }

        .how-closing { text-align: center; padding: 56px 40px; }
        .how-closing-path {
          font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 12.5px; opacity: 0.75; letter-spacing: 0.03em;
          margin: 0 0 18px;
        }
        .how-closing-statement { font-size: clamp(22px, 3vw, 30px); font-weight: 700; line-height: 1.35; margin: 0; }
        .how-closing-download {
          display: inline-flex; align-items: center; gap: 7px; margin-top: 22px;
          font-size: 12.5px; font-weight: 600; font-family: inherit; cursor: pointer;
          padding: 8px 15px; border-radius: 999px; border: 1px solid rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.08); color: var(--how-accent-fg);
          transition: background 0.12s ease, border-color 0.12s ease;
        }
        .how-closing-download:hover { background: rgba(255, 255, 255, 0.16); border-color: rgba(255, 255, 255, 0.6); }

        .how-methodology-cta {
          display: flex; flex-direction: column; gap: 4px; text-align: left; font-family: inherit; cursor: pointer;
          background: transparent; border: none; border-top: 1px solid var(--how-rule); padding: 24px 2px 0; width: 100%;
        }
        .how-methodology-cta-title { font-size: 14px; font-weight: 650; }
        .how-methodology-cta:hover .how-card-cta { text-decoration: underline; }

        @media (max-width: 900px) {
          .how-view { padding: 32px 22px 48px; }
          .how-sources-grid { grid-template-columns: 1fr; gap: 28px; }
          .how-dimension-grid { grid-template-columns: repeat(2, 1fr); }
          .how-dimension-card.is-featured { grid-column: span 2; }
          .how-evidence-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .how-dimension-grid { grid-template-columns: 1fr; }
          .how-dimension-card.is-featured { grid-column: span 1; }
          .how-evidence-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function CriteriaView({ onBack }) {
  const [storeStats, setStoreStats] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [criteriaRecords, setCriteriaRecords] = useState([]);
  const [externalStats, setExternalStats] = useState(null);
  const [externalRefs, setExternalRefs] = useState([]);
  const [corpusStats, setCorpusStats] = useState(null);
  const [showSkillModal, setShowSkillModal] = useState(false);
  // Los dos bancos de datos son de solo lectura acá — se pueden explorar
  // pero no hay ningún botón de exportar/descargar en estas dos secciones
  // (el único download de la página es "Descargar skill", que es otra cosa:
  // el paquete completo para uso interno, ya existía antes de esto).
  const [showAllCriteria, setShowAllCriteria] = useState(false);
  const [showExternalSample, setShowExternalSample] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadAllCriteria().then((all) => {
      if (cancelled) return;
      const byDimension = {};
      all.forEach((c) => { byDimension[c.dimension] = (byDimension[c.dimension] || 0) + 1; });
      setStoreStats({ total: all.length, byDimension });
      setCriteriaRecords(all);
      setLoadingStore(false);
    }).catch(() => setLoadingStore(false));
    loadAllExternalReferences().then((all) => {
      if (cancelled) return;
      const totalComments = all.reduce((sum, r) => sum + (r.comments?.length || 0), 0);
      setExternalStats({ screens: all.length, comments: totalComments });
      setExternalRefs(all);
    }).catch(() => {});
    // Metadata del corpus propio (categoría 3) para el modal de "Descargar
    // skill" — qué tan fresco está, quién aportó lo último y cuándo.
    loadApprovedCritiques().then((approved) => {
      if (cancelled) return;
      const sorted = [...approved].sort((a, b) => (b.reviewedAt || 0) - (a.reviewedAt || 0));
      setCorpusStats({ count: approved.length, latest: sorted[0] || null });
    }).catch(() => setCorpusStats({ count: 0, latest: null }));
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="method-view">
      <button className="btn-link" onClick={onBack}><ArrowLeft size={14} /> Volver a "Cómo evaluamos"</button>

      <div className="method-header">
        <div>
          <span className="how-eyebrow">Metodología completa</span>
          <h2 className="method-title">Criterio de crítica</h2>
          <p className="method-sub">
            El detalle técnico completo: fuentes, puntuación, tipos de hallazgo y qué falta construir. Es un
            documento vivo — si el equipo aprueba sumar o ajustar una fuente, se actualiza acá y en el prompt que
            genera las críticas.
          </p>
        </div>
        <div className="method-header-actions">
          <span className="method-version-tag">{CRITERIA_VERSION}</span>
          <button className="btn btn-secondary btn-sm skill-download-cta" onClick={() => setShowSkillModal(true)}>
            <Download size={13} /> Descargar skill
          </button>
        </div>
      </div>
      {showSkillModal && (
        <SkillExportModal
          onClose={() => setShowSkillModal(false)}
          corpusCount={corpusStats?.count ?? 0}
          latestApproved={corpusStats?.latest ?? null}
          criteriaRecords={criteriaRecords}
          loadingCriteria={loadingStore}
        />
      )}

      <div className="method-row method-row-featured">
        <div className="method-card method-card-lg">
          <h3 className="method-card-title">Las 3 categorías madre <span className="muted small">· desde v1.6</span></h3>
          <div className="method-triplet">
            <div><strong>📚 Documentación</strong><br />{storeStats?.total ?? "…"} criterios<br /><span className="muted small">No pasó por nuestro ojo</span></div>
            <div><strong>🖼️ Refs. externas</strong><br />{externalStats ? `${externalStats.screens} pantallas / ${externalStats.comments} comentarios` : "…"}<br /><span className="muted small">UICrit, filtrado human+both</span></div>
            <div><strong>✅ Corpus propio</strong><br />ver índice<br /><span className="muted small">Solo lo que aprobó un humano</span></div>
          </div>
        </div>
        <div className="method-card method-card-lg">
          <h3 className="method-card-title">Base de criterios <span className="muted small">· retrieval por tags, desde v1.5</span></h3>
          {loadingStore ? (
            <p className="muted small">Cargando…</p>
          ) : (
            <>
              <p className="muted small">
                <strong style={{ fontFamily: "SF Mono, Menlo, monospace", color: "var(--accent)" }}>{storeStats?.total ?? 0}</strong> criterios
                atómicos guardados. Antes de cada crítica, la app detecta qué componentes
                hay en la imagen y manda solo los criterios que matchean — no la base
                entera. Esto no es RAG semántico (no hay embeddings), es filtrado por
                etiqueta: más simple y suficiente para este volumen.
              </p>
              {storeStats?.total > 0 && (
                <div className="component-chip-row">
                  {Object.entries(storeStats.byDimension).map(([dim, n]) => (
                    <span className="tag-chip static" key={dim}>{dim} · {n}</span>
                  ))}
                </div>
              )}
              {criteriaRecords.length > 0 && (
                <button
                  className={`bank-toggle ${showAllCriteria ? "is-open" : ""}`}
                  onClick={() => setShowAllCriteria((v) => !v)}
                >
                  <span>{showAllCriteria ? "Ocultar" : "Ver"} los {criteriaRecords.length} criterios</span>
                  <ChevronDown size={11} />
                </button>
              )}
              {showAllCriteria && (
                <div className="bank-list">
                  <p className="muted small bank-list-note">Solo lectura — esta lista no se puede exportar desde acá.</p>
                  {CRITERIA_SECTIONS.map((sec) => {
                    const items = criteriaRecords.filter((c) => c.dimension === sec.title);
                    if (!items.length) return null;
                    return (
                      <details className="bank-group" key={sec.title}>
                        <summary>{sec.title} <span className="muted small">· {items.length}</span></summary>
                        <ul className="bank-item-list">
                          {items.map((c) => (
                            <li key={c.id}>
                              <span className="bank-item-statement">{c.statement}</span>
                              <span className="bank-item-source">{c.principle}{c.evidenceTier ? ` · evidencia ${c.evidenceTier}` : ""}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="method-row method-row-triple">
        <div className="method-card">
          <h3 className="method-card-title">Tipos epistémicos <span className="muted small">· desde v1.4</span></h3>
          <div className="type-legend">
            {Object.entries(TYPE_STYLES).map(([key, s]) => (
              <span key={key} className="type-tag" style={{ background: s.bg, color: s.fg, borderColor: s.border }}>{s.label}</span>
            ))}
          </div>
          <p className="muted small" style={{ marginTop: 8 }}>
            Ningún hallazgo puede afirmar algo interactivo/empírico (abandono, confusión,
            foco de teclado) solo a partir de una imagen — eso va marcado como
            "Hipótesis" con una nota de qué se necesita para confirmarlo.
          </p>
        </div>

        <div className="method-card">
          <h3 className="method-card-title">Biblioteca de componentes <span className="muted small">· desde v1.4</span></h3>
          <p className="muted small">
            Síntesis de Open UI, WAI-ARIA APG, GOV.UK, Salesforce Lightning, Atlassian,
            Uber Base Web y Fluent 2. Cubre 12 familias de componentes con reglas de
            cuándo usar cada uno y qué estados deben distinguirse.
          </p>
          <div className="component-chip-row">
            {["Select/Dropdown", "Combobox", "Dialog/Modal", "Tabs", "Accordion", "Forms", "Validación", "Buttons", "Toasts", "Data tables", "Empty states", "Menús/Nav"].map((c) => (
              <span className="tag-chip static" key={c}>{c}</span>
            ))}
          </div>
        </div>

        <div className="method-card">
          <h3 className="method-card-title">Puntuación por bloques</h3>
          <div className="method-triplet method-triplet-compact">
            <div><strong>Bloque A</strong> · 50 pts<br /><span className="muted small">Usabilidad y arquitectura funcional</span></div>
            <div><strong>Bloque B</strong> · 30 pts<br /><span className="muted small">Consistencia sistémica</span></div>
            <div><strong>Bloque C</strong> · 20 pts<br /><span className="muted small">Dirección de arte</span></div>
          </div>
          <p className="muted small" style={{ marginTop: 8 }}>
            Fallo crítico automático si Bloque A &lt; 30/50 — se calcula en el código,
            no depende de que el modelo lo marque bien. Ningún puntaje de B o C puede
            compensarlo.
          </p>
        </div>
      </div>

      <h3 className="method-section-title">Investigación y referencias <span className="muted small">· las {CRITERIA_SECTIONS.length} dimensiones, fuente por fuente</span></h3>
      <p className="muted small" style={{ marginTop: -8, marginBottom: 16 }}>
        La bibliografía completa detrás de cada dimensión — estándares, research y datasets. Solo lectura.
      </p>
      <div className="method-dimension-grid">
        {CRITERIA_SECTIONS.map((s) => (
          <div className="method-card" key={s.title}>
            <h3 className="method-card-title">{s.title}</h3>
            <ul className="criteria-list">
              {s.sources.map((src, i) => <li key={i}>{src}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {externalStats?.screens > 0 && (
        <div className="method-card" style={{ marginTop: 20 }}>
          <h3 className="method-card-title">Dataset UICrit <span className="muted small">· categoría 2, inspiración — no es criterio propio</span></h3>
          <p className="muted small">
            {externalStats.screens} pantallas mobile con {externalStats.comments} comentarios de revisores externos,
            usadas solo como inspiración de qué buscar en pantallas similares — nunca se citan como fuente normativa.
          </p>
          {externalRefs.length > 0 && (
            <button
              className={`bank-toggle ${showExternalSample ? "is-open" : ""}`}
              onClick={() => setShowExternalSample((v) => !v)}
            >
              <span>{showExternalSample ? "Ocultar" : "Ver"} muestra del dataset</span>
              <ChevronDown size={11} />
            </button>
          )}
          {showExternalSample && (
            <div className="bank-list">
              <p className="muted small bank-list-note">Solo lectura — esta lista no se puede exportar desde acá.</p>
              <ul className="bank-item-list">
                {externalRefs.slice(0, 40).map((r) => (
                  <li key={r.ricoId}>
                    <span className="bank-item-statement">{r.task}</span>
                    <span className="bank-item-source">
                      rico_id {r.ricoId} · calidad de diseño {r.designQualityRating}/10
                      {r.comments?.[0] ? ` · "${r.comments[0].text}"` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              {externalRefs.length > 40 && (
                <p className="muted small" style={{ marginTop: 8 }}>Mostrando 40 de {externalRefs.length}.</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="method-row method-row-triple" style={{ marginTop: 40 }}>
        <div>
          <h3 className="method-section-title">Tipo de experiencia <span className="muted small">(se elige 1)</span></h3>
          <div className="tag-chips">
            {EXPERIENCE_TYPES.map((t) => <span className="tag-chip static" key={t}>{t}</span>)}
          </div>
        </div>
        <div>
          <h3 className="method-section-title">Consideraciones <span className="muted small">(opcional, varias)</span></h3>
          <div className="tag-chips">
            {CONSIDERATIONS.map((t) => <span className="tag-chip static" key={t}>{t}</span>)}
          </div>
        </div>
        <div>
          <h3 className="method-section-title">Transversales</h3>
          <ul className="criteria-list">
            {CRITERIA_CROSS_CUTTING.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      </div>

      <p className="muted small" style={{ marginTop: 32 }}>
        Nota: de los libros con derechos de autor (Refactoring UI, Don't Make Me Think,
        The Design of Everyday Things, etc.) se aplican los principios y conceptos, no
        se reproduce texto textual de esas obras.
      </p>

      <div className="method-backlog-cta">
        <h3 className="method-card-title">"Balde 2" — arrancado en parte, el resto sigue pendiente</h3>
        <p className="muted small">
          ✅ Arrancado (v1.5): base de criterios atómicos con retrieval por tags — hoy
          {storeStats?.total ?? "..."} registros, empezando por la biblioteca de
          componentes migrada. ⏳ Pendiente: escalar esa base a ~1.500-2.000 criterios
          (WCAG desglosado, Nielsen atomizado, dark patterns, i18n, IA, data viz,
          estética), un vector store con embeddings (RAG semántico real, requiere
          backend propio — esto ya no entra en un artefacto), un grafo de criterios
          en conflicto, fine-tuning/few-shot con datos de revisión humana, y una suite
          formal de evaluación. Ver "Decisiones de arquitectura evaluadas" en el
          documento de criterio completo para el detalle y el orden recomendado.
        </p>
      </div>

      <style>{`
        .method-view {
          --how-bg: #ffffff; --how-surface: #fffefb; --how-ink: #17181a; --how-ink-soft: #6b6a63;
          --how-accent: var(--accent); --how-rule: rgba(23, 24, 26, 0.08);
          background: var(--how-bg); border-radius: 26px; padding: 40px 44px 56px;
        }
        .method-view .how-eyebrow {
          display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--how-accent);
        }
        .method-header {
          display: flex; justify-content: space-between; align-items: flex-start; gap: 20px;
          margin: 28px 0 36px; flex-wrap: wrap;
        }
        .method-title { font-size: clamp(24px, 3vw, 32px); font-weight: 700; letter-spacing: -0.01em; margin: 6px 0 10px; }
        .method-sub { font-size: 14px; line-height: 1.55; color: var(--how-ink-soft); margin: 0; max-width: 560px; }
        .method-header-actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .method-version-tag {
          font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 11px; color: var(--how-ink-soft);
          background: var(--how-surface); border: 1px solid var(--how-rule); border-radius: 999px; padding: 4px 10px;
        }

        .method-row { display: grid; gap: 16px; margin-bottom: 16px; }
        .method-row-featured { grid-template-columns: 1fr 1fr; }
        .method-row-triple { grid-template-columns: repeat(3, 1fr); }

        .method-card {
          background: var(--how-surface); border: 1px solid var(--how-rule); border-radius: 18px; padding: 20px 22px;
        }
        .method-card-lg { padding: 24px 26px; }
        .method-card-title { font-size: 14px; font-weight: 650; margin: 0 0 12px; }
        .method-section-title { font-size: 13px; font-weight: 650; margin: 0 0 12px; color: var(--how-ink); }

        .method-triplet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; font-size: 13px; line-height: 1.5; }
        .method-triplet-compact { gap: 10px; }

        .method-dimension-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

        /* ---- bancos de datos navegables (solo lectura, sin export) ---- */
        .bank-toggle {
          display: inline-flex; align-items: center; gap: 5px; font-family: inherit; font-size: 12px; font-weight: 650;
          color: var(--how-accent); background: transparent; border: none; cursor: pointer; padding: 8px 0 0; margin-top: 4px;
        }
        .bank-toggle svg { transition: transform 0.15s ease; }
        .bank-toggle.is-open svg { transform: rotate(180deg); }
        .bank-list { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--how-rule); }
        .bank-list-note { margin: 0 0 10px; font-style: italic; }
        .bank-group { border: 1px solid var(--how-rule); border-radius: 10px; padding: 10px 12px; margin-bottom: 8px; background: var(--how-bg); }
        .bank-group summary { font-size: 12.5px; font-weight: 650; cursor: pointer; color: var(--how-ink); }
        .bank-group[open] summary { margin-bottom: 8px; }
        .bank-item-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .bank-item-list li { padding: 8px 0 8px 12px; border-left: 2px solid var(--how-rule); display: flex; flex-direction: column; gap: 3px; }
        .bank-item-statement { font-size: 12.5px; color: var(--how-ink); line-height: 1.45; }
        .bank-item-source {
          font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 10.5px; color: var(--how-ink-soft);
          letter-spacing: 0.01em; line-height: 1.4;
        }

        .method-backlog-cta {
          background: var(--how-surface); border: 1px dashed var(--how-rule); border-radius: 18px;
          padding: 20px 22px; margin-top: 20px;
        }

        @media (max-width: 900px) {
          .method-view { padding: 28px 20px 40px; }
          .method-row-featured, .method-row-triple, .method-dimension-grid { grid-template-columns: 1fr; }
          .method-triplet { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

function IndexView({ critiques, journeys, loading, onOpen, onOpenJourney, onNew }) {
  const journeyById = new Map((journeys || []).map((j) => [j.id, j]));
  return (
    <div>
      <div className="index-toolbar">
        <div>
          <h2 className="section-title">Índice de auditorías</h2>
          <p className="section-sub">
            {critiques.length} revisión{critiques.length === 1 ? "" : "es"} registrada{critiques.length === 1 ? "" : "s"}
            {journeys?.length > 0 && <> · {journeys.length} journey{journeys.length === 1 ? "" : "s"}</>}
          </p>
        </div>
        <button className="btn btn-primary" onClick={onNew}>
          <PlusCircle size={16} /> Nueva revisión
        </button>
      </div>

      {loading && (
        <div className="empty-state">
          <Loader2 className="spin" size={22} />
          <p>Cargando el archivo compartido…</p>
        </div>
      )}

      {!loading && journeys?.length > 0 && (
        <div className="journeys-shelf">
          {journeys.map((j) => (
            <button key={j.id} className="journey-shelf-card" onClick={() => onOpenJourney(j.id)}>
              <span className="journey-shelf-badge">Journey</span>
              <span className="journey-shelf-title">{j.title || "Sin título"}</span>
              <span className="muted small">{j.screenIds.length} pantallas · {formatDate(j.createdAt)}</span>
            </button>
          ))}
        </div>
      )}

      {!loading && critiques.length === 0 && (
        <div className="empty-state">
          <ClipboardList size={26} strokeWidth={1.4} />
          <p>Todavía no hay críticas cargadas.</p>
          <button className="btn btn-secondary" onClick={onNew}>Cargar la primera captura</button>
        </div>
      )}

      {!loading && critiques.length > 0 && (
        <table className="index-table">
          <thead>
            <tr>
              <th></th>
              <th>Interfaz</th>
              <th>Autor/a</th>
              <th>Fecha</th>
              <th>Puntaje</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {critiques.map((c) => {
              const score = computeScore(c.critique);
              const journey = c.journeyId ? journeyById.get(c.journeyId) : null;
              return (
                <tr key={c.id} onClick={() => onOpen(c.id)}>
                  <td className="thumb-cell">
                    <img src={c.imageDataUrl} alt="" className="thumb" />
                  </td>
                  <td className="title-cell">
                    {c.title || "Sin título"}
                    {journey && (
                      <button
                        className="journey-inline-badge"
                        onClick={(e) => { e.stopPropagation(); onOpenJourney(journey.id); }}
                        title={`Parte del journey "${journey.title || "sin título"}"`}
                      >
                        journey
                      </button>
                    )}
                  </td>
                  <td>{c.createdBy || "—"}</td>
                  <td className="muted">{formatDate(c.createdAt)}</td>
                  <td>
                    {score.hasBlocks ? (
                      <span className={`score-pill ${score.criticalFail ? "score-pill-fail" : ""}`}>
                        {score.total}/100{score.criticalFail ? " · FAIL" : ""}
                      </span>
                    ) : score.legacyScore !== undefined ? (
                      <span className="score-pill">{score.legacyScore}/10</span>
                    ) : (
                      <span className="score-pill">–</span>
                    )}
                  </td>
                  <td><StatusStamp status={c.status} size="sm" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function NewView({ onSaved, onSavedBatch, onSavedJourney, onCancel }) {
  // Lote de capturas a subir — cada item tiene su propio título (editable,
  // default = nombre del archivo) y su propio estado de análisis, para poder
  // subir y criticar varias pantallas de una sentada en vez de 1x1. El
  // contexto (autor, tipo de experiencia, consideraciones) sigue siendo
  // compartido para todo el lote — no hay todavía contexto por pantalla
  // individual dentro de un mismo journey.
  //
  // "isJourney" es el interruptor entre las dos opciones que tienen que
  // coexistir: por default, un lote de varias capturas son pantallas
  // independientes (batch upload de siempre, cada una es su propia crítica
  // suelta). Si se activa, esas mismas capturas pasan a tratarse como un
  // flujo ordenado (journey) — se guarda además un registro liviano en
  // journey: que agrupa y ordena los ids de las críticas ya guardadas, sin
  // duplicar sus datos. Fase 1 (esto): agrupar, ordenar, navegar el flujo
  // como conjunto. Fase 2 (pendiente, no construida todavía): síntesis
  // cruzada entre pantallas del mismo journey (ej. "el paso 2 contradice la
  // jerarquía que estableció el paso 1").
  const [items, setItems] = useState([]);
  const [author, setAuthor] = useState("");
  const [experienceType, setExperienceType] = useState(null);
  const [considerations, setConsiderations] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStage, setAnalyzeStage] = useState("");
  const [error, setError] = useState(null);
  const [isJourney, setIsJourney] = useState(false);
  const [journeyTitle, setJourneyTitle] = useState("");

  const toggleExperienceType = (tag) => {
    setExperienceType((prev) => (prev === tag ? null : tag));
  };
  const toggleConsideration = (tag) => {
    setConsiderations((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };
  const tags = [experienceType, ...considerations].filter(Boolean);

  const moveItem = (id, direction) => {
    setItems((prev) => {
      const index = prev.findIndex((it) => it.id === id);
      const swapWith = index + direction;
      if (index === -1 || swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter(Boolean);
    if (!files.length) return;
    setError(null);
    const newItems = await Promise.all(
      files.map(async (f, i) => {
        const id = `item-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
        const defaultTitle = f.name.replace(/\.[^.]+$/, "");
        try {
          const { dataUrl } = await resizeImageFile(f);
          return { id, dataUrl, title: defaultTitle, status: "pending", error: null };
        } catch (e) {
          return { id, dataUrl: null, title: defaultTitle, status: "error", error: "No pude leer esa imagen." };
        }
      })
    );
    setItems((prev) => [...prev, ...newItems]);
  };

  const updateItemTitle = (id, value) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, title: value } : it)));
  };
  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };
  const setItemState = (id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  // Analiza UNA captura ya con las tres bases (categorías 1/2/3) cargadas de
  // antemano y compartidas entre todo el lote — evita repetir esas cargas
  // por cada pantalla, que era puro desperdicio de tiempo y de llamadas.
  const analyzeOne = async (item, { allCriteria, approvedPast, allExternalRefs }) => {
    const base64 = item.dataUrl.split(",")[1];

    const classifyRes = await fetch("/api/critique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: CLASSIFICATION_PROMPT,
        messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } }] }],
      }),
    });
    const classifyData = await classifyRes.json();
    const classifyText = (classifyData.content || []).find((b) => b.type === "text");
    let classification = null;
    try {
      classification = classifyText ? JSON.parse(classifyText.text.replace(/```json|```/g, "").trim()) : null;
    } catch (e) { classification = null; }

    const matched = matchCriteria(classification, tags, allCriteria);
    const dynamicSupplement = formatMatchedCriteria(matched);
    const matchedPast = matchPastCritiques(classification, approvedPast);
    const pastSupplement = formatPastCritiques(matchedPast);
    const matchedExternal = matchExternalReferences(classification, allExternalRefs);
    const externalSupplement = formatExternalReferences(matchedExternal);
    const heuristicSupplement = formatHeuristicProfile(experienceType, considerations);

    const response = await fetch("/api/critique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: RUBRIC_PROMPT + dynamicSupplement + pastSupplement + externalSupplement + heuristicSupplement,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
              {
                type: "text",
                text: `Título/contexto de la interfaz: "${item.title || "sin título"}". Etiquetas de contexto: ${tags.length ? tags.join(", ") : "ninguna"}. Analizá esta captura siguiendo las reglas del sistema y respondé solo con el JSON.`,
              },
            ],
          },
        ],
      }),
    });
    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");
    if (!textBlock) throw new Error("Sin respuesta de análisis.");
    const clean = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    const findingsWithReviewState = (parsed.findings || []).map((f) => ({
      ...f,
      anchor: f.anchor || null,
      heuristic: f.heuristic || "",
      checked: false,
      source: "ai",
    }));
    const winsWithReviewState = (parsed.wins || []).map((w) => ({
      ...w,
      anchor: w.anchor || null,
      heuristic: w.heuristic || "",
      checked: false,
      source: "ai",
    }));
    const critiqueWithReviewState = { ...parsed, findings: findingsWithReviewState, wins: winsWithReviewState };

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const record = {
      id,
      title: (item.title || "").trim(),
      createdBy: author.trim(),
      createdAt: Date.now(),
      imageDataUrl: item.dataUrl,
      status: "pending",
      reviewedBy: "",
      reviewedAt: null,
      reviewNotes: "",
      criteriaVersion: CRITERIA_VERSION,
      contextTags: tags,
      detectedScreen: classification,
      matchedCriteriaIds: matched.map((m) => m.id),
      matchedPastCritiqueIds: matchedPast.map((p) => p.id),
      matchedExternalReferenceIds: matchedExternal.map((e) => e.id),
      criteriaBaseSize: allCriteria.length,
      criteriaBaseExpected: EXPECTED_CRITERIA_COUNT,
      corpusPropioBaseSize: approvedPast.length,
      externalReferenceBaseSize: allExternalRefs.length,
      critique: critiqueWithReviewState,
    };

    const result = await window.storage.set(`critique:${id}`, JSON.stringify(record), true);
    if (!result) throw new Error("No se pudo guardar en el archivo compartido.");
    return record;
  };

  // Corre el lote entero: carga las tres bases UNA vez, después analiza cada
  // pantalla pendiente/con error en secuencia (no en paralelo — evita
  // saturar la API y deja el progreso legible pantalla por pantalla). Una
  // pantalla que falla no aborta el resto del lote; queda marcada "error" y
  // se puede reintentar solo ella con el mismo botón.
  const analyzeAll = async () => {
    const pending = items.filter((it) => it.status === "pending" || it.status === "error");
    if (!pending.length) return;
    setAnalyzing(true);
    setError(null);

    let allCriteria, approvedPast, allExternalRefs;
    try {
      setAnalyzeStage("Cargando la base de criterios, corpus propio y referencias…");
      allCriteria = await loadAllCriteria();
      if (allCriteria.length === 0) throw new Error("CRITERIA_BASE_UNAVAILABLE");
      approvedPast = await loadApprovedCritiques();
      allExternalRefs = await loadAllExternalReferences();
    } catch (e) {
      console.error(e);
      if (e.message === "CRITERIA_BASE_UNAVAILABLE") {
        setError(
          `No se generó ninguna crítica: la base de criterios no cargó (se esperaban ${EXPECTED_CRITERIA_COUNT}, llegaron 0). ` +
          "Se abortó a propósito para nunca evaluar sin la documentación curada. Revisá tu conexión y probá de nuevo."
        );
      } else {
        setError("Algo falló antes de poder empezar a analizar. Probá de nuevo.");
      }
      setAnalyzing(false);
      setAnalyzeStage("");
      return;
    }

    const savedRecords = [];
    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      setItemState(item.id, { status: "analyzing", error: null });
      setAnalyzeStage(`Analizando ${i + 1} de ${pending.length}: "${item.title || "sin título"}"…`);
      try {
        const record = await analyzeOne(item, { allCriteria, approvedPast, allExternalRefs });
        savedRecords.push(record);
        setItemState(item.id, { status: "done" });
      } catch (e) {
        console.error(e);
        setItemState(item.id, { status: "error", error: "Falló el análisis de esta captura. Reintentá con el botón de abajo." });
      }
    }

    setAnalyzing(false);
    setAnalyzeStage("");

    // Si isJourney está activo y sobrevivieron al menos 2 pantallas, se arma
    // el registro de journey recién ACÁ, con el resultado final — nunca antes
    // de saber cuántas realmente se guardaron. Si solo sobrevivió 1 (o 0), no
    // tiene sentido un "journey" de una sola pantalla: se cae al camino
    // normal de guardado individual/lote suelto, sin dejar ninguna referencia
    // a un journey que nunca se creó (nada de journeyId huérfano).
    if (isJourney && savedRecords.length >= 2) {
      const journeyId = `journey-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const journeyRecord = {
        id: journeyId,
        title: journeyTitle.trim() || savedRecords.map((r) => r.title || "sin título").join(" → "),
        createdBy: author.trim(),
        createdAt: Date.now(),
        contextTags: tags,
        screenIds: savedRecords.map((r) => r.id),
      };
      const patchedRecords = savedRecords.map((r) => ({ ...r, journeyId }));
      try {
        const journeyWrites = patchedRecords.map((r) => window.storage.set(`critique:${r.id}`, JSON.stringify(r), true));
        const [journeySaved] = await Promise.all([
          window.storage.set(`journey:${journeyId}`, JSON.stringify(journeyRecord), true),
          ...journeyWrites,
        ]);
        if (!journeySaved) throw new Error("No se pudo guardar el journey.");
        onSavedJourney(journeyRecord, patchedRecords);
        return;
      } catch (e) {
        console.error(e);
        // Las pantallas ya están guardadas (crítica por crítica) aunque el
        // journey en sí haya fallado al guardarse — no se pierde el trabajo,
        // solo caen a lote suelto en vez de journey.
        onSavedBatch(savedRecords);
        return;
      }
    }

    if (savedRecords.length === 1 && items.length === 1) {
      onSaved(savedRecords[0]);
    } else if (savedRecords.length > 0) {
      onSavedBatch(savedRecords);
    }
    // Si savedRecords.length === 0 (todo falló), se queda en esta pantalla
    // con el error marcado en cada item para poder reintentar sin perder el lote.
  };

  const pendingOrErrorCount = items.filter((it) => it.status === "pending" || it.status === "error").length;
  const doneCount = items.filter((it) => it.status === "done").length;

  return (
    <div className="new-view">
      <button className="btn-link" onClick={onCancel}><ArrowLeft size={14} /> Volver al índice</button>
      <h2 className="section-title">Nueva revisión</h2>
      <p className="section-sub">Subí una o varias capturas y criticalas de una — el análisis queda como propuesta hasta que alguien del equipo lo apruebe.</p>

      <div className="form-grid">
        <div>
          <label
            className={`upload-zone ${items.length ? "is-compact" : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <div className="upload-placeholder">
              <Upload size={22} strokeWidth={1.4} />
              <span>{items.length ? "Arrastrá más capturas o hacé clic para agregar" : "Arrastrá una o varias imágenes, o hacé clic para elegirlas"}</span>
              <span className="muted small">JPG o PNG · podés seleccionar varias a la vez</span>
            </div>
            <input
              type="file"
              accept="image/png, image/jpeg"
              multiple
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
              style={{ display: "none" }}
            />
          </label>

          {items.length >= 2 && (
            <label className="journey-toggle">
              <input
                type="checkbox"
                checked={isJourney}
                disabled={analyzing}
                onChange={(e) => setIsJourney(e.target.checked)}
              />
              <span>
                <strong>Es un flujo (journey)</strong> — estas capturas están en orden, no son pantallas independientes
              </span>
            </label>
          )}

          {isJourney && items.length >= 2 && (
            <input
              type="text"
              className="journey-title-input"
              placeholder='Título del flujo, ej. "Checkout completo"'
              value={journeyTitle}
              disabled={analyzing}
              onChange={(e) => setJourneyTitle(e.target.value)}
            />
          )}

          {items.length > 0 && (
            <div className="upload-items-list">
              {items.map((it, idx) => (
                <div key={it.id} className={`upload-item-row status-${it.status}`}>
                  {isJourney && (
                    <div className="upload-item-reorder">
                      <span className="upload-item-order-index">{idx + 1}</span>
                      <button
                        type="button"
                        className="icon-btn"
                        disabled={idx === 0 || it.status === "analyzing"}
                        onClick={() => moveItem(it.id, -1)}
                        title="Subir un lugar"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        disabled={idx === items.length - 1 || it.status === "analyzing"}
                        onClick={() => moveItem(it.id, 1)}
                        title="Bajar un lugar"
                      >
                        ▼
                      </button>
                    </div>
                  )}
                  {it.dataUrl ? (
                    <img src={it.dataUrl} alt="" className="upload-item-thumb" />
                  ) : (
                    <div className="upload-item-thumb upload-item-thumb-empty" />
                  )}
                  <div className="upload-item-body">
                    <input
                      type="text"
                      className="upload-item-title-input"
                      value={it.title}
                      placeholder={isJourney ? `Ej. "Paso ${idx + 1}"` : 'Ej. "Checkout — paso 2"'}
                      disabled={it.status === "analyzing"}
                      onChange={(e) => updateItemTitle(it.id, e.target.value)}
                    />
                    <span className={`upload-item-status status-${it.status}`}>
                      {it.status === "pending" && "Pendiente"}
                      {it.status === "analyzing" && (<><Loader2 className="spin" size={11} /> Analizando…</>)}
                      {it.status === "done" && (<><Check size={11} /> Listo</>)}
                      {it.status === "error" && (it.error || "Error")}
                    </span>
                  </div>
                  {it.status !== "analyzing" && (
                    <button className="icon-btn upload-item-remove" onClick={() => removeItem(it.id)} title="Quitar">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {isJourney && items.length >= 2 && (
            <p className="muted small" style={{ marginTop: 8 }}>
              Las etiquetas de contexto de la derecha aplican al flujo entero, todavía no a cada pantalla por separado.
            </p>
          )}
        </div>

        <div className="field-col">
          <label className="field">
            <span>Tu nombre</span>
            <input
              type="text"
              placeholder="Quién sube esta revisión"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
            />
          </label>
          <div className="field">
            <span>Tipo de experiencia (elegí 1 — se aplica a todo el lote)</span>
            <div className="tag-chips">
              {EXPERIENCE_TYPES.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`tag-chip ${experienceType === tag ? "active" : ""}`}
                  onClick={() => toggleExperienceType(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span>Consideraciones (opcional, se pueden combinar)</span>
            <div className="tag-chips">
              {CONSIDERATIONS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`tag-chip ${considerations.includes(tag) ? "active" : ""}`}
                  onClick={() => toggleConsideration(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-block" disabled={!pendingOrErrorCount || analyzing} onClick={analyzeAll}>
            {analyzing
              ? (<><Loader2 className="spin" size={16} /> {analyzeStage || "Analizando…"}</>)
              : pendingOrErrorCount > 1
                ? isJourney
                  ? `Analizar journey (${pendingOrErrorCount} pantallas)`
                  : `Analizar ${pendingOrErrorCount} capturas`
                : "Analizar interfaz"}
          </button>
          {doneCount > 0 && analyzing && <p className="muted small">{doneCount}/{items.length} completadas hasta ahora.</p>}
          {error && <p className="error-text">{error}</p>}
          <p className="muted small">Esto queda visible para cualquiera que tenga acceso a este artefacto. El contexto de arriba (tipo de experiencia y consideraciones) se aplica igual a todas las capturas del lote — todavía no hay contexto por pantalla individual.</p>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, value, max, fail = false }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="score-bar-row">
      <div className="score-bar-label">
        <span>{label}</span>
        <span className="muted">{value}/{max}</span>
      </div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{ width: `${pct}%`, background: fail ? "var(--danger)" : "var(--accent)" }}
        />
      </div>
    </div>
  );
}

// Resumen de puntaje simplificado: por defecto solo el número total (antes
// las 3 barras estaban siempre visibles y no sumaban mucho a simple vista).
// "Ver desglose" expande el detalle por bloque con una explicación de una
// línea cada uno + la regla de fallo crítico, y un link a la metodología
// completa (se abre en pestaña nueva vía ?view=how).
function ScoreSummary({ score, methodologyUrl }) {
  const [open, setOpen] = useState(false);

  if (!score.hasBlocks) {
    return (
      <div className="score-summary score-summary-legacy">
        <div className="score-main">
          <div className="score-total">
            <span className="score-total-number">{score.legacyScore ?? "–"}</span>
            <span className="score-total-max">/10</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="score-summary">
      <div className="score-main">
        <div className="score-total">
          <span className="score-total-number">{score.total}</span>
          <span className="score-total-max">/100</span>
        </div>
        <div className="score-main-text">
          <button className={`score-toggle ${open ? "is-open" : ""}`} onClick={() => setOpen((v) => !v)}>
            <span>{open ? "Ocultar desglose" : "Ver desglose"}</span>
            <ChevronDown size={10} />
          </button>
        </div>
      </div>
      {open && (
        <div className="score-detail">
          <div className="score-block-row">
            <ScoreBar label="Usabilidad y arquitectura" value={score.usability} max={50} fail={score.criticalFail} />
            <p className="score-block-explain">Qué tan fácil es entender y completar la tarea. Si baja de 30/50, la crítica queda marcada como fallo crítico sin importar el resto.</p>
          </div>
          <div className="score-block-row">
            <ScoreBar label="Consistencia sistémica" value={score.consistency} max={30} />
            <p className="score-block-explain">Coherencia interna: mismos patrones y componentes usados de la misma forma en toda la pantalla.</p>
          </div>
          <div className="score-block-row">
            <ScoreBar label="Dirección de arte" value={score.artDirection} max={20} />
            <p className="score-block-explain">Tipografía, color y jerarquía visual — el acabado estético sobre la base ya usable.</p>
          </div>
          {methodologyUrl && (
            <a className="score-methodology-link" href={methodologyUrl} target="_blank" rel="noopener noreferrer">
              Cómo evaluamos el puntaje completo →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const FINDING_CATEGORIES = CRITERIA_SECTIONS.map((s) => s.title);
const FINDING_TYPES = Object.keys(TYPE_STYLES);
const FINDING_SEVERITIES = ["menor", "moderada", "mayor", "bloqueante"];
const CONFIDENCE_LEVELS = ["alta", "media", "baja"];

// Controles de "pin" (marcar un hallazgo/win en un punto de la captura),
// compartidos entre FindingRow, WinRow, AddInsightForm y AddWinForm. El
// número (pinNumber) es asignado por DetailView según el orden en que
// aparecen los hallazgos/wins marcados — es lo que conecta esta fila con el
// círculo numerado sobre la imagen.
// Un solo control representa las 4 sub-estados de ubicación (sin marcar /
// marcando / marcado / reubicar-quitar) en vez de los 3 elementos
// independientes (badge de número + botón pin + botón quitar) que había
// antes — nunca hay más de un control de ubicación visible a la vez.
function PinControl({ anchor, pinNumber, isPinning, onStartPin, onCancelPin, onClearPin }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  if (isPinning) {
    return (
      <button type="button" className="location-btn is-pinning" onClick={onCancelPin}>
        <MapPin size={11} /> Clic en la captura…
      </button>
    );
  }

  if (anchor) {
    return (
      <div className="location-control" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="location-btn has-pin" onClick={() => setMenuOpen((v) => !v)}>
          <MapPin size={11} /> Marcado{pinNumber != null ? ` · #${pinNumber}` : ""}
        </button>
        {menuOpen && (
          <div className="location-menu">
            <button type="button" className="overflow-item" onClick={() => { setMenuOpen(false); onStartPin(); }}>Reubicar</button>
            <button type="button" className="overflow-item danger" onClick={() => { setMenuOpen(false); onClearPin(); }}>Quitar marca</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button type="button" className="location-btn" onClick={onStartPin}>
      <MapPin size={11} /> Ubicar en captura
    </button>
  );
}

// Hallazgo individual: check de revisión + edición inline. El check es lo que
// gatea el botón "Aprobar" en DetailView — un hallazgo sin marcar bloquea la
// aprobación de todo el critique, sea de origen IA o agregado a mano.
function FindingRow({ finding: f, editing, pinNumber, isPinning, onEdit, onCancelEdit, onSaveEdit, onDelete, onToggleChecked, onStartPin, onCancelPin, onClearPin }) {
  const [issueDraft, setIssueDraft] = useState(f.issue || "");
  const [recDraft, setRecDraft] = useState(f.recommendation || "");
  const [validationDraft, setValidationDraft] = useState(f.validationNeeded || "");
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (editing) {
      setIssueDraft(f.issue || "");
      setRecDraft(f.recommendation || "");
      setValidationDraft(f.validationNeeded || "");
    }
  }, [editing]);

  const save = () => {
    onSaveEdit({
      issue: issueDraft.trim(),
      recommendation: recDraft.trim(),
      validationNeeded: validationDraft.trim(),
    });
  };

  const handleDelete = () => {
    if (!window.confirm("¿Estás mega seguro de eliminar este hallazgo? No hay vuelta atrás.")) return;
    onDelete();
  };

  const hasDetails = !!(f.principle || f.type || f.heuristic || f.confidence);

  // Bloque (A/B/C) sigue viniendo en el dato y sigue alimentando el
  // desglose de puntaje — solo se dejó de mostrar acá porque confundía sin
  // aportar nada a la revisión.
  return (
    <div className={`finding-row ${f.checked ? "is-checked" : ""}`}>
      <div className="finding-head">
        <label className="finding-check">
          <input type="checkbox" checked={!!f.checked} onChange={onToggleChecked} />
          <span className="finding-category">{f.category}</span>
          {f.source === "human" && <span className="origin-tag">Agregado por revisor</span>}
          {f.edited && <span className="origin-tag">Editado</span>}
        </label>
        <div className="finding-head-actions">
          <SeverityBadge severity={f.severity} />
          {!editing && (
            <button className="icon-btn ghost" onClick={onEdit} title="Editar hallazgo">
              <Pencil size={13} />
            </button>
          )}
        </div>
      </div>
      {isPinning && <p className="pin-hint">Hacé clic en la captura para ubicar este hallazgo.</p>}

      {editing ? (
        <div className="finding-edit">
          <label className="field">
            <span>Hallazgo</span>
            <textarea value={issueDraft} onChange={(e) => setIssueDraft(e.target.value)} rows={2} />
          </label>
          <label className="field">
            <span>Recomendación</span>
            <textarea value={recDraft} onChange={(e) => setRecDraft(e.target.value)} rows={2} />
          </label>
          {f.type === "hipotesis" && (
            <label className="field">
              <span>Para confirmar</span>
              <textarea value={validationDraft} onChange={(e) => setValidationDraft(e.target.value)} rows={2} />
            </label>
          )}
          <div className="finding-edit-actions">
            <button className="btn btn-ghost-danger" onClick={handleDelete}>
              <Trash2 size={13} /> Eliminar insight
            </button>
            <div className="finding-edit-actions-right">
              <button className="btn btn-secondary btn-sm" onClick={onCancelEdit}><X size={13} /> Cancelar</button>
              <button className="btn btn-approve btn-sm" onClick={save}><Save size={13} /> Guardar</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="finding-issue">{f.issue}</p>
          <p className="finding-rec"><span className="muted">Recomendación:</span> {f.recommendation}</p>
          {f.type === "hipotesis" && f.validationNeeded && (
            <p className="validation-note"><span className="muted">Para confirmar:</span> {f.validationNeeded}</p>
          )}
        </>
      )}

      {!editing && (
        <div className="finding-foot">
          <PinControl
            anchor={f.anchor}
            pinNumber={pinNumber}
            isPinning={isPinning}
            onStartPin={onStartPin}
            onCancelPin={onCancelPin}
            onClearPin={onClearPin}
          />
          {hasDetails && (
            <button className={`details-toggle ${detailsOpen ? "is-open" : ""}`} onClick={() => setDetailsOpen((v) => !v)}>
              <span>Detalles</span> <ChevronDown size={10} />
            </button>
          )}
        </div>
      )}

      {!editing && detailsOpen && hasDetails && (
        <div className="finding-details">
          {f.principle && <p className="finding-principle">{f.principle}</p>}
          <div className="finding-details-tags">
            {f.type && <TypeTag type={f.type} />}
            {f.heuristic && <HeuristicTag id={f.heuristic} />}
            {f.confidence && <span className="confidence-tag">Confianza {f.confidence}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// Formulario para que la persona revisora sume un hallazgo que la IA no
// detectó. Mismo shape que un hallazgo de IA (block/category/type/severity/
// principle/issue/recommendation) para que conviva sin fricción con el resto
// — así también alimenta bien el círculo de calibración (matchPastCritiques).
function AddInsightForm({ onAdd, onCancel, anchor, isPinning, onStartPin, onCancelPin, onClearPin }) {
  const [block, setBlock] = useState("A");
  const [category, setCategory] = useState(FINDING_CATEGORIES[0]);
  const [type, setType] = useState("riesgo");
  const [severity, setSeverity] = useState("moderada");
  const [principle, setPrinciple] = useState("");
  const [issue, setIssue] = useState("");
  const [recommendation, setRecommendation] = useState("");

  const canSave = issue.trim() && recommendation.trim();

  const submit = () => {
    if (!canSave) return;
    onAdd({
      block,
      category,
      type,
      severity,
      confidence: "alta",
      principle: principle.trim(),
      issue: issue.trim(),
      recommendation: recommendation.trim(),
      validationNeeded: "",
      anchor: anchor || null,
    });
  };

  return (
    <div className="finding-row add-insight-form">
      <div className="finding-head-actions" style={{ justifyContent: "flex-end" }}>
        <PinControl anchor={anchor} pinNumber={null} isPinning={isPinning} onStartPin={onStartPin} onCancelPin={onCancelPin} onClearPin={onClearPin} />
      </div>
      {isPinning && <p className="pin-hint">Hacé clic en la captura para ubicar este hallazgo nuevo.</p>}
      <div className="review-fields" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <label className="field">
          <span>Bloque</span>
          <select value={block} onChange={(e) => setBlock(e.target.value)}>
            <option value="A">A — Usabilidad</option>
            <option value="B">B — Consistencia</option>
            <option value="C">C — Dirección de arte</option>
          </select>
        </label>
        <label className="field">
          <span>Categoría</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {FINDING_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Severidad</span>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {FINDING_SEVERITIES.map((s) => <option key={s} value={s}>{SEVERITY_STYLES[s].label}</option>)}
          </select>
        </label>
      </div>
      <div className="review-fields" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <label className="field">
          <span>Tipo</span>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {FINDING_TYPES.map((t) => <option key={t} value={t}>{TYPE_STYLES[t].label}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Principio / fuente (opcional)</span>
          <input type="text" value={principle} onChange={(e) => setPrinciple(e.target.value)} placeholder="Ej. WCAG 2.2 — 1.4.3" />
        </label>
      </div>
      <label className="field">
        <span>Hallazgo</span>
        <textarea value={issue} onChange={(e) => setIssue(e.target.value)} rows={2} placeholder="Qué está mal, observable en la imagen…" />
      </label>
      <label className="field">
        <span>Recomendación</span>
        <textarea value={recommendation} onChange={(e) => setRecommendation(e.target.value)} rows={2} placeholder="Qué cambiar, concreto y accionable…" />
      </label>
      <div className="finding-edit-actions">
        <button className="btn btn-secondary btn-sm" onClick={onCancel}><X size={13} /> Cancelar</button>
        <button className="btn btn-approve btn-sm" disabled={!canSave} onClick={submit}><PlusCircle size={13} /> Agregar hallazgo</button>
      </div>
    </div>
  );
}

// Acierto individual ("win"/"Do") — misma mecánica de revisión que un
// hallazgo (check + edición + pin), pero sin severidad/tipo: un win no es un
// problema con impacto, es una decisión que ya está bien resuelta.
function WinRow({ win: w, editing, pinNumber, isPinning, onEdit, onCancelEdit, onSaveEdit, onToggleChecked, onStartPin, onCancelPin, onClearPin }) {
  const [descDraft, setDescDraft] = useState(w.description || "");
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (editing) setDescDraft(w.description || "");
  }, [editing]);

  const save = () => onSaveEdit({ description: descDraft.trim() });
  const hasDetails = !!(w.principle || w.heuristic || w.confidence);

  return (
    <div className={`finding-row win-row ${w.checked ? "is-checked" : ""}`}>
      <div className="finding-head">
        <label className="finding-check">
          <input type="checkbox" checked={!!w.checked} onChange={onToggleChecked} />
          <span className="finding-category">
            <ThumbsUp size={12} style={{ marginRight: 4, verticalAlign: -1 }} />
            {w.category}
          </span>
          {w.source === "human" && <span className="origin-tag win-origin-tag">Agregado por revisor</span>}
          {w.edited && <span className="origin-tag win-origin-tag">Editado</span>}
        </label>
        <div className="finding-head-actions">
          {!editing && (
            <button className="icon-btn ghost" onClick={onEdit} title="Editar acierto">
              <Pencil size={13} />
            </button>
          )}
        </div>
      </div>
      {isPinning && <p className="pin-hint">Hacé clic en la captura para ubicar este acierto.</p>}

      {editing ? (
        <div className="finding-edit">
          <label className="field">
            <span>Acierto</span>
            <textarea value={descDraft} onChange={(e) => setDescDraft(e.target.value)} rows={2} />
          </label>
          <div className="finding-edit-actions">
            <div className="finding-edit-actions-right">
              <button className="btn btn-secondary btn-sm" onClick={onCancelEdit}><X size={13} /> Cancelar</button>
              <button className="btn btn-approve btn-sm" onClick={save}><Save size={13} /> Guardar</button>
            </div>
          </div>
        </div>
      ) : (
        <p className="finding-issue">{w.description}</p>
      )}

      {!editing && (
        <div className="finding-foot">
          <PinControl anchor={w.anchor} pinNumber={pinNumber} isPinning={isPinning} onStartPin={onStartPin} onCancelPin={onCancelPin} onClearPin={onClearPin} />
          {hasDetails && (
            <button className={`details-toggle ${detailsOpen ? "is-open" : ""}`} onClick={() => setDetailsOpen((v) => !v)}>
              <span>Detalles</span> <ChevronDown size={10} />
            </button>
          )}
        </div>
      )}

      {!editing && detailsOpen && hasDetails && (
        <div className="finding-details">
          {w.principle && <p className="finding-principle win-principle">{w.principle}</p>}
          <div className="finding-details-tags">
            {w.heuristic && <HeuristicTag id={w.heuristic} />}
            {w.confidence && <span className="confidence-tag">Confianza {w.confidence}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// Formulario para sumar un win que la IA no detectó — mismo patrón que
// AddInsightForm.
function AddWinForm({ onAdd, onCancel, anchor, isPinning, onStartPin, onCancelPin, onClearPin }) {
  const [category, setCategory] = useState(FINDING_CATEGORIES[0]);
  const [confidence, setConfidence] = useState("alta");
  const [principle, setPrinciple] = useState("");
  const [description, setDescription] = useState("");

  const canSave = description.trim();

  const submit = () => {
    if (!canSave) return;
    onAdd({
      category,
      confidence,
      principle: principle.trim(),
      description: description.trim(),
      anchor: anchor || null,
    });
  };

  return (
    <div className="finding-row win-row add-insight-form">
      <div className="finding-head-actions" style={{ justifyContent: "flex-end" }}>
        <PinControl anchor={anchor} pinNumber={null} isPinning={isPinning} onStartPin={onStartPin} onCancelPin={onCancelPin} onClearPin={onClearPin} />
      </div>
      {isPinning && <p className="pin-hint">Hacé clic en la captura para ubicar este acierto nuevo.</p>}
      <div className="review-fields" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <label className="field">
          <span>Categoría</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {FINDING_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Confianza</span>
          <select value={confidence} onChange={(e) => setConfidence(e.target.value)}>
            {CONFIDENCE_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <label className="field">
        <span>Principio / fuente (opcional)</span>
        <input type="text" value={principle} onChange={(e) => setPrinciple(e.target.value)} placeholder="Ej. Refactoring UI — peso visual" />
      </label>
      <label className="field">
        <span>Acierto</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Qué está bien resuelto, específico y observable…" />
      </label>
      <div className="finding-edit-actions">
        <button className="btn btn-secondary btn-sm" onClick={onCancel}><X size={13} /> Cancelar</button>
        <button className="btn btn-approve btn-sm" disabled={!canSave} onClick={submit}><PlusCircle size={13} /> Agregar acierto</button>
      </div>
    </div>
  );
}

// Captura con overlay de pines numerados. En modo "pinning" (hay un
// pinTarget activo en DetailView), un clic sobre la imagen traduce la
// posición del mouse a porcentaje (x,y) relativo a la imagen y lo reporta al
// padre. El contenedor tiene alto mínimo/máximo fijo para que la captura
// siempre quede visible completa, sin importar cuántos hallazgos tenga el
// panel de al lado.
function ScreenshotWithPins({ src, pins, pinning, onPinClick }) {
  const imgRef = useRef(null);

  const handleClick = (e) => {
    if (!pinning || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    // Clampeado a 2-98 (no 0-100) para que el círculo del pin nunca quede
    // recortado por el overflow:hidden del marco cuando se marca justo en el borde.
    onPinClick({ x: Math.min(98, Math.max(2, x)), y: Math.min(98, Math.max(2, y)) });
  };

  return (
    <div className={`detail-img-frame ${pinning ? "is-pinning" : ""}`} onClick={handleClick}>
      <img ref={imgRef} src={src} alt="" className="detail-img" />
      {pins.map((p) => (
        <div
          key={p.key}
          className={`img-pin img-pin-${p.kind}`}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          {p.number != null ? p.number : "+"}
        </div>
      ))}
      {pinning && <div className="pin-frame-hint">Hacé clic sobre la captura para ubicar</div>}
    </div>
  );
}

function DetailView({ record, onBack, onUpdated, onDeleted, onOpenJourney }) {
  const [reviewer, setReviewer] = useState(record.reviewedBy || "");
  const [notes, setNotes] = useState(record.reviewNotes || "");
  const [saving, setSaving] = useState(false);
  const [findings, setFindings] = useState(() =>
    (record.critique?.findings || []).map((f) => ({ checked: false, source: "ai", anchor: null, ...f }))
  );
  const [wins, setWins] = useState(() =>
    (record.critique?.wins || []).map((w) => ({ checked: false, source: "ai", anchor: null, ...w }))
  );
  const [editingIndex, setEditingIndex] = useState(null);
  const [addingInsight, setAddingInsight] = useState(false);
  const [editingWinIndex, setEditingWinIndex] = useState(null);
  const [addingWin, setAddingWin] = useState(false);

  // Ubicación de pines sobre la captura: pinTarget identifica qué fila está
  // esperando el próximo clic en la imagen (un hallazgo/win existente por
  // índice, o el hallazgo/win nuevo que todavía no se guardó). Solo puede
  // haber un target activo a la vez.
  const [pinTarget, setPinTarget] = useState(null);
  const [newFindingAnchor, setNewFindingAnchor] = useState(null);
  const [newWinAnchor, setNewWinAnchor] = useState(null);

  // Cambiar de critique (volver al índice y abrir otro) no debe arrastrar el
  // estado de edición del anterior.
  useEffect(() => {
    setFindings((record.critique?.findings || []).map((f) => ({ checked: false, source: "ai", anchor: null, ...f })));
    setWins((record.critique?.wins || []).map((w) => ({ checked: false, source: "ai", anchor: null, ...w })));
    setEditingIndex(null);
    setAddingInsight(false);
    setEditingWinIndex(null);
    setAddingWin(false);
    setPinTarget(null);
    setNewFindingAnchor(null);
    setNewWinAnchor(null);
  }, [record.id]);

  const persistFindings = async (nextFindings) => {
    setFindings(nextFindings);
    const updated = { ...record, critique: { ...(record.critique || {}), findings: nextFindings, wins } };
    try {
      const result = await window.storage.set(`critique:${record.id}`, JSON.stringify(updated), true);
      if (!result) throw new Error("save failed");
      onUpdated(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const persistWins = async (nextWins) => {
    setWins(nextWins);
    const updated = { ...record, critique: { ...(record.critique || {}), findings, wins: nextWins } };
    try {
      const result = await window.storage.set(`critique:${record.id}`, JSON.stringify(updated), true);
      if (!result) throw new Error("save failed");
      onUpdated(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleChecked = (index) => {
    persistFindings(findings.map((f, i) => (i === index ? { ...f, checked: !f.checked } : f)));
  };

  const saveEdit = (index, patch) => {
    persistFindings(findings.map((f, i) => (i === index ? { ...f, ...patch, edited: true } : f)));
    setEditingIndex(null);
  };

  const deleteFinding = (index) => {
    persistFindings(findings.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const addInsight = (newFinding) => {
    persistFindings([...findings, { ...newFinding, source: "human", checked: false }]);
    setAddingInsight(false);
    setNewFindingAnchor(null);
  };

  const toggleWinChecked = (index) => {
    persistWins(wins.map((w, i) => (i === index ? { ...w, checked: !w.checked } : w)));
  };

  const saveWinEdit = (index, patch) => {
    persistWins(wins.map((w, i) => (i === index ? { ...w, ...patch, edited: true } : w)));
    setEditingWinIndex(null);
  };

  const addWin = (newWin) => {
    persistWins([...wins, { ...newWin, source: "human", checked: false }]);
    setAddingWin(false);
    setNewWinAnchor(null);
  };

  const clearFindingAnchor = (index) => {
    persistFindings(findings.map((f, i) => (i === index ? { ...f, anchor: null } : f)));
  };

  const clearWinAnchor = (index) => {
    persistWins(wins.map((w, i) => (i === index ? { ...w, anchor: null } : w)));
  };

  // Recibe el clic sobre la captura y lo aplica a lo que esté esperando un
  // pin en ese momento (un hallazgo/win ya guardado se persiste al toque; un
  // hallazgo/win en borrador solo actualiza el estado local hasta que se
  // agregue).
  const handleImagePinClick = (coords) => {
    if (!pinTarget) return;
    if (pinTarget.kind === "finding") {
      persistFindings(findings.map((f, i) => (i === pinTarget.index ? { ...f, anchor: coords } : f)));
    } else if (pinTarget.kind === "win") {
      persistWins(wins.map((w, i) => (i === pinTarget.index ? { ...w, anchor: coords } : w)));
    } else if (pinTarget.kind === "new-finding") {
      setNewFindingAnchor(coords);
    } else if (pinTarget.kind === "new-win") {
      setNewWinAnchor(coords);
    }
    setPinTarget(null);
  };

  // Numeración de pines: un solo contador compartido entre hallazgos y wins,
  // en el orden en que aparecen en sus listas — así cada círculo de la
  // captura tiene un número único sin importar si es una crítica o un
  // acierto. Los bordadores "+" son previews de un hallazgo/win que todavía
  // no se guardó.
  const { findingNumbers, winNumbers, pins } = useMemo(() => {
    let n = 0;
    const fn = [];
    const wn = [];
    const list = [];
    findings.forEach((f) => {
      if (f.anchor) {
        n += 1;
        fn.push(n);
        list.push({ key: `f${n}`, number: n, x: f.anchor.x, y: f.anchor.y, kind: "finding" });
      } else {
        fn.push(null);
      }
    });
    wins.forEach((w) => {
      if (w.anchor) {
        n += 1;
        wn.push(n);
        list.push({ key: `w${n}`, number: n, x: w.anchor.x, y: w.anchor.y, kind: "win" });
      } else {
        wn.push(null);
      }
    });
    if (newFindingAnchor) list.push({ key: "new-finding", number: null, x: newFindingAnchor.x, y: newFindingAnchor.y, kind: "finding" });
    if (newWinAnchor) list.push({ key: "new-win", number: null, x: newWinAnchor.x, y: newWinAnchor.y, kind: "win" });
    return { findingNumbers: fn, winNumbers: wn, pins: list };
  }, [findings, wins, newFindingAnchor, newWinAnchor]);

  const checkedCount = findings.filter((f) => f.checked).length;
  const allChecked = findings.length === 0 || checkedCount === findings.length;

  // Después de guardar (aprobar/rechazar/marcar pendiente) o borrar, no nos
  // quedamos parados en la misma pantalla — un mini loader confirma la
  // acción y manda de vuelta al índice, listo para revisar o agregar el
  // siguiente insight.
  const [redirecting, setRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("");

  const STATUS_REDIRECT_LABEL = { approved: "Aprobado", rejected: "Rechazado", pending: "Marcado pendiente" };

  const setStatus = async (status) => {
    if (status === "approved" && !allChecked) return;
    setSaving(true);
    const updated = {
      ...record,
      critique: { ...(record.critique || {}), findings, wins },
      status,
      reviewedBy: reviewer.trim(),
      reviewedAt: Date.now(),
      reviewNotes: notes.trim(),
    };
    try {
      const result = await window.storage.set(`critique:${record.id}`, JSON.stringify(updated), true);
      if (!result) throw new Error("save failed");
      onUpdated(updated);
      setRedirectMessage(STATUS_REDIRECT_LABEL[status] || "Guardado");
      setRedirecting(true);
      setTimeout(() => onBack(), 650);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("¿Borrar esta revisión del archivo compartido? Esto no se puede deshacer.")) return;
    try {
      await window.storage.delete(`critique:${record.id}`, true);
      setRedirectMessage("Eliminado");
      setRedirecting(true);
      setTimeout(() => onDeleted(record.id), 500);
    } catch (e) {
      console.error(e);
    }
  };

  const c = record.critique || {};
  const score = computeScore(c);
  const tags = record.contextTags || [];
  const methodologyUrl = useMemo(() => {
    try {
      return `${window.location.origin}${window.location.pathname}?view=how`;
    } catch (e) {
      return null;
    }
  }, []);

  return (
    <div className="detail-view">
      {redirecting && (
        <div className="detail-redirect-overlay">
          <Loader2 className="spin" size={20} />
          <p>{redirectMessage} — volviendo al índice…</p>
        </div>
      )}
      <div className="detail-toolbar">
        <button className="btn-link" onClick={onBack}><ArrowLeft size={14} /> Volver al índice</button>
        <button className="btn-link danger" onClick={remove}><Trash2 size={14} /> Borrar</button>
      </div>

      <div className="detail-header">
        <div>
          <h2 className="section-title">{record.title || "Sin título"}</h2>
          <p className="section-sub">
            Subido por {record.createdBy || "alguien anónimo"} · {formatDate(record.createdAt)}
            {record.criteriaVersion && <> · criterio {record.criteriaVersion}</>}
          </p>
          {record.journeyId && onOpenJourney && (
            <button className="journey-inline-badge" style={{ marginLeft: 0, marginTop: 6 }} onClick={() => onOpenJourney(record.journeyId)}>
              parte de un journey → ver flujo completo
            </button>
          )}
          {tags.length > 0 && (
            <div className="tag-chips" style={{ marginTop: 8 }}>
              {tags.map((t) => <span className="tag-chip static" key={t}>{t}</span>)}
            </div>
          )}
          {record.detectedScreen && (
            <p className="muted small" style={{ marginTop: 6 }}>
              Detectado: {record.detectedScreen.screenType || "—"} · {record.detectedScreen.platform || "—"}
              {record.detectedScreen.components?.length > 0 && <> · componentes: {record.detectedScreen.components.join(", ")}</>}
              {typeof record.matchedCriteriaIds !== "undefined" && (
                <> · {record.matchedCriteriaIds.length} criterio{record.matchedCriteriaIds.length === 1 ? "" : "s"} de la base aplicado{record.matchedCriteriaIds.length === 1 ? "" : "s"}</>
              )}
              {record.matchedPastCritiqueIds?.length > 0 && (
                <> · calibrada con {record.matchedPastCritiqueIds.length} crítica{record.matchedPastCritiqueIds.length === 1 ? "" : "s"} propia{record.matchedPastCritiqueIds.length === 1 ? "" : "s"} aprobada{record.matchedPastCritiqueIds.length === 1 ? "" : "s"}</>
              )}
            </p>
          )}
        </div>
        <StatusStamp status={record.status} size="lg" />
      </div>

      <div className="detail-grid">
        <div className="detail-image-col">
          <ScreenshotWithPins
            src={record.imageDataUrl}
            pins={pins}
            pinning={!!pinTarget}
            onPinClick={handleImagePinClick}
          />
        </div>

        <div className="detail-report-col">
          {score.criticalFail && (
            <div className="fail-banner">
              <strong>FALLO CRÍTICO</strong> — Usabilidad {score.usability}/50, por debajo
              del mínimo de 30. Ningún puntaje de dirección de arte compensa esto.
              {c.criticalFailReason && <> {c.criticalFailReason}</>}
            </div>
          )}

          <ScoreSummary score={score} methodologyUrl={methodologyUrl} />
          <p className="summary-text">{c.summary || "Sin resumen disponible."}</p>

          <h3 className="findings-title" style={{ marginTop: 18 }}>
            Hallazgos ({findings.length}) · {checkedCount}/{findings.length} revisados
          </h3>
          <div className="findings-list">
            {findings.map((f, i) => (
              <FindingRow
                key={i}
                finding={f}
                editing={editingIndex === i}
                pinNumber={findingNumbers[i]}
                isPinning={pinTarget?.kind === "finding" && pinTarget.index === i}
                onEdit={() => setEditingIndex(i)}
                onCancelEdit={() => setEditingIndex(null)}
                onSaveEdit={(patch) => saveEdit(i, patch)}
                onDelete={() => deleteFinding(i)}
                onToggleChecked={() => toggleChecked(i)}
                onStartPin={() => setPinTarget({ kind: "finding", index: i })}
                onCancelPin={() => setPinTarget(null)}
                onClearPin={() => clearFindingAnchor(i)}
              />
            ))}
            {addingInsight ? (
              <AddInsightForm
                onAdd={addInsight}
                onCancel={() => { setAddingInsight(false); setNewFindingAnchor(null); if (pinTarget?.kind === "new-finding") setPinTarget(null); }}
                anchor={newFindingAnchor}
                isPinning={pinTarget?.kind === "new-finding"}
                onStartPin={() => setPinTarget({ kind: "new-finding" })}
                onCancelPin={() => setPinTarget(null)}
                onClearPin={() => setNewFindingAnchor(null)}
              />
            ) : (
              <button className="btn btn-secondary btn-add-insight" onClick={() => setAddingInsight(true)}>
                <PlusCircle size={15} /> Agregar hallazgo
              </button>
            )}
          </div>

          <h3 className="findings-title wins-title">
            <ThumbsUp size={13} style={{ marginRight: 5, verticalAlign: -2 }} />
            Aciertos ({wins.length})
          </h3>
          <div className="findings-list wins-list">
            {wins.length === 0 && !addingWin && (
              <p className="muted small" style={{ marginBottom: 8 }}>Sin aciertos detectados todavía.</p>
            )}
            {wins.map((w, i) => (
              <WinRow
                key={i}
                win={w}
                editing={editingWinIndex === i}
                pinNumber={winNumbers[i]}
                isPinning={pinTarget?.kind === "win" && pinTarget.index === i}
                onEdit={() => setEditingWinIndex(i)}
                onCancelEdit={() => setEditingWinIndex(null)}
                onSaveEdit={(patch) => saveWinEdit(i, patch)}
                onToggleChecked={() => toggleWinChecked(i)}
                onStartPin={() => setPinTarget({ kind: "win", index: i })}
                onCancelPin={() => setPinTarget(null)}
                onClearPin={() => clearWinAnchor(i)}
              />
            ))}
            {addingWin ? (
              <AddWinForm
                onAdd={addWin}
                onCancel={() => { setAddingWin(false); setNewWinAnchor(null); if (pinTarget?.kind === "new-win") setPinTarget(null); }}
                anchor={newWinAnchor}
                isPinning={pinTarget?.kind === "new-win"}
                onStartPin={() => setPinTarget({ kind: "new-win" })}
                onCancelPin={() => setPinTarget(null)}
                onClearPin={() => setNewWinAnchor(null)}
              />
            ) : (
              <button className="btn btn-secondary btn-add-insight" onClick={() => setAddingWin(true)}>
                <PlusCircle size={15} /> Agregar acierto
              </button>
            )}
          </div>

          <div className="review-box">
            <h3 className="findings-title">Revisión humana</h3>
            <div className="review-fields">
              <label className="field">
                <span>Quién revisa</span>
                <input type="text" value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Tu nombre" />
              </label>
              <label className="field">
                <span>Notas (opcional)</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Comentarios sobre esta revisión…" />
              </label>
            </div>
            <div className="review-actions">
              <button
                className="btn btn-approve"
                disabled={saving || !allChecked}
                title={!allChecked ? "Marcá el check de todos los hallazgos antes de aprobar" : undefined}
                onClick={() => setStatus("approved")}
              >
                <Check size={15} /> Aprobar
              </button>
              <button className="btn btn-reject" disabled={saving} onClick={() => setStatus("rejected")}>
                <X size={15} /> Rechazar
              </button>
              <button className="btn btn-secondary" disabled={saving} onClick={() => setStatus("pending")}>
                <Clock size={15} /> Marcar pendiente
              </button>
            </div>
            {!allChecked && findings.length > 0 && (
              <p className="muted small" style={{ marginTop: 8 }}>
                Faltan marcar {findings.length - checkedCount} hallazgo{findings.length - checkedCount === 1 ? "" : "s"} antes de poder aprobar.
              </p>
            )}
            {record.reviewedBy && (
              <p className="muted small" style={{ marginTop: 8 }}>
                Última revisión por {record.reviewedBy} · {record.reviewedAt ? formatDate(record.reviewedAt) : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Fase 1 de journeys: agrupa y ordena pantallas de un mismo flujo, y da un
// lugar para navegarlas como conjunto. Cada pantalla sigue siendo su propia
// crítica completa e independiente (su propio DetailView, su propio estado
// de revisión/aprobación).
//
// Fase 2 (esto): una crítica MINI, propia del flujo, generada mandando las N
// imágenes juntas y en orden al modelo con JOURNEY_RUBRIC_PROMPT — que tiene
// instrucciones explícitas de NO repetir lo que ya cubre cada pantalla sola,
// solo lo que se ve comparándolas entre sí (consistencia, progreso,
// continuidad, redundancia, orden). Tiene su propio review humano (checks +
// aprobar/marcar pendiente, mismo patrón que DetailView) y, una vez
// aprobada, alimenta como ejemplo de calibración a futuras críticas de flujo
// (loadApprovedJourneyCritiques) — el mismo rol que cumple "corpus propio"
// para críticas de una sola pantalla. Deliberadamente NO se promueve sola a
// SEED_CRITERIA: pasar un hallazgo de flujo a criterio permanente de la
// documentación sigue siendo una decisión editorial humana explícita, fuera
// de este flujo.
function JourneyView({ journey, screens, onOpenScreen, onBack, onUpdated }) {
  const [critiquing, setCritiquing] = useState(false);
  const [error, setError] = useState(null);
  const [findings, setFindings] = useState(() => journey?.critique?.findings || []);
  const [wins, setWins] = useState(() => journey?.critique?.wins || []);
  const [reviewer, setReviewer] = useState(journey?.reviewedBy || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFindings(journey?.critique?.findings || []);
    setWins(journey?.critique?.wins || []);
    setReviewer(journey?.reviewedBy || "");
    setError(null);
  }, [journey?.id]);

  if (!journey) return null;
  const orderedScreens = journey.screenIds
    .map((id) => screens.find((s) => s.id === id))
    .filter(Boolean);
  const missingCount = journey.screenIds.length - orderedScreens.length;
  const checkedCount = findings.filter((f) => f.checked).length;
  const allChecked = findings.length === 0 || checkedCount === findings.length;

  const persist = async (patch) => {
    const updated = { ...journey, ...patch };
    const result = await window.storage.set(`journey:${journey.id}`, JSON.stringify(updated), true);
    if (!result) throw new Error("No se pudo guardar el journey.");
    onUpdated(updated);
    return updated;
  };

  const generateCritique = async () => {
    if (orderedScreens.length < 2) return;
    setCritiquing(true);
    setError(null);
    try {
      const approvedJourneys = await loadApprovedJourneyCritiques();
      const calibrationSupplement = formatApprovedJourneyCritiques(approvedJourneys);
      const imageBlocks = orderedScreens.map((s) => ({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: s.imageDataUrl.split(",")[1] },
      }));
      const stepsList = orderedScreens.map((s, i) => `Paso ${i + 1}: "${s.title || "sin título"}"`).join("\n");
      const response = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 3000,
          system: JOURNEY_RUBRIC_PROMPT + calibrationSupplement,
          messages: [
            {
              role: "user",
              content: [
                ...imageBlocks,
                {
                  type: "text",
                  text: `Este es un flujo ("${journey.title || "sin título"}") de ${orderedScreens.length} pantallas, en este orden:\n${stepsList}\n\nAnalizá el flujo completo siguiendo las reglas del sistema y respondé solo con el JSON.`,
                },
              ],
            },
          ],
        }),
      });
      const data = await response.json();
      const textBlock = (data.content || []).find((b) => b.type === "text");
      if (!textBlock) throw new Error("Sin respuesta de análisis.");
      const clean = textBlock.text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const findingsWithReviewState = (parsed.findings || []).map((f) => ({ ...f, steps: f.steps || [], checked: false, source: "ai" }));
      const winsWithReviewState = (parsed.wins || []).map((w) => ({ ...w, steps: w.steps || [], source: "ai" }));
      const updated = await persist({
        critique: { summary: parsed.summary || "", findings: findingsWithReviewState, wins: winsWithReviewState },
        status: "pending",
        reviewedBy: "",
        reviewedAt: null,
      });
      setFindings(updated.critique.findings);
      setWins(updated.critique.wins);
    } catch (e) {
      console.error(e);
      setError("No se pudo generar la crítica del flujo. Probá de nuevo.");
    } finally {
      setCritiquing(false);
    }
  };

  const toggleChecked = async (index) => {
    const nextFindings = findings.map((f, i) => (i === index ? { ...f, checked: !f.checked } : f));
    setFindings(nextFindings);
    try {
      await persist({ critique: { ...journey.critique, findings: nextFindings, wins } });
    } catch (e) {
      console.error(e);
    }
  };

  const [redirecting, setRedirecting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState("");
  const JOURNEY_STATUS_REDIRECT_LABEL = { approved: "Aprobado", pending: "Marcado pendiente" };

  const setJourneyStatus = async (status) => {
    if (status === "approved" && !allChecked) return;
    setSaving(true);
    try {
      await persist({
        status,
        reviewedBy: reviewer.trim(),
        reviewedAt: Date.now(),
      });
      setRedirectMessage(JOURNEY_STATUS_REDIRECT_LABEL[status] || "Guardado");
      setRedirecting(true);
      setTimeout(() => onBack(), 650);
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  return (
    <div className="detail-view">
      {redirecting && (
        <div className="detail-redirect-overlay">
          <Loader2 className="spin" size={20} />
          <p>{redirectMessage} — volviendo al índice…</p>
        </div>
      )}
      <div className="detail-toolbar">
        <button className="btn-link" onClick={onBack}><ArrowLeft size={14} /> Volver al índice</button>
      </div>

      <div className="detail-header">
        <div>
          <h2 className="section-title">{journey.title || "Journey sin título"}</h2>
          <p className="section-sub">
            Subido por {journey.createdBy || "alguien anónimo"} · {formatDate(journey.createdAt)} ·{" "}
            {orderedScreens.length} pantalla{orderedScreens.length === 1 ? "" : "s"} en orden
          </p>
          {journey.contextTags?.length > 0 && (
            <div className="tag-chips" style={{ marginTop: 8 }}>
              {journey.contextTags.map((t) => <span className="tag-chip static" key={t}>{t}</span>)}
            </div>
          )}
          {missingCount > 0 && (
            <p className="error-text" style={{ marginTop: 8 }}>
              {missingCount} pantalla{missingCount === 1 ? "" : "s"} de este journey ya no está{missingCount === 1 ? "" : "n"} disponible{missingCount === 1 ? "" : "s"} (borrada{missingCount === 1 ? "" : "s"} individualmente).
            </p>
          )}
        </div>
        {journey.critique && <StatusStamp status={journey.status} size="lg" />}
      </div>

      <p className="muted small" style={{ marginBottom: 14 }}>
        Cada pantalla de este flujo tiene además su propia crítica completa e independiente — hacé clic en cualquiera
        para ver su detalle.
      </p>

      <div className="journey-filmstrip">
        {orderedScreens.map((s, idx) => {
          const score = computeScore(s.critique);
          return (
            <button key={s.id} className="journey-screen-card" onClick={() => onOpenScreen(s.id)}>
              <div className="journey-screen-frame">
                <span className="journey-screen-index">{idx + 1}</span>
                <img src={s.imageDataUrl} alt="" className="journey-screen-thumb" />
              </div>
              <div className="journey-screen-caption">
                <span className="journey-screen-title">{s.title || "Sin título"}</span>
                <span className="journey-screen-meta">
                  <StatusStamp status={s.status} size="sm" />
                  {score.hasBlocks && (
                    <span className={`score-pill ${score.criticalFail ? "score-pill-fail" : ""}`}>
                      {score.total}/100
                    </span>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="journey-critique-section">
        <h3 className="criteria-card-title">Crítica del flujo</h3>
        {!journey.critique && !critiquing && (
          <div className="empty-state" style={{ padding: "24px 16px" }}>
            <p className="muted small" style={{ marginBottom: 10 }}>
              Todavía no hay una crítica de este flujo como conjunto (consistencia entre pasos, progreso, continuidad
              de contexto). Cada pantalla ya tiene la suya propia arriba — esto es adicional, mirando las{" "}
              {orderedScreens.length} juntas.
            </p>
            <button
              className="btn btn-primary"
              disabled={orderedScreens.length < 2}
              onClick={generateCritique}
            >
              Generar crítica del flujo
            </button>
          </div>
        )}
        {critiquing && (
          <p className="muted small"><Loader2 className="spin" size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />Analizando las {orderedScreens.length} pantallas juntas…</p>
        )}
        {error && <p className="error-text">{error}</p>}

        {journey.critique && !critiquing && (
          <>
            {journey.critique.summary && <p className="journey-critique-summary">{journey.critique.summary}</p>}

            {findings.length > 0 && (
              <>
                <p className="muted small" style={{ marginBottom: 8 }}>
                  Hallazgos de flujo ({findings.length}) · {checkedCount}/{findings.length} revisados
                </p>
                <div className="findings-list">
                  {findings.map((f, i) => (
                    <div key={i} className={`finding-row ${f.checked ? "is-checked" : ""}`} style={{ borderLeftColor: (SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.moderada).border }}>
                      <div className="finding-head">
                        <label className="finding-check">
                          <input type="checkbox" checked={!!f.checked} onChange={() => toggleChecked(i)} />
                          <span className="finding-category">{f.category}</span>
                        </label>
                        <div className="finding-head-actions">
                          <SeverityBadge severity={f.severity} />
                          {f.steps?.length > 0 && (
                            <span className="confidence-tag">Paso{f.steps.length === 1 ? "" : "s"} {f.steps.join(", ")}</span>
                          )}
                        </div>
                      </div>
                      <div className="finding-meta-row">
                        {f.principle && <p className="finding-principle">{f.principle}</p>}
                        {f.type && <TypeTag type={f.type} />}
                        {f.confidence && <span className="confidence-tag">Confianza {f.confidence}</span>}
                      </div>
                      <p className="finding-issue">{f.issue}</p>
                      {f.recommendation && <p className="finding-recommendation">→ {f.recommendation}</p>}
                    </div>
                  ))}
                </div>
              </>
            )}

            {wins.length > 0 && (
              <>
                <p className="muted small" style={{ margin: "16px 0 8px" }}>Aciertos de flujo ({wins.length})</p>
                <div className="findings-list">
                  {wins.map((w, i) => (
                    <div key={i} className="finding-row win-row">
                      <div className="finding-head">
                        <span className="finding-category">{w.category}</span>
                        {w.steps?.length > 0 && (
                          <span className="confidence-tag">Paso{w.steps.length === 1 ? "" : "s"} {w.steps.join(", ")}</span>
                        )}
                      </div>
                      {w.principle && <p className="finding-principle">{w.principle}</p>}
                      <p className="finding-issue">{w.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="review-fields" style={{ marginTop: 18 }}>
              <label className="field">
                <span>Revisado por</span>
                <input type="text" value={reviewer} onChange={(e) => setReviewer(e.target.value)} placeholder="Tu nombre" />
              </label>
            </div>
            <div className="review-actions" style={{ marginTop: 10 }}>
              <button
                className="btn btn-primary"
                disabled={saving || !allChecked}
                title={!allChecked ? "Marcá el check de todos los hallazgos antes de aprobar" : undefined}
                onClick={() => setJourneyStatus("approved")}
              >
                <Check size={15} /> Aprobar crítica del flujo
              </button>
              <button className="btn btn-secondary" disabled={saving} onClick={() => setJourneyStatus("pending")}>
                <Clock size={15} /> Marcar pendiente
              </button>
              <button className="btn-link" disabled={critiquing} onClick={generateCritique}>Regenerar</button>
            </div>
            {!allChecked && findings.length > 0 && (
              <p className="muted small" style={{ marginTop: 8 }}>
                Faltan marcar {findings.length - checkedCount} hallazgo{findings.length - checkedCount === 1 ? "" : "s"} antes de poder aprobar.
              </p>
            )}
            {journey.reviewedBy && (
              <p className="muted small" style={{ marginTop: 8 }}>
                Última revisión por {journey.reviewedBy} · {journey.reviewedAt ? formatDate(journey.reviewedAt) : ""}
              </p>
            )}
          </>
        )}
      </div>

      <style>{`
        /* Filmstrip estilo Mobbin: pantallas completas, sin recortar, en fila
           horizontal con scroll — antes eran tarjetas de 148px con el
           screenshot forzado a 110px de alto (object-fit:cover), lo que
           recortaba y afeaba cualquier pantalla real. */
        .journey-filmstrip {
          display: flex; gap: 20px; overflow-x: auto; padding: 6px 4px 16px;
          scroll-snap-type: x proximity;
        }
        .journey-screen-card {
          display: flex; flex-direction: column; gap: 8px; flex: 0 0 auto; width: 240px;
          padding: 0; border: none; background: transparent; cursor: pointer; font-family: inherit; text-align: left;
          scroll-snap-align: start;
        }
        .journey-screen-frame {
          position: relative; height: 480px; width: 240px;
          display: flex; align-items: flex-start; justify-content: center; overflow: hidden;
          background: var(--paper-sunken); border: 1px solid var(--rule); border-radius: var(--radius-lg);
        }
        .journey-screen-card:hover .journey-screen-frame { border-color: var(--rule-strong); box-shadow: 0 4px 16px rgba(20, 20, 24, 0.08); }
        .journey-screen-index {
          position: absolute; top: 10px; left: 10px; width: 22px; height: 22px; border-radius: 50%;
          background: var(--accent); color: var(--accent-fg); font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(20, 20, 24, 0.25); z-index: 1;
        }
        .journey-screen-thumb {
          width: 100%; height: 100%; object-fit: contain; object-position: top center;
        }
        .journey-screen-caption { display: flex; flex-direction: column; gap: 4px; padding: 0 2px; width: 240px; }
        .journey-screen-title {
          font-size: 12.5px; font-weight: 600; color: var(--ink);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .journey-screen-meta { display: flex; align-items: center; gap: 6px; }
        .journey-critique-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--rule); }
        .journey-critique-summary { font-size: 14px; color: var(--ink); margin: 4px 0 16px; line-height: 1.5; }
        .findings-list { display: flex; flex-direction: column; gap: 10px; }
        .finding-issue { font-size: 13.5px; color: var(--ink); margin: 6px 0 0; line-height: 1.45; }
        .finding-recommendation { font-size: 13px; color: var(--ink-soft); margin: 4px 0 0; line-height: 1.4; }
      `}</style>
    </div>
  );
}

// Lee ?view=how (o ?view=criteria) al montar para poder abrir la
// metodología en una pestaña nueva desde un link real — la app no tiene
// routing propio, así que esta es la única forma de deep-linkear una vista
// sin reconstruir todo el estado.
function getInitialViewFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    if (v === "how" || v === "criteria") return v;
  } catch (e) {
    // sin acceso a location (SSR, sandbox) — cae al índice
  }
  return "index";
}

export default function UICritiqueRepo() {
  const [view, setView] = useState(getInitialViewFromUrl);
  const [critiques, setCritiques] = useState([]);
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedJourneyId, setSelectedJourneyId] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const listResult = await window.storage.list("critique:", true);
      const keys = listResult?.keys || [];
      const [items, journeyRecords] = await Promise.all([
        Promise.all(keys.map((key) => window.storage.get(key, true).catch(() => null))),
        loadAllJourneys().catch((e) => { console.error(e); return []; }),
      ]);
      const records = [];
      for (const item of items) {
        if (!item?.value) continue;
        try {
          records.push(JSON.parse(item.value));
        } catch (e) {
          // skip unreadable entries
        }
      }
      records.sort((a, b) => b.createdAt - a.createdAt);
      setCritiques(records);
      setJourneys(journeyRecords);
    } catch (e) {
      console.error(e);
      setCritiques([]);
      setJourneys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openDetail = (id) => { setSelectedId(id); setView("detail"); };
  const openJourney = (id) => { setSelectedJourneyId(id); setView("journey-detail"); };
  const handleSaved = (record) => {
    setCritiques((prev) => [record, ...prev]);
    setSelectedId(record.id);
    setView("detail");
  };
  // Cierre de un lote de varias capturas: a diferencia de una subida
  // individual (que salta directo al detalle), acá no hay "la" crítica a
  // abrir — vuelve al índice con todas las nuevas arriba de la lista, para
  // que se revisen una por una desde ahí.
  const handleSavedBatch = (records) => {
    setCritiques((prev) => [...records, ...prev]);
    setView("index");
  };
  // Cierre de un journey: las N pantallas ya quedaron guardadas como
  // críticas individuales (con journeyId apuntando al registro nuevo) más el
  // registro liviano de journey en sí — salta directo a verlas como flujo
  // ordenado, no al índice plano.
  const handleSavedJourney = (journeyRecord, screenRecords) => {
    setCritiques((prev) => [...screenRecords, ...prev]);
    setJourneys((prev) => [journeyRecord, ...prev]);
    setSelectedJourneyId(journeyRecord.id);
    setView("journey-detail");
  };
  const handleUpdated = (updated) => {
    setCritiques((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };
  const handleJourneyUpdated = (updated) => {
    setJourneys((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  };
  const handleDeleted = (id) => {
    setCritiques((prev) => prev.filter((c) => c.id !== id));
    setView("index");
  };

  const selected = critiques.find((c) => c.id === selectedId);

  return (
    <div className="app">
      <style>{`
        :root {
          --ink: #1a1a1e;
          --ink-soft: #63636b;
          --ink-faint: #9a9aa1;
          --paper: #f7f8f8;
          --paper-raised: #ffffff;
          --paper-sunken: #f1f1f2;
          --rule: rgba(20, 20, 24, 0.09);
          --rule-strong: rgba(20, 20, 24, 0.15);
          --accent: #52525b;
          --accent-fg: #ffffff;
          --accent-soft: #e9e9ec;
          --accent-soft-fg: #3f3f46;
          --danger: #b3261e;
          --danger-soft: #fbeeed;
          --danger-soft-fg: #a5301f;
          --success: #1f6b4a;
          --success-soft: #edf5f1;
          --success-soft-fg: #1f6b4a;
          --sev-mayor: #b3261e;
          --sev-moderada: #8a5a12;
          --sev-menor: #6b7280;
          --type-violacion: #b3261e;
          --type-riesgo: #8a5a12;
          --type-hipotesis: #5b4e86;
          --type-convencion: #1f6b4a;
          --type-preferencia: #6b7280;
          --radius-sm: 7px;
          --radius-md: 10px;
          --radius-lg: 14px;
          --shadow-popover: 0 6px 20px rgba(20, 20, 24, 0.12), 0 2px 6px rgba(20, 20, 24, 0.06);
        }
        /* html/body/#root pintados del mismo --paper que .app: sin esto, en
           pantallas donde el contenido no llega a llenar el viewport (ej. el
           índice vacío) se veía un corte de tono entre el fondo de .app y el
           blanco por defecto del body debajo. */
        html, body, #root {
          margin: 0;
          min-height: 100%;
          background: var(--paper);
        }
        .app {
          font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif;
          -webkit-font-smoothing: antialiased;
          background: var(--paper);
          color: var(--ink);
          min-height: 100vh;
          max-width: 1180px;
          margin: 0 auto;
          padding: 48px 40px 80px;
          box-sizing: border-box;
          font-size: 14px;
          line-height: 1.5;
        }
        .app * { box-sizing: border-box; }
        .app h1, .app h2, .app h3 {
          font-family: inherit;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin: 0;
        }
        .masthead {
          display: flex; justify-content: space-between; align-items: flex-end;
          border-bottom: 1px solid var(--rule); padding-bottom: 24px; margin-bottom: 40px;
        }
        .masthead h1 { font-size: 19px; font-weight: 600; }
        .masthead .eyebrow {
          font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--ink-faint); font-weight: 650; margin-bottom: 7px;
        }
        .masthead .kicker { font-size: 13px; color: var(--ink-soft); margin-top: 6px; }
        .section-title { font-size: 16px; font-weight: 600; letter-spacing: -0.005em; }
        .section-sub { font-size: 13px; color: var(--ink-soft); margin: 6px 0 0; }
        .index-toolbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; gap: 12px; flex-wrap: wrap; }
        .btn {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 13px; font-weight: 550; padding: 9px 16px;
          border-radius: var(--radius-sm); border: 1px solid var(--rule-strong); cursor: pointer;
          background: var(--paper-raised); color: var(--ink);
          transition: background 0.12s ease, border-color 0.12s ease;
        }
        .btn:hover:not(:disabled) { background: var(--paper-sunken); border-color: var(--ink-faint); }
        .btn:active:not(:disabled) { transform: translateY(0.5px); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-primary { background: var(--accent); color: var(--accent-fg); border-color: var(--accent); }
        .btn-primary:hover:not(:disabled) { background: var(--accent); filter: brightness(1.07); border-color: var(--accent); }
        .btn-secondary { background: transparent; }
        .btn-secondary:hover:not(:disabled) { background: var(--paper-sunken); }
        .btn-block { width: 100%; justify-content: center; margin-top: 4px; }
        .btn-approve { background: var(--paper-raised); border-color: rgba(31, 107, 74, 0.35); color: var(--success-soft-fg); }
        .btn-approve:hover:not(:disabled) { background: var(--success-soft); }
        .btn-reject { background: var(--paper-raised); border-color: rgba(179, 38, 30, 0.32); color: var(--danger-soft-fg); }
        .btn-reject:hover:not(:disabled) { background: var(--danger-soft); }
        .btn-link {
          background: none; border: none; cursor: pointer; font-size: 12.5px;
          color: var(--ink-soft); display: inline-flex; align-items: center; gap: 4px;
          padding: 0; font-weight: 600; margin-bottom: 18px;
        }
        .btn-link:hover { color: var(--accent); }
        .btn-link.danger:hover { color: var(--danger); }
        .empty-state {
          border: 1px dashed var(--rule-strong); border-radius: var(--radius-md); padding: 64px 20px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          color: var(--ink-soft); font-size: 14px; text-align: center; background: transparent;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .index-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13.5px; }
        .index-table thead th {
          text-align: left; font-size: 10.5px; letter-spacing: 0.07em; text-transform: uppercase;
          color: var(--ink-faint); border-bottom: 1px solid var(--rule); padding: 0 10px 12px;
          font-weight: 650;
        }
        .index-table tbody tr { cursor: pointer; border-bottom: 1px solid var(--rule); transition: background 0.1s ease; }
        .index-table tbody tr:hover { background: var(--paper-sunken); }
        .index-table td { padding: 16px 10px; vertical-align: middle; }
        .thumb-cell { width: 56px; }
        .thumb { width: 48px; height: 34px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--rule); display: block; }
        .title-cell { font-weight: 550; }
        .journeys-shelf { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
        .journey-shelf-card {
          display: flex; flex-direction: column; align-items: flex-start; gap: 3px; width: 200px;
          padding: 12px 14px; border: 1px solid var(--rule); border-radius: var(--radius-md);
          background: var(--paper-raised); cursor: pointer; font-family: inherit; text-align: left;
        }
        .journey-shelf-card:hover { border-color: var(--accent); }
        .journey-shelf-badge {
          font-size: 9.5px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
          color: var(--accent-soft-fg); background: var(--accent-soft); padding: 2px 7px; border-radius: 999px;
        }
        .journey-shelf-title { font-size: 13px; font-weight: 600; color: var(--ink); margin-top: 2px; }
        .journey-inline-badge {
          margin-left: 8px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase;
          color: var(--accent-soft-fg); background: var(--accent-soft); border: none; border-radius: 999px;
          padding: 2px 7px; cursor: pointer; vertical-align: middle;
        }
        .journey-inline-badge:hover { background: var(--accent); color: var(--accent-fg); }
        .muted { color: var(--ink-soft); }
        .small { font-size: 11.5px; }
        .score-pill {
          font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 12px;
          background: transparent; color: var(--ink); padding: 3px 0; border-radius: 0;
          font-weight: 600;
        }
        .score-pill-fail { color: var(--danger); font-weight: 700; }
        .stamp {
          display: inline-block; border: 1px solid; border-radius: var(--radius-sm);
          font-family: "SF Mono", Menlo, Consolas, monospace; font-weight: 650;
          letter-spacing: 0.03em; opacity: 0.9;
        }
        .stamp-sm { font-size: 9px; padding: 2px 7px; }
        .stamp-lg { font-size: 11.5px; padding: 5px 11px; }
        .new-view, .detail-view { max-width: 100%; }
        .form-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 32px; margin-top: 24px; }
        .upload-zone {
          display: block; border: 1px dashed var(--rule-strong); border-radius: var(--radius-md);
          min-height: 260px; cursor: pointer; overflow: hidden; background: var(--paper-raised);
          transition: border-color 0.12s ease;
        }
        .upload-zone:hover { border-color: var(--accent); }
        .upload-zone.has-image {
          border-style: solid; border-color: var(--rule);
          min-height: 420px; max-height: calc(100vh - 220px);
          display: flex; align-items: center; justify-content: center;
          background: var(--paper-sunken);
        }
        .upload-placeholder {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 9px; height: 260px; color: var(--ink-soft); font-size: 13px; text-align: center; padding: 0 20px;
        }
        .upload-zone.is-compact { min-height: 96px; }
        .upload-zone.is-compact .upload-placeholder { height: 96px; gap: 5px; }
        .preview-img {
          max-width: 100%; max-height: calc(100vh - 220px); width: auto; height: auto;
          object-fit: contain; display: block;
        }
        .upload-items-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
        .upload-item-row {
          display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid var(--rule);
          border-radius: var(--radius-sm); background: var(--paper-raised);
        }
        .upload-item-row.status-error { border-color: rgba(179, 38, 30, 0.35); }
        .upload-item-row.status-done { border-color: rgba(31, 107, 74, 0.3); }
        .upload-item-thumb {
          width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover;
          flex-shrink: 0; background: var(--paper-sunken); border: 1px solid var(--rule);
        }
        .upload-item-thumb-empty { display: block; }
        .upload-item-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
        .upload-item-title-input {
          font-family: inherit; font-size: 13px; padding: 5px 8px; border-radius: var(--radius-sm);
          border: 1px solid transparent; background: transparent; color: var(--ink);
        }
        .upload-item-title-input:hover, .upload-item-title-input:focus {
          border-color: var(--rule); background: var(--paper-sunken); outline: none;
        }
        .upload-item-status {
          display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 0 8px; color: var(--ink-faint);
        }
        .upload-item-status.status-done { color: var(--success); }
        .upload-item-status.status-error { color: var(--danger); }
        .upload-item-status.status-analyzing { color: var(--accent); }
        .upload-item-remove { flex-shrink: 0; }
        .journey-toggle {
          display: flex; align-items: flex-start; gap: 8px; margin-top: 12px; padding: 10px 12px;
          border: 1px solid var(--rule); border-radius: var(--radius-sm); background: var(--paper-sunken);
          font-size: 12.5px; color: var(--ink-soft); cursor: pointer;
        }
        .journey-toggle input { margin-top: 2px; flex-shrink: 0; }
        .journey-title-input {
          width: 100%; box-sizing: border-box; margin-top: 8px; font-family: inherit; font-size: 13px;
          padding: 8px 10px; border-radius: var(--radius-sm); border: 1px solid var(--rule-strong);
          background: var(--paper-raised); color: var(--ink);
        }
        .upload-item-reorder {
          display: flex; flex-direction: column; align-items: center; gap: 1px; flex-shrink: 0; width: 22px;
        }
        .upload-item-order-index { font-size: 10.5px; font-weight: 650; color: var(--ink-faint); margin-bottom: 1px; }
        .upload-item-reorder .icon-btn { width: 18px; height: 16px; font-size: 9px; line-height: 1; padding: 0; }
        .field-col { display: flex; flex-direction: column; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 600; color: var(--ink-soft); }
        .field input, .field textarea {
          font-family: inherit; font-size: 14px; padding: 10px 12px; border-radius: var(--radius-sm);
          border: 1px solid var(--rule-strong); background: var(--paper-raised); color: var(--ink);
          font-weight: 400; transition: border-color 0.12s ease, box-shadow 0.12s ease;
        }
        .field input:focus, .field textarea:focus {
          outline: none; border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-soft);
        }
        .error-text { color: var(--danger); font-size: 12.5px; }
        .tag-chips { display: flex; flex-wrap: wrap; gap: 7px; }
        .tag-chip {
          font-size: 11.5px; font-weight: 550; padding: 6px 11px; border-radius: var(--radius-sm);
          border: 1px solid var(--rule-strong); background: var(--paper-raised); color: var(--ink-soft);
          cursor: pointer; transition: all 0.1s ease;
        }
        .tag-chip:hover { border-color: var(--accent); color: var(--accent); }
        .tag-chip.active { background: var(--accent); border-color: var(--accent); color: var(--accent-fg); }
        .tag-chip.static { cursor: default; background: var(--paper-sunken); color: var(--ink-soft); border-color: transparent; }
        .fail-banner {
          background: var(--danger-soft); border: 1px solid transparent; color: var(--danger-soft-fg);
          border-radius: var(--radius-md); padding: 14px 16px; font-size: 13px; line-height: 1.5;
          margin-bottom: 20px;
        }
        .fail-banner strong { color: var(--danger); letter-spacing: 0.02em; }
        .score-bar-row { font-size: 11.5px; }
        .score-bar-label { display: flex; justify-content: space-between; margin-bottom: 4px; font-weight: 600; }
        .score-bar-track { height: 4px; background: var(--paper-sunken); border-radius: 2px; overflow: hidden; }
        .score-bar-fill { height: 100%; border-radius: 2px; }
        /* ---- resumen de puntaje simplificado ---- */
        .score-summary { background: var(--paper-raised); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: 16px 18px; margin-bottom: 18px; }
        .score-summary-legacy { padding: 12px 14px; }
        .score-main { display: flex; align-items: center; gap: 16px; }
        .score-total { line-height: 1; background: var(--ink); color: var(--paper); border-radius: var(--radius-md); padding: 10px 14px; text-align: center; min-width: 62px; flex-shrink: 0; }
        .score-total-number { font-size: 22px; font-weight: 650; letter-spacing: -0.01em; }
        .score-total-max { font-size: 11.5px; opacity: 0.85; }
        .score-main-text { flex: 1; display: flex; }
        .score-toggle {
          display: inline-flex; align-items: center; gap: 5px; font-family: inherit; font-size: 12px; font-weight: 650;
          color: var(--accent); background: transparent; border: none; cursor: pointer; padding: 4px 0;
        }
        .score-toggle svg { transition: transform 0.15s ease; }
        .score-toggle.is-open svg { transform: rotate(180deg); }
        .score-detail { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--rule); display: flex; flex-direction: column; gap: 14px; }
        .score-block-row { display: flex; flex-direction: column; gap: 5px; }
        .score-block-explain { font-size: 11.5px; color: var(--ink-faint); margin: 0; line-height: 1.4; }
        .score-methodology-link { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--accent); font-weight: 650; text-decoration: none; align-self: flex-start; }
        .score-methodology-link:hover { text-decoration: underline; }
        .detail-redirect-overlay {
          position: fixed; inset: 0; z-index: 60; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
          background: rgba(247, 248, 248, 0.9); backdrop-filter: blur(2px);
        }
        .detail-redirect-overlay p { font-size: 13px; font-weight: 650; color: var(--ink-soft); margin: 0; }
        .detail-toolbar { display: flex; justify-content: space-between; align-items: center; }
        .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; gap: 12px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1.3fr; gap: 32px; }
        .detail-image-col { position: sticky; top: 24px; align-self: start; }
        .detail-img-frame {
          position: relative; display: flex; align-items: center; justify-content: center;
          min-height: 320px; max-height: calc(100vh - 120px); overflow: hidden;
          background: var(--paper-sunken); border: 1px solid var(--rule); border-radius: var(--radius-md);
        }
        .detail-img-frame.is-pinning { cursor: crosshair; outline: 2px solid var(--accent); outline-offset: 2px; }
        .detail-img { max-width: 100%; max-height: calc(100vh - 120px); width: auto; height: auto; display: block; object-fit: contain; }
        .pin-frame-hint {
          position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
          background: var(--ink); color: var(--paper); font-size: 11.5px; font-weight: 600;
          padding: 6px 12px; border-radius: var(--radius-sm); box-shadow: var(--shadow-popover); pointer-events: none;
          white-space: nowrap;
        }
        .img-pin {
          position: absolute; width: 20px; height: 20px; border-radius: 50%;
          transform: translate(-50%, -50%);
          display: flex; align-items: center; justify-content: center;
          font-size: 10.5px; font-weight: 700; color: #fff;
          border: 2px solid #fff; box-shadow: 0 1px 4px rgba(20, 20, 24, 0.3);
          pointer-events: none;
        }
        .img-pin-finding { background: var(--danger); }
        .img-pin-win { background: var(--success); }
        /* ---- control de ubicación único (reemplaza badge + botón pin + botón quitar) ---- */
        .location-control { position: relative; }
        .location-btn {
          display: inline-flex; align-items: center; gap: 6px; font-family: inherit; font-size: 11px; font-weight: 600;
          background: transparent; border: 1px dashed var(--rule-strong); color: var(--ink-faint);
          padding: 4px 10px 4px 8px; border-radius: 20px; cursor: pointer;
        }
        .location-btn:hover { color: var(--ink-soft); border-color: var(--ink-faint); }
        .location-btn.has-pin { border: 1px solid var(--accent-soft-fg); background: var(--accent-soft); color: var(--accent-soft-fg); }
        .location-btn.is-pinning { border: 1px solid var(--accent); background: var(--accent); color: var(--accent-fg); }
        .location-menu {
          position: absolute; bottom: 32px; left: 0; z-index: 5; min-width: 140px;
          background: var(--paper-raised); border: 1px solid var(--rule-strong); border-radius: var(--radius-sm);
          box-shadow: 0 6px 20px rgba(20, 20, 24, 0.14); padding: 5px; display: flex; flex-direction: column; gap: 1px;
        }
        .overflow-item {
          display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: transparent; border: none;
          font-family: inherit; font-size: 12px; color: var(--ink); padding: 7px 9px; border-radius: 6px; cursor: pointer;
        }
        .overflow-item:hover { background: var(--paper-sunken); }
        .overflow-item.danger { color: var(--danger-soft-fg); }
        .overflow-item.danger:hover { background: var(--danger-soft); }
        .pin-hint { font-size: 11.5px; color: var(--accent); font-weight: 600; margin: -2px 0 8px; }
        .summary-text { font-size: 14.5px; line-height: 1.6; margin: 0; padding-top: 4px; color: var(--ink-soft); }
        .findings-title { font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--ink-faint); font-weight: 650; margin-bottom: 14px; }
        .findings-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 32px; }
        .finding-row { border: 1px solid var(--rule); background: var(--paper-raised); padding: 16px 18px; border-radius: var(--radius-md); }
        .finding-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; }
        .finding-category { font-size: 12.5px; font-weight: 650; }
        .severity-badge {
          display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 650;
          padding: 3px 9px 3px 7px; border-radius: 20px; border: 1px solid; background: transparent; white-space: nowrap;
        }
        .severity-badge.is-blocker { font-weight: 700; }
        .severity-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .finding-principle {
          font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 10.5px;
          color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.03em;
          margin: 0;
        }
        .finding-meta-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
        .finding-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--rule); }
        .finding-details { margin-top: 10px; padding: 10px 12px; background: var(--paper-sunken); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 8px; }
        .finding-details-tags { display: flex; gap: 6px; flex-wrap: wrap; }
        .finding-details .finding-principle { text-transform: none; }
        .details-toggle {
          display: inline-flex; align-items: center; gap: 4px; font-family: inherit; font-size: 11.5px; font-weight: 600;
          background: transparent; border: none; color: var(--ink-faint); cursor: pointer; padding: 4px 2px;
        }
        .details-toggle:hover { color: var(--ink-soft); }
        .details-toggle svg { transition: transform 0.15s ease; }
        .details-toggle.is-open svg { transform: rotate(180deg); }
        .type-tag {
          font-size: 10px; font-weight: 650; padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid; background: transparent;
        }
        .confidence-tag {
          font-size: 10.5px; color: var(--ink-faint); font-style: italic;
        }
        .heuristic-tag {
          font-size: 10px; font-weight: 550; padding: 2px 8px; border-radius: var(--radius-sm);
          border: 1px solid var(--rule); color: var(--ink-soft); background: var(--paper-sunken);
        }
        .validation-note {
          font-size: 12.5px; margin: 10px 0 0; line-height: 1.5; padding: 10px 12px;
          background: var(--paper-sunken); border-radius: var(--radius-sm); color: var(--ink-soft);
        }
        .finding-issue { font-size: 13.5px; margin: 0 0 5px; line-height: 1.5; }
        .finding-rec { font-size: 13px; margin: 0; line-height: 1.5; color: var(--ink-soft); }
        .finding-row.is-checked { opacity: 0.6; }
        .finding-check { display: flex; align-items: center; gap: 9px; cursor: pointer; }
        .finding-check input[type="checkbox"] { width: 15px; height: 15px; cursor: pointer; accent-color: var(--accent); }
        .finding-head-actions { display: flex; align-items: center; gap: 6px; }
        .icon-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 26px; height: 26px; border-radius: var(--radius-sm);
          border: 1px solid var(--rule); background: transparent; color: var(--ink-soft);
          cursor: pointer;
        }
        .icon-btn:hover { background: var(--paper-sunken); color: var(--ink); border-color: var(--rule-strong); }
        .icon-btn.ghost { border-color: transparent; color: var(--ink-faint); }
        .icon-btn.ghost:hover { background: var(--paper-sunken); color: var(--ink); border-color: transparent; }
        .origin-tag {
          font-size: 10px; font-weight: 600; color: var(--ink-soft); background: var(--paper-sunken);
          padding: 1px 7px; border-radius: var(--radius-sm); margin-left: 8px; white-space: nowrap;
        }
        .finding-edit { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
        .finding-edit-actions { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 12px; }
        .finding-edit-actions-right { display: flex; gap: 8px; margin-left: auto; }
        .btn-ghost-danger { display: inline-flex; align-items: center; gap: 6px; background: transparent; border: 1px solid transparent; color: var(--danger-soft-fg); }
        .btn-ghost-danger:hover { background: var(--danger-soft); border-color: transparent; }
        .btn-sm { padding: 7px 11px; font-size: 12.5px; }
        .btn-add-insight { align-self: flex-start; }
        .add-insight-form { display: flex; flex-direction: column; gap: 12px; border-style: dashed; }
        .wins-title { margin-top: 6px; }
        .win-row { background: var(--paper-raised); }
        .win-row .finding-principle { color: var(--success); }
        .win-origin-tag { color: var(--success-soft-fg); background: var(--success-soft); }
        .wins-list .btn-add-insight { margin-top: 2px; }
        .review-box { border-top: 1px solid var(--rule); padding-top: 24px; }
        .review-fields { display: grid; grid-template-columns: 1fr 1.4fr; gap: 14px; margin-bottom: 16px; }
        .review-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .masthead-actions { display: flex; gap: 8px; }
        .criteria-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .version-tag {
          font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 10.5px;
          background: var(--paper-sunken); color: var(--ink-soft); padding: 3px 9px; border-radius: var(--radius-sm);
        }
        .skill-download-cta { margin-left: auto; }
        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(20, 19, 23, 0.42);
          display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 50;
        }
        .modal-box {
          background: var(--paper-raised); border: 1px solid var(--rule); border-radius: var(--radius-lg);
          box-shadow: var(--shadow-popover); padding: 24px 26px; width: 100%; max-width: 560px;
          max-height: calc(100vh - 60px); overflow-y: auto;
        }
        .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .modal-title { font-size: 15px; font-weight: 650; margin: 0; }
        .modal-meta-list { display: flex; flex-direction: column; gap: 12px; padding: 14px 0; border-top: 1px solid var(--rule); border-bottom: 1px solid var(--rule); }
        .modal-meta-row { display: flex; flex-direction: column; gap: 3px; font-size: 12.5px; line-height: 1.4; }
        .modal-meta-row strong { font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 12px; }
        .modal-disclaimer {
          display: flex; align-items: flex-start; gap: 6px; font-size: 11.5px; color: var(--ink-soft);
          background: var(--paper-sunken); border-radius: var(--radius-sm); padding: 9px 11px; margin: 14px 0 0;
        }
        .modal-warning {
          font-size: 11.5px; color: var(--danger-soft-fg); background: var(--danger-soft);
          border-radius: var(--radius-sm); padding: 9px 11px; margin: 14px 0 0; line-height: 1.5;
        }
        .modal-client-material {
          margin-top: 16px; padding: 14px 16px; border: 1px dashed var(--rule-strong); border-radius: var(--radius-md);
        }
        .modal-client-title { font-size: 12.5px; font-weight: 650; margin: 0 0 6px; }
        .modal-file-trigger { display: inline-flex; cursor: pointer; }
        .modal-file-list { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .modal-file-item {
          background: var(--paper-sunken); border-radius: var(--radius-sm); padding: 6px 8px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .modal-file-row { display: flex; align-items: center; gap: 8px; font-size: 12px; }
        .modal-file-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink); }
        .modal-file-size { color: var(--ink-faint); font-size: 11px; white-space: nowrap; }
        .modal-file-role-row { display: flex; align-items: center; gap: 6px; }
        .modal-file-role-select {
          font-size: 11px; padding: 3px 6px; border-radius: var(--radius-sm); border: 1px solid var(--rule-strong);
          background: var(--paper-raised); color: var(--ink);
        }
        .modal-analyze-btn { align-self: flex-start; }
        .modal-analyze-status { display: flex; align-items: center; gap: 8px; margin: 0; }
        .token-review { border-top: 1px dashed var(--rule); padding-top: 6px; }
        .token-review-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .token-review-toggle {
          display: flex; align-items: center; gap: 6px; background: none; border: none; padding: 2px 0;
          font-size: 11.5px; color: var(--ink-soft); cursor: pointer; text-align: left;
        }
        .token-review-body { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
        .token-group { display: flex; flex-direction: column; gap: 4px; }
        .token-group-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.03em; color: var(--ink-faint); font-weight: 650; }
        .token-row { display: flex; align-items: center; gap: 5px; }
        .token-swatch { width: 16px; height: 16px; border-radius: 4px; border: 1px solid var(--rule-strong); flex-shrink: 0; }
        .token-input {
          font-size: 11px; padding: 4px 6px; border: 1px solid var(--rule); border-radius: var(--radius-sm);
          background: var(--paper-raised); color: var(--ink); min-width: 0;
        }
        .token-input-name { flex: 1.1; font-family: "SF Mono", Menlo, Consolas, monospace; }
        .token-input-hex { flex: 0.7; font-family: "SF Mono", Menlo, Consolas, monospace; }
        .token-input-role { flex: 1.3; }
        .token-confidence { font-size: 10px; color: var(--ink-faint); white-space: nowrap; flex-shrink: 0; }
        .token-notes { margin: 2px 0 0; font-style: italic; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }
        .modal-confirm { text-align: right; margin: 8px 0 0; color: var(--success); }
        .criteria-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 24px; }
        .score-system-box { background: var(--paper-raised); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: 20px 22px; margin-top: 24px; }
        .score-system-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 12.5px; margin-top: 10px; }
        .score-system-grid strong { font-family: "SF Mono", Menlo, Consolas, monospace; color: var(--ink); font-weight: 650; }
        .type-legend { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
        .component-chip-row { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; }
        .backlog-cta {
          border: 1px dashed var(--rule-strong); border-radius: var(--radius-md); padding: 20px 22px;
          margin-top: 28px; background: transparent;
        }
        .criteria-card { background: var(--paper-raised); border: 1px solid var(--rule); border-radius: var(--radius-md); padding: 16px 18px; }
        .criteria-card-title { font-size: 13px; margin: 0 0 9px; font-weight: 600; }
        .criteria-list { margin: 0; padding-left: 16px; font-size: 12.5px; line-height: 1.7; color: var(--ink-soft); }
        @media (max-width: 1240px) {
          .app { max-width: 100%; }
        }
        @media (max-width: 900px) {
          .criteria-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 720px) {
          .app { padding: 28px 20px 56px; }
          .form-grid, .detail-grid, .review-fields { grid-template-columns: 1fr; }
          .detail-image-col { position: static; }
          .criteria-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="masthead">
        <div>
          <div className="eyebrow">Archivo compartido</div>
          <h1>Bitácora de Crítica UI</h1>
          <p className="kicker">Análisis por IA, propuesto — aprobado por una persona.</p>
        </div>
        <div className="masthead-actions">
          {view === "index" && (
            <button className="btn btn-secondary" onClick={() => setView("how")}>Cómo evaluamos</button>
          )}
          {view !== "index" && (
            <button className="btn btn-secondary" onClick={() => setView("index")}>Ver índice</button>
          )}
        </div>
      </div>

      {view === "index" && (
        <IndexView
          critiques={critiques}
          journeys={journeys}
          loading={loading}
          onOpen={openDetail}
          onOpenJourney={openJourney}
          onNew={() => setView("new")}
        />
      )}
      {view === "new" && (
        <NewView
          onSaved={handleSaved}
          onSavedBatch={handleSavedBatch}
          onSavedJourney={handleSavedJourney}
          onCancel={() => setView("index")}
        />
      )}
      {view === "detail" && selected && (
        <DetailView
          record={selected}
          onBack={() => setView("index")}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
          onOpenJourney={openJourney}
        />
      )}
      {view === "journey-detail" && (
        <JourneyView
          journey={journeys.find((j) => j.id === selectedJourneyId)}
          screens={critiques}
          onOpenScreen={openDetail}
          onUpdated={handleJourneyUpdated}
          onBack={() => setView("index")}
        />
      )}
      {view === "how" && (
        <HowWeEvaluateView onOpenMethodology={() => setView("criteria")} onBack={() => setView("index")} />
      )}
      {view === "criteria" && (
        <CriteriaView onBack={() => setView("how")} />
      )}
    </div>
  );
}
