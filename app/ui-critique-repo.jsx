import { useState, useEffect, useCallback } from "react";
import { Upload, ArrowLeft, Check, X, Clock, Loader2, Trash2, ClipboardList, PlusCircle } from "lucide-react";

const CRITERIA_VERSION = "v1.8 · 19 ago 2026";

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

// Categoría 2 — Referencias visuales externas: UICrit (Google Research), filtrado
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
  const writes = [];
  if (!batch1Done) writes.push(...SEED_CRITERIA.map((c) => window.storage.set(`criterion:${c.id}`, JSON.stringify(c), true)));
  if (!batch2Done) writes.push(...SEED_CRITERIA_BATCH2.map((c) => window.storage.set(`criterion:${c.id}`, JSON.stringify(c), true)));
  if (!batch3Done) writes.push(...SEED_CRITERIA_BATCH3.map((c) => window.storage.set(`criterion:${c.id}`, JSON.stringify(c), true)));
  if (!writes.length) return Promise.resolve(false);
  return Promise.all(writes).then(() => true);
}

async function loadAllCriteria() {
  const list = await window.storage.list("criterion:", true);
  const keys = list?.keys || [];
  const seeded = await seedCriteriaIfNeeded(keys);
  const finalList = seeded ? await window.storage.list("criterion:", true) : list;
  const records = [];
  for (const key of finalList?.keys || []) {
    try {
      const item = await window.storage.get(key, true);
      if (item?.value) records.push(JSON.parse(item.value));
    } catch (e) { /* skip unreadable */ }
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
  const records = [];
  for (const key of finalList?.keys || []) {
    try {
      const item = await window.storage.get(key, true);
      if (item?.value) {
        const chunk = JSON.parse(item.value);
        if (Array.isArray(chunk)) records.push(...chunk);
      }
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
  const userTags = contextTags || [];
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
  const records = [];
  for (const key of keys) {
    try {
      const item = await window.storage.get(key, true);
      if (item?.value) {
        const parsed = JSON.parse(item.value);
        if (parsed.status === "approved") records.push(parsed);
      }
    } catch (e) { /* skip unreadable */ }
  }
  return records;
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

const CONTEXT_TAGS = [
  "Onboarding",
  "Flujo transaccional",
  "Alta carga cognitiva",
  "Dashboard / datos densos",
  "Exploración / descubrimiento",
  "Marketing / landing",
  "Feature con IA",
  "Internacionalización",
];

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
      "category": "Jerarquía visual" | "Consistencia y sistema de diseño" | "Tipografía" | "Color y contraste" | "Espaciado y alineación" | "Componentes y affordance" | "Copy y microcopy" | "Accesibilidad" | "Claridad del propósito",
      "type": "violacion" | "riesgo" | "hipotesis" | "convencion" | "preferencia",
      "severity": "alta" | "media" | "baja",
      "confidence": "alta" | "media" | "baja",
      "principle": "el principio, componente o marco específico en el que se basa este hallazgo",
      "issue": "qué está mal, específico y observable en la imagen, máximo 18 palabras",
      "recommendation": "qué cambiar, concreto y accionable, máximo 18 palabras",
      "validationNeeded": "solo si type es hipotesis: qué evidencia adicional se necesita, si no string vacío"
    }
  ]
}

Qué significa cada "type" (tomalo en serio, no lo uses decorativamente):
- "violacion" → contradice un criterio normativo claro (ej. WCAG AA, comportamiento de teclado definido por ARIA APG).
- "riesgo" → evidencia empírica o de investigación aplicada sugiere un problema, pero no es una regla absoluta (ej. Baymard, estudios de aesthetics-usability).
- "convencion" → se aparta de una convención madura de plataforma/design system, no de una regla universal (ej. Apple HIG, GOV.UK, Fluent 2).
- "hipotesis" → tu sospecha razonable, pero requiere interacción/datos para confirmarse.
- "preferencia" → es gusto/dirección de arte, no un problema funcional — nunca lo mezcles con Bloque A.

"confidence" es tu certeza de que la observación Y su aplicación del criterio son correctas — es independiente de "severity" (que mide impacto si el hallazgo es real).

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

Si se te da una o más etiquetas de contexto, ajustá el peso de tu evaluación:
- "Onboarding" → priorizá progreso visible y baja carga inicial (Efecto Zeigarnik).
- "Flujo transaccional" → priorizá prevención de errores y confianza por sobre creatividad visual; sé más estricto en Bloque A.
- "Alta carga cognitiva" → priorizá Ley de Miller y agrupación Gestalt; penalizá exceso de elementos simultáneos.
- "Dashboard / datos densos" → evaluá contra patrones de IBM Carbon y la sección de Data tables de la biblioteca de componentes.
- "Exploración / descubrimiento" → Bloque C tiene más margen; la exploración tolera más riesgo estético.
- "Marketing / landing" → Bloque C pesa más en la impresión general, pero Bloque A sigue siendo innegociable.

Reglas generales:
- Entre 4 y 6 hallazgos, priorizando lo más impactante para la persona usuaria final.
- No repitas el mismo hallazgo en categorías distintas.
- Si una categoría no aplica o no se puede evaluar por la imagen dada, no la incluyas.
- Sé específico: mencioná elementos concretos visibles (botones, textos, colores, posiciones) en vez de generalidades.
- Respondé en español, en tono directo y profesional, sin adornos.
- No incluyas nada fuera del objeto JSON.`;

const SEVERITY_STYLES = {
  alta: { bg: "#F3E1DE", fg: "#93312A", border: "#C0392B", label: "Alta" },
  media: { bg: "#F3ECDA", fg: "#7A5A17", border: "#B8860B", label: "Media" },
  baja: { bg: "#E3E9E4", fg: "#3E5347", border: "#5B7065", label: "Baja" },
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
  violacion: { label: "Violación", bg: "#F3E1DE", fg: "#93312A" },
  riesgo: { label: "Riesgo", bg: "#F3ECDA", fg: "#7A5A17" },
  hipotesis: { label: "Hipótesis", bg: "#E7E4EF", fg: "#5B4E86" },
  convencion: { label: "Convención", bg: "#DCE4E1", fg: "#2B4C4F" },
  preferencia: { label: "Preferencia", bg: "#E3E9E4", fg: "#3E5347" },
};

function TypeTag({ type }) {
  const s = TYPE_STYLES[type];
  if (!s) return null;
  return <span className="type-tag" style={{ background: s.bg, color: s.fg }}>{s.label}</span>;
}

function StatusStamp({ status, size = "md" }) {
  const cfg = {
    approved: { text: "APROBADO", color: "#2B4C4F" },
    rejected: { text: "RECHAZADO", color: "#93312A" },
    pending: { text: "PENDIENTE", color: "#8A7F6A" },
  }[status] || { text: "PENDIENTE", color: "#8A7F6A" };
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
  const s = SEVERITY_STYLES[severity] || SEVERITY_STYLES.baja;
  return (
    <span className="severity-badge" style={{ background: s.bg, color: s.fg, borderColor: s.border }}>
      {s.label}
    </span>
  );
}

function CriteriaView({ onBack }) {
  const [storeStats, setStoreStats] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [externalStats, setExternalStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadAllCriteria().then((all) => {
      if (cancelled) return;
      const byDimension = {};
      all.forEach((c) => { byDimension[c.dimension] = (byDimension[c.dimension] || 0) + 1; });
      setStoreStats({ total: all.length, byDimension });
      setLoadingStore(false);
    }).catch(() => setLoadingStore(false));
    loadAllExternalReferences().then((all) => {
      if (cancelled) return;
      const totalComments = all.reduce((sum, r) => sum + (r.comments?.length || 0), 0);
      setExternalStats({ screens: all.length, comments: totalComments });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="criteria-view">
      <button className="btn-link" onClick={onBack}><ArrowLeft size={14} /> Volver al índice</button>
      <div className="criteria-header">
        <h2 className="section-title">Criterio de crítica</h2>
        <span className="version-tag">{CRITERIA_VERSION}</span>
      </div>
      <p className="section-sub">
        Esto es lo que Claude usa como base para evaluar cada captura. Es un documento
        vivo: si el equipo aprueba sumar o ajustar una fuente, se actualiza acá y en el
        prompt que genera las críticas.
      </p>

      <div className="score-system-box">
        <h3 className="criteria-card-title">Las 3 categorías madre (desde v1.6)</h3>
        <div className="score-system-grid">
          <div><strong>📚 Documentación</strong><br />{storeStats?.total ?? "…"} criterios<br /><span className="muted small">No pasó por nuestro ojo</span></div>
          <div><strong>🖼️ Refs. externas</strong><br />{externalStats ? `${externalStats.screens} pantallas / ${externalStats.comments} comentarios` : "…"}<br /><span className="muted small">UICrit, filtrado human+both</span></div>
          <div><strong>✅ Corpus propio</strong><br />ver índice<br /><span className="muted small">Solo lo que aprobó un humano</span></div>
        </div>
      </div>

      <div className="score-system-box">
        <h3 className="criteria-card-title">Base de criterios (retrieval por tags, desde v1.5)</h3>
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
          </>
        )}
      </div>

      <div className="score-system-box">
        <h3 className="criteria-card-title">Tipos epistémicos por hallazgo (desde v1.4)</h3>
        <div className="type-legend">
          <span className="type-tag" style={{ background: "#F3E1DE", color: "#93312A" }}>Violación</span>
          <span className="type-tag" style={{ background: "#F3ECDA", color: "#7A5A17" }}>Riesgo</span>
          <span className="type-tag" style={{ background: "#E7E4EF", color: "#5B4E86" }}>Hipótesis</span>
          <span className="type-tag" style={{ background: "#DCE4E1", color: "#2B4C4F" }}>Convención</span>
          <span className="type-tag" style={{ background: "#E3E9E4", color: "#3E5347" }}>Preferencia</span>
        </div>
        <p className="muted small" style={{ marginTop: 8 }}>
          Ningún hallazgo puede afirmar algo interactivo/empírico (abandono, confusión,
          foco de teclado) solo a partir de una imagen — eso va marcado como
          "Hipótesis" con una nota de qué se necesita para confirmarlo.
        </p>
      </div>

      <div className="score-system-box">
        <h3 className="criteria-card-title">Biblioteca de componentes (desde v1.4)</h3>
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

      <div className="score-system-box">
        <h3 className="criteria-card-title">Sistema de puntuación por bloques</h3>
        <div className="score-system-grid">
          <div><strong>Bloque A</strong> · 50 pts<br />Usabilidad y arquitectura funcional</div>
          <div><strong>Bloque B</strong> · 30 pts<br />Consistencia sistémica</div>
          <div><strong>Bloque C</strong> · 20 pts<br />Dirección de arte</div>
        </div>
        <p className="muted small" style={{ marginTop: 8 }}>
          Fallo crítico automático si Bloque A &lt; 30/50 — se calcula en el código,
          no depende de que el modelo lo marque bien. Ningún puntaje de B o C puede
          compensarlo.
        </p>
      </div>

      <div className="criteria-grid">
        {CRITERIA_SECTIONS.map((s) => (
          <div className="criteria-card" key={s.title}>
            <h3 className="criteria-card-title">{s.title}</h3>
            <ul className="criteria-list">
              {s.sources.map((src, i) => <li key={i}>{src}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <h3 className="findings-title" style={{ marginTop: 22 }}>Etiquetas de contexto</h3>
      <div className="tag-chips">
        {CONTEXT_TAGS.map((t) => <span className="tag-chip static" key={t}>{t}</span>)}
      </div>

      <h3 className="findings-title" style={{ marginTop: 22 }}>Consideraciones transversales</h3>
      <ul className="criteria-list">
        {CRITERIA_CROSS_CUTTING.map((c, i) => <li key={i}>{c}</li>)}
      </ul>

      <p className="muted small" style={{ marginTop: 20 }}>
        Nota: de los libros con derechos de autor (Refactoring UI, Don't Make Me Think,
        The Design of Everyday Things, etc.) se aplican los principios y conceptos, no
        se reproduce texto textual de esas obras.
      </p>

      <div className="backlog-cta">
        <h3 className="criteria-card-title">"Balde 2" — arrancado en parte, el resto sigue pendiente</h3>
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
    </div>
  );
}

function IndexView({ critiques, loading, onOpen, onNew }) {
  return (
    <div>
      <div className="index-toolbar">
        <div>
          <h2 className="section-title">Índice de auditorías</h2>
          <p className="section-sub">{critiques.length} revisión{critiques.length === 1 ? "" : "es"} registrada{critiques.length === 1 ? "" : "s"}</p>
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
              return (
                <tr key={c.id} onClick={() => onOpen(c.id)}>
                  <td className="thumb-cell">
                    <img src={c.imageDataUrl} alt="" className="thumb" />
                  </td>
                  <td className="title-cell">{c.title || "Sin título"}</td>
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

function NewView({ onSaved, onCancel }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [tags, setTags] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeStage, setAnalyzeStage] = useState("");
  const [error, setError] = useState(null);

  const toggleTag = (tag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleFile = async (f) => {
    if (!f) return;
    setError(null);
    setFile(f);
    try {
      const { dataUrl } = await resizeImageFile(f);
      setPreview(dataUrl);
    } catch (e) {
      setError("No pude leer esa imagen. Probá con otro archivo JPG o PNG.");
    }
  };

  const analyze = async () => {
    if (!preview) return;
    setAnalyzing(true);
    setAnalyzeStage("Detectando tipo de pantalla y componentes…");
    setError(null);
    try {
      const base64 = preview.split(",")[1];

      // Paso 1: clasificación barata (screenType, componentes visibles, plataforma)
      const classifyRes = await fetch("https://api.anthropic.com/v1/messages", {
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

      // Paso 2: matchear contra la base de criterios (retrieval por tags, no semántico)
      setAnalyzeStage("Buscando criterios aplicables en la base…");
      const allCriteria = await loadAllCriteria();
      const matched = matchCriteria(classification, tags, allCriteria);
      const dynamicSupplement = formatMatchedCriteria(matched);

      // Paso 2.5: círculo de alimentación — solo críticas propias YA aprobadas por
      // un humano, nunca pendientes ni rechazadas.
      setAnalyzeStage("Buscando críticas propias aprobadas similares…");
      const approvedPast = await loadApprovedCritiques();
      const matchedPast = matchPastCritiques(classification, approvedPast);
      const pastSupplement = formatPastCritiques(matchedPast);

      // Paso 2.6: referencias externas (categoría 2, hoy UICrit) — solo si la
      // pantalla detectada es mobile; 100% excluido para web/desktop por regla.
      setAnalyzeStage("Buscando referencias visuales externas…");
      const allExternalRefs = await loadAllExternalReferences();
      const matchedExternal = matchExternalReferences(classification, allExternalRefs);
      const externalSupplement = formatExternalReferences(matchedExternal);

      // Paso 3: crítica real, con solo los criterios y ejemplos relevantes inyectados
      setAnalyzeStage("Generando la crítica…");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: RUBRIC_PROMPT + dynamicSupplement + pastSupplement + externalSupplement,
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } },
                {
                  type: "text",
                  text: `Título/contexto de la interfaz: "${title || "sin título"}". Etiquetas de contexto: ${tags.length ? tags.join(", ") : "ninguna"}. Analizá esta captura siguiendo las reglas del sistema y respondé solo con el JSON.`,
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

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const record = {
        id,
        title: title.trim(),
        createdBy: author.trim(),
        createdAt: Date.now(),
        imageDataUrl: preview,
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
        critique: parsed,
      };

      const result = await window.storage.set(`critique:${id}`, JSON.stringify(record), true);
      if (!result) throw new Error("No se pudo guardar en el archivo compartido.");
      onSaved(record);
    } catch (e) {
      console.error(e);
      setError("Algo falló analizando o guardando la imagen. Probá de nuevo.");
    } finally {
      setAnalyzing(false);
      setAnalyzeStage("");
    }
  };

  return (
    <div className="new-view">
      <button className="btn-link" onClick={onCancel}><ArrowLeft size={14} /> Volver al índice</button>
      <h2 className="section-title">Nueva revisión</h2>
      <p className="section-sub">Subí una captura de la interfaz. El análisis queda como propuesta hasta que alguien del equipo lo apruebe.</p>

      <div className="form-grid">
        <div>
          <label
            className={`upload-zone ${preview ? "has-image" : ""}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
          >
            {preview ? (
              <img src={preview} alt="preview" className="preview-img" />
            ) : (
              <div className="upload-placeholder">
                <Upload size={22} strokeWidth={1.4} />
                <span>Arrastrá una imagen o hacé clic para elegirla</span>
                <span className="muted small">JPG o PNG</span>
              </div>
            )}
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={(e) => handleFile(e.target.files?.[0])}
              style={{ display: "none" }}
            />
          </label>
        </div>

        <div className="field-col">
          <label className="field">
            <span>Título o pantalla</span>
            <input
              type="text"
              placeholder='Ej. "Checkout — paso 2"'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
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
            <span>Contexto (opcional, ajusta cómo pesa la IA cada bloque)</span>
            <div className="tag-chips">
              {CONTEXT_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  className={`tag-chip ${tags.includes(tag) ? "active" : ""}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-block" disabled={!preview || analyzing} onClick={analyze}>
            {analyzing ? (<><Loader2 className="spin" size={16} /> {analyzeStage || "Analizando…"}</>) : "Analizar interfaz"}
          </button>
          {error && <p className="error-text">{error}</p>}
          <p className="muted small">Esto queda visible para cualquiera que tenga acceso a este artefacto.</p>
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
          style={{ width: `${pct}%`, background: fail ? "#C0392B" : "var(--accent)" }}
        />
      </div>
    </div>
  );
}

function DetailView({ record, onBack, onUpdated, onDeleted }) {
  const [reviewer, setReviewer] = useState(record.reviewedBy || "");
  const [notes, setNotes] = useState(record.reviewNotes || "");
  const [saving, setSaving] = useState(false);

  const setStatus = async (status) => {
    setSaving(true);
    const updated = {
      ...record,
      status,
      reviewedBy: reviewer.trim(),
      reviewedAt: Date.now(),
      reviewNotes: notes.trim(),
    };
    try {
      const result = await window.storage.set(`critique:${record.id}`, JSON.stringify(updated), true);
      if (!result) throw new Error("save failed");
      onUpdated(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("¿Borrar esta revisión del archivo compartido? Esto no se puede deshacer.")) return;
    try {
      await window.storage.delete(`critique:${record.id}`, true);
      onDeleted(record.id);
    } catch (e) {
      console.error(e);
    }
  };

  const c = record.critique || {};
  const findings = c.findings || [];
  const score = computeScore(c);
  const tags = record.contextTags || [];

  return (
    <div className="detail-view">
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
          <img src={record.imageDataUrl} alt="" className="detail-img" />
        </div>

        <div className="detail-report-col">
          {score.criticalFail && (
            <div className="fail-banner">
              <strong>FALLO CRÍTICO</strong> — Usabilidad {score.usability}/50, por debajo
              del mínimo de 30. Ningún puntaje de dirección de arte compensa esto.
              {c.criticalFailReason && <> {c.criticalFailReason}</>}
            </div>
          )}

          {score.hasBlocks ? (
            <div className="blocks-summary">
              <div className="total-score-block">
                <span className="score-number">{score.total}</span>
                <span className="score-max">/100</span>
              </div>
              <div className="block-bars">
                <ScoreBar label="Usabilidad y arquitectura" value={score.usability} max={50} fail={score.criticalFail} />
                <ScoreBar label="Consistencia sistémica" value={score.consistency} max={30} />
                <ScoreBar label="Dirección de arte" value={score.artDirection} max={20} />
              </div>
            </div>
          ) : (
            <div className="report-summary">
              <div className="score-block">
                <span className="score-number">{score.legacyScore ?? "–"}</span>
                <span className="score-max">/10</span>
              </div>
            </div>
          )}
          <p className="summary-text">{c.summary || "Sin resumen disponible."}</p>

          <h3 className="findings-title" style={{ marginTop: 18 }}>Hallazgos ({findings.length})</h3>
          <div className="findings-list">
            {findings.map((f, i) => (
              <div className="finding-row" key={i} style={{ borderLeftColor: (SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.baja).border }}>
                <div className="finding-head">
                  <span className="finding-category">
                    {f.block && <span className="block-tag">Bloque {f.block}</span>}
                    {f.category}
                  </span>
                  <SeverityBadge severity={f.severity} />
                </div>
                <div className="finding-meta-row">
                  {f.principle && <p className="finding-principle">{f.principle}</p>}
                  {f.type && <TypeTag type={f.type} />}
                  {f.confidence && <span className="confidence-tag">Confianza {f.confidence}</span>}
                </div>
                <p className="finding-issue">{f.issue}</p>
                <p className="finding-rec"><span className="muted">Recomendación:</span> {f.recommendation}</p>
                {f.type === "hipotesis" && f.validationNeeded && (
                  <p className="validation-note"><span className="muted">Para confirmar:</span> {f.validationNeeded}</p>
                )}
              </div>
            ))}
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
              <button className="btn btn-approve" disabled={saving} onClick={() => setStatus("approved")}>
                <Check size={15} /> Aprobar
              </button>
              <button className="btn btn-reject" disabled={saving} onClick={() => setStatus("rejected")}>
                <X size={15} /> Rechazar
              </button>
              <button className="btn btn-secondary" disabled={saving} onClick={() => setStatus("pending")}>
                <Clock size={15} /> Marcar pendiente
              </button>
            </div>
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

export default function UICritiqueRepo() {
  const [view, setView] = useState("index");
  const [critiques, setCritiques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const listResult = await window.storage.list("critique:", true);
      const keys = listResult?.keys || [];
      const records = [];
      for (const key of keys) {
        try {
          const item = await window.storage.get(key, true);
          if (item?.value) records.push(JSON.parse(item.value));
        } catch (e) {
          // skip unreadable entries
        }
      }
      records.sort((a, b) => b.createdAt - a.createdAt);
      setCritiques(records);
    } catch (e) {
      console.error(e);
      setCritiques([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const openDetail = (id) => { setSelectedId(id); setView("detail"); };
  const handleSaved = (record) => {
    setCritiques((prev) => [record, ...prev]);
    setSelectedId(record.id);
    setView("detail");
  };
  const handleUpdated = (updated) => {
    setCritiques((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };
  const handleDeleted = (id) => {
    setCritiques((prev) => prev.filter((c) => c.id !== id));
    setView("index");
  };

  const selected = critiques.find((c) => c.id === selectedId);

  return (
    <div className="app">
      <style>{`
        .app {
          --ink: #23281f;
          --paper: #EEF0E9;
          --paper-raised: #F7F8F3;
          --rule: #C9CDBF;
          --accent: #2B4C4F;
          --accent-soft: #DCE4E1;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: var(--paper);
          color: var(--ink);
          min-height: 100%;
          padding: 28px 24px 48px;
          box-sizing: border-box;
        }
        .app * { box-sizing: border-box; }
        .app h1, .app h2, .app h3 {
          font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
          margin: 0;
        }
        .masthead {
          display: flex; justify-content: space-between; align-items: flex-end;
          border-bottom: 2px solid var(--ink); padding-bottom: 14px; margin-bottom: 22px;
        }
        .masthead h1 { font-size: 26px; letter-spacing: -0.01em; }
        .masthead .eyebrow {
          font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--accent); font-weight: 600; margin-bottom: 4px;
        }
        .masthead .kicker { font-size: 12px; color: #6b7268; margin-top: 4px; }
        .section-title { font-size: 19px; }
        .section-sub { font-size: 13px; color: #6b7268; margin: 6px 0 0; }
        .index-toolbar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
        .btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; padding: 9px 14px;
          border-radius: 3px; border: 1px solid var(--ink); cursor: pointer;
          background: var(--paper-raised); color: var(--ink);
          transition: transform 0.08s ease;
        }
        .btn:hover:not(:disabled) { transform: translateY(-1px); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary { background: var(--ink); color: var(--paper-raised); border-color: var(--ink); }
        .btn-secondary { background: transparent; }
        .btn-block { width: 100%; justify-content: center; margin-top: 4px; }
        .btn-approve { background: #E4EBE4; border-color: #2B4C4F; color: #2B4C4F; }
        .btn-reject { background: #F3E1DE; border-color: #93312A; color: #93312A; }
        .btn-link {
          background: none; border: none; cursor: pointer; font-size: 12.5px;
          color: var(--accent); display: inline-flex; align-items: center; gap: 4px;
          padding: 0; font-weight: 600; margin-bottom: 14px;
        }
        .btn-link.danger { color: #93312A; }
        .empty-state {
          border: 1px dashed var(--rule); border-radius: 4px; padding: 48px 20px;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          color: #6b7268; font-size: 14px; text-align: center;
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .index-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .index-table thead th {
          text-align: left; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase;
          color: #6b7268; border-bottom: 1px solid var(--ink); padding: 0 10px 8px;
          font-weight: 600;
        }
        .index-table tbody tr { cursor: pointer; border-bottom: 1px solid var(--rule); }
        .index-table tbody tr:hover { background: var(--paper-raised); }
        .index-table td { padding: 10px; vertical-align: middle; }
        .thumb-cell { width: 56px; }
        .thumb { width: 48px; height: 34px; object-fit: cover; border-radius: 2px; border: 1px solid var(--rule); display: block; }
        .title-cell { font-weight: 600; }
        .muted { color: #6b7268; }
        .small { font-size: 11.5px; }
        .score-pill {
          font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 12px;
          background: var(--accent-soft); color: var(--accent); padding: 3px 7px; border-radius: 3px;
        }
        .score-pill-fail { background: #F3E1DE; color: #93312A; font-weight: 700; }
        .stamp {
          display: inline-block; border: 2px solid; border-radius: 3px;
          font-family: "SF Mono", Menlo, Consolas, monospace; font-weight: 700;
          letter-spacing: 0.06em; transform: rotate(-3deg); opacity: 0.9;
        }
        .stamp-sm { font-size: 9px; padding: 2px 6px; }
        .stamp-lg { font-size: 13px; padding: 6px 12px; }
        .new-view, .detail-view { max-width: 100%; }
        .form-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 22px; margin-top: 18px; }
        .upload-zone {
          display: block; border: 1.5px dashed var(--rule); border-radius: 4px;
          min-height: 260px; cursor: pointer; overflow: hidden; background: var(--paper-raised);
        }
        .upload-zone.has-image { border-style: solid; }
        .upload-placeholder {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px; height: 260px; color: #6b7268; font-size: 13px; text-align: center; padding: 0 20px;
        }
        .preview-img { width: 100%; height: 260px; object-fit: contain; background: #fff; }
        .field-col { display: flex; flex-direction: column; gap: 12px; }
        .field { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 600; color: #6b7268; }
        .field input, .field textarea {
          font-family: inherit; font-size: 14px; padding: 9px 10px; border-radius: 3px;
          border: 1px solid var(--rule); background: var(--paper-raised); color: var(--ink);
          font-weight: 400;
        }
        .field input:focus, .field textarea:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
        .error-text { color: #93312A; font-size: 12.5px; }
        .tag-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .tag-chip {
          font-size: 11.5px; font-weight: 600; padding: 4px 9px; border-radius: 20px;
          border: 1px solid var(--rule); background: var(--paper-raised); color: #6b7268;
          cursor: pointer;
        }
        .tag-chip.active { background: var(--accent); border-color: var(--accent); color: var(--paper-raised); }
        .tag-chip.static { cursor: default; background: var(--accent-soft); color: var(--accent); border-color: transparent; }
        .fail-banner {
          background: #F3E1DE; border: 1px solid #C0392B; color: #6b241f;
          border-radius: 4px; padding: 10px 12px; font-size: 13px; line-height: 1.5;
          margin-bottom: 14px;
        }
        .fail-banner strong { color: #93312A; letter-spacing: 0.03em; }
        .blocks-summary { display: flex; gap: 18px; align-items: flex-start; padding-bottom: 14px; border-bottom: 1px solid var(--rule); margin-bottom: 4px; }
        .total-score-block {
          font-family: "Iowan Old Style", Palatino, Georgia, serif; line-height: 1;
          background: var(--ink); color: var(--paper-raised); border-radius: 4px;
          padding: 12px 14px; text-align: center; min-width: 66px;
        }
        .block-bars { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
        .score-bar-row { font-size: 11.5px; }
        .score-bar-label { display: flex; justify-content: space-between; margin-bottom: 3px; font-weight: 600; }
        .score-bar-track { height: 6px; background: var(--rule); border-radius: 4px; overflow: hidden; }
        .score-bar-fill { height: 100%; border-radius: 4px; }
        .block-tag {
          font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 9.5px;
          background: var(--accent-soft); color: var(--accent); padding: 1px 5px;
          border-radius: 3px; margin-right: 6px; font-weight: 700;
        }
        .detail-toolbar { display: flex; justify-content: space-between; align-items: center; }
        .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 12px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1.3fr; gap: 26px; }
        .detail-image-col { position: sticky; top: 0; }
        .detail-img { width: 100%; border: 1px solid var(--rule); border-radius: 4px; display: block; }
        .report-summary {
          display: flex; gap: 16px; align-items: flex-start; padding-bottom: 16px;
          border-bottom: 1px solid var(--rule); margin-bottom: 16px;
        }
        .score-block {
          font-family: "Iowan Old Style", Palatino, Georgia, serif; line-height: 1;
          background: var(--accent); color: var(--paper-raised); border-radius: 4px;
          padding: 10px 12px; text-align: center; min-width: 56px;
        }
        .score-number { font-size: 26px; font-weight: 700; }
        .score-max { font-size: 12px; opacity: 0.8; }
        .summary-text { font-size: 14.5px; line-height: 1.5; margin: 0; padding-top: 4px; }
        .findings-title { font-size: 13px; letter-spacing: 0.04em; text-transform: uppercase; color: #6b7268; margin-bottom: 10px; }
        .findings-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px; }
        .finding-row { border-left: 3px solid; background: var(--paper-raised); padding: 10px 12px; border-radius: 0 3px 3px 0; }
        .finding-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .finding-category { font-size: 12.5px; font-weight: 700; }
        .severity-badge { font-size: 10.5px; font-weight: 700; padding: 2px 7px; border-radius: 20px; border: 1px solid; }
        .finding-principle {
          font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 10.5px;
          color: var(--accent); text-transform: uppercase; letter-spacing: 0.04em;
          margin: 0;
        }
        .finding-meta-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 5px; }
        .type-tag {
          font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 20px;
        }
        .confidence-tag {
          font-size: 10.5px; color: #6b7268; font-style: italic;
        }
        .validation-note {
          font-size: 12.5px; margin: 6px 0 0; line-height: 1.4; padding: 6px 8px;
          background: #E7E4EF; border-radius: 3px; color: #4a3f70;
        }
        .finding-issue { font-size: 13.5px; margin: 0 0 4px; line-height: 1.4; }
        .finding-rec { font-size: 13px; margin: 0; line-height: 1.4; }
        .review-box { border-top: 1px solid var(--ink); padding-top: 16px; }
        .review-fields { display: grid; grid-template-columns: 1fr 1.4fr; gap: 12px; margin-bottom: 12px; }
        .review-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .masthead-actions { display: flex; gap: 8px; }
        .criteria-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .version-tag {
          font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 10.5px;
          background: var(--accent-soft); color: var(--accent); padding: 3px 8px; border-radius: 20px;
        }
        .criteria-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 18px; }
        .score-system-box { background: var(--paper-raised); border: 1px solid var(--ink); border-radius: 4px; padding: 14px 16px; margin-top: 18px; }
        .score-system-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 12.5px; margin-top: 8px; }
        .score-system-grid strong { font-family: "SF Mono", Menlo, Consolas, monospace; color: var(--accent); }
        .type-legend { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .component-chip-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .backlog-cta {
          border: 1.5px dashed var(--ink); border-radius: 4px; padding: 14px 16px;
          margin-top: 20px; background: var(--paper-raised);
        }
        .criteria-card { background: var(--paper-raised); border: 1px solid var(--rule); border-radius: 4px; padding: 12px 14px; }
        .criteria-card-title { font-size: 13px; margin: 0 0 8px; font-family: "Iowan Old Style", Palatino, Georgia, serif; }
        .criteria-list { margin: 0; padding-left: 16px; font-size: 12.5px; line-height: 1.6; color: #3b4038; }
        @media (max-width: 900px) {
          .criteria-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 720px) {
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
            <button className="btn btn-secondary" onClick={() => setView("criteria")}>Ver criterio</button>
          )}
          {view !== "index" && (
            <button className="btn btn-secondary" onClick={() => setView("index")}>Ver índice</button>
          )}
        </div>
      </div>

      {view === "index" && (
        <IndexView critiques={critiques} loading={loading} onOpen={openDetail} onNew={() => setView("new")} />
      )}
      {view === "new" && (
        <NewView onSaved={handleSaved} onCancel={() => setView("index")} />
      )}
      {view === "detail" && selected && (
        <DetailView
          record={selected}
          onBack={() => setView("index")}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
      {view === "criteria" && (
        <CriteriaView onBack={() => setView("index")} />
      )}
    </div>
  );
}
