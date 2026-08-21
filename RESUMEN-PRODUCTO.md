# Bitácora de Crítica UI — Resumen completo del producto

**Generado:** 20 de agosto de 2026. Este documento junta todo lo que se decidió,
construyó, descartó y quedó pendiente hasta ahora — pensado como referencia
única para no tener que reconstruir el historial leyendo la conversación
completa. No reemplaza `CLAUDE.md`, `README.md` ni `docs/CRITERIOS-DE-CRITICA.md`
(siguen siendo la fuente de verdad técnica), es el mapa de todo lo demás:
decisiones, ideas descartadas, y la parte de negocio.

---

## 1. Qué es, en una frase

Herramienta de crítica de interfaces asistida por IA: alguien del equipo sube
una captura mobile, Claude la evalúa contra un criterio documentado y
versionado (no "opinión libre" del modelo), y el resultado queda como
propuesta hasta que una persona real lo aprueba, rechaza o edita. La premisa
de fondo es que el output no vale nada si no se puede auditar contra qué se
comparó — por eso casi todo el trabajo de este proyecto fue construir y
versionar esa base de comparación, no el prompt en sí.

## 2. Estado real de los datos, ahora mismo (verificado en Supabase, no estimado)

| Namespace | Qué es | Filas reales hoy |
|---|---|---|
| `criterion:` | Base de criterios documentados (categoría 1) | **217** |
| `external-reference:` | Referencias de UICrit importadas (categoría 2) | 6 registros batch (151 pantallas / 547 comentarios muestreados) |
| `critique:` | Corpus propio (categoría 3) | **11 críticas guardadas — 9 pendientes, 1 rechazada, 1 aprobada** |
| `journey:` | Journeys multi-pantalla | 1 |
| `client-feedback:` | Categoría 4, feedback real de clientes | 0 — namespace reservado, sin implementar |

El dato más importante de esta tabla para cualquier decisión de negocio es
el de `critique:`: **el círculo de alimentación de categoría 3 está
construido pero todavía vacío en la práctica** — 0 críticas aprobadas. El
sistema ya sabe cómo usarlas para calibrar las próximas, pero hoy no hay
ninguna calibrando nada. Cualquier plan que asuma "tenemos un corpus propio
valioso" está asumiendo algo que todavía no pasó.

## 3. Arquitectura y estado de despliegue

- **Código:** React + Vite, un solo archivo de app (`app/ui-critique-repo.jsx`,
  ~540KB). Repo público en `github.com/jlgaleano1-design/withtaste`.
- **Hosting:** Vercel, proyecto `withtaste` (team `vendonar`), auto-deploy en
  cada push a `main`. Dominio: `withtaste.vercel.app`.
- **Backend:** Supabase, proyecto `WithTaste` (`mdrhivigmuavhytjcleo`, us-west-2).
  Storage clave-valor sobre una sola tabla (`kv_store`) vía un shim
  (`window.storage`) — no es una base relacional. Auth por magic link.
- **IA:** `api/critique.js`, función serverless propia en Vercel que hace de
  proxy a la API de Anthropic (`claude-sonnet-4-6`) — la `ANTHROPIC_API_KEY`
  nunca sale del servidor. No hay ninguna otra pieza de infraestructura
  backend — decisión explícita del equipo de mantenerlo así (ver sección 7).
- **Sin multi-tenancy.** Un solo proyecto de Supabase, un solo pool de auth,
  todos los que entran ven y editan lo mismo. No existe el concepto de
  "cuenta", "organización" ni "plan" en el modelo de datos todavía. Esto es
  relevante para cualquier plan de comercialización (ver sección 9).

## 4. El pipeline de crítica, paso a paso

1. Alguien entra con magic link y sube una captura mobile.
2. La imagen se comprime en el navegador.
3. Primer llamado (barato): clasifica la pantalla — plataforma, tipo de
   pantalla, componentes visibles.
4. Con esa clasificación se matchea contra: criterios documentados
   (categoría 1, filtrado por tag/componente — no es RAG semántico, es
   coincidencia de etiqueta), hasta 2 referencias de UICrit si la pantalla
   es mobile (categoría 2, nunca si es web/desktop), y hasta 4 críticas
   propias ya aprobadas (categoría 3 — hoy no hay ninguna que matchear,
   ver sección 2).
5. Se calculan los pesos de las 14 heurísticas según el tipo de experiencia
   y las consideraciones elegidas al subir la imagen (cálculo determinístico
   en JS, no se le pide al modelo que lo haga).
6. Segundo llamado (con visión): recibe la imagen + prompt base + solo lo
   que matchoo, devuelve JSON estructurado — resumen, tres bloques de
   puntaje (Usabilidad 50 / Consistencia 30 / Dirección de arte 20), y una
   lista de hallazgos con categoría, bloque, tipo epistémico
   (violación/riesgo/hipótesis/convención/preferencia), severidad (4
   niveles), heurística más relevante, confianza, principio de origen y
   recomendación.
7. Si Usabilidad < 30/50, se marca **fallo crítico** automáticamente
   (calculado en código, no depende de que el modelo lo marque bien).
8. Todo se guarda en Supabase. Cualquiera logueado puede aprobar, rechazar
   o dejar pendiente, con nombre y notas — al aprobar, retroalimenta la
   próxima crítica automáticamente (desde el 20 ago 2026 ya hay una crítica
   aprobada real — "Rappi iOS Payment methods 1" — sección 2). Además, desde
   la Ronda 9 (v1.16), una crítica aprobada puede además promoverse a
   criterio permanente de categoría 1, con la misma curación editorial
   ≥9/12 que cualquier otra fuente — no es automático, es una decisión
   humana explícita por hallazgo (ver sección 5).

## 5. Sistema de criterios — versión y gobernanza

**Versión actual: v1.21** (225 criterios — v1.20 fue una ronda de auditoría e
ingeniería del skill de construcción sin contenido nuevo; v1.21 retomó
contenido nuevo a partir del feedback de esa misma auditoría). Escaló de
65 → 225 en trece rondas de curación, cada una encuestando el universo
completo de una fuente (o, en las Rondas 10, 12 y 13, corrigiendo gaps
reales detectados en la propia auditoría del skill de generación) y
promoviendo solo lo que puntúa ≥9/12 en
una rúbrica de 4 ejes (observabilidad / fuerza de evidencia / aplicabilidad
mobile / accionabilidad). Fuentes curadas hasta ahora: biblioteca de
componentes (Open UI, ARIA APG, GOV.UK, SLDS, Atlassian, Base Web, Fluent 2),
WCAG 2.2 AA y AAA, Nielsen atomizado, Impeccable (verificado contra código
fuente real), Holloway (acceso parcial por paywall), Brignull/FTC dark
patterns, Vercel Design Guidelines, una crítica propia aprobada (Ronda 9,
fuente 100% interna), Butterick's Practical Typography + W3C WAI COGA sobre
tope de familias tipográficas (Ronda 10), APCA + Okabe & Ito sobre
accesibilidad de color más allá del ratio WCAG (Ronda 11), y NN/g (Tufte) +
Cieden sobre chartjunk, redundancia visual y línea base de espaciado,
detectados a partir de una crítica dura y real a una pantalla generada con
el skill de construcción (Ronda 12), y UX Movement/UNC + Material Design +
UX Collective + UXPin sobre consistencia de estilo de ícono, connotación
tipográfica por categoría, y navegación bottom-nav por default vs. libertad
creativa (Ronda 13).

**Diez dimensiones activas:** Jerarquía visual, Consistencia y sistema de
diseño, Tipografía, Color y contraste, Espaciado y alineación, Componentes y
affordance, Copy y microcopy, Accesibilidad, Claridad del propósito, y
Patrones oscuros (desde v1.14).

**Reglas duras del sistema de criterio:**
- Nunca se afirma como hecho algo que solo se confirma con interacción real
  (eso se marca `hipotesis` con `validationNeeded`).
- Nunca se trata una convención de plataforma como ley universal.
- Nunca se confunde prevalencia con calidad, ni "poco convencional" con
  "inutilizable".
- De libros con copyright se usan los principios, nunca se reproduce texto
  textual.

**Gobernanza:** el número de criterios (217) se deriva programáticamente de
`SEED_CRITERIA*.length` en el código — no está hardcodeado, así que la
documentación no puede desincronizarse silenciosamente del código real.
Cuando cambia el criterio, se actualizan a la vez `RUBRIC_PROMPT`/
`SEED_CRITERIA*` en el `.jsx` y `docs/CRITERIOS-DE-CRITICA.md`.

## 6. Qué quedó explícitamente FUERA de la base de criterios (y por qué)

Esto importa tanto como lo que sí entró — es la lista de "candidatos
evaluados, no es que no se nos ocurrieron":

- **Todo lo que requiere interacción, timing, audio/video o estructura DOM**
  (gran parte de WCAG AAA, animaciones de Impeccable, aria-labels, contraste
  diferencial hover/active/focus, layout shift por carga) — regla dura: si
  no es observable desde una imagen estática, no entra, sin excepción.
- **Frameworks de proceso, no hallazgos atómicos** (ISO 9241-210 desglosado,
  Postel's Law, Microsoft Inclusive Design Toolkit, los frameworks de
  Holloway sobre cómo entrevistar) — son checklists de metodología, no algo
  que un hallazgo pueda citar como criterio de corrección.
- **Patrón sin respaldo normativo, aunque fuera visualmente detectable** —
  las ~16 reglas de Impeccable que solo detectan "esto parece hecho por IA
  genérica" (paleta violeta, glow oscuro, chip eyebrow, etc.) se descartaron
  a propósito para no tratar la preferencia estética de un tercero como
  principio de diseño establecido. Mismo criterio con Title Case de Vercel
  (decisión de marca, no regla universal — contradice a Apple HIG/Material 3).
- **Nagging y patrones de Brignull que requieren observar el paso del
  tiempo** — quedan fuera hasta que exista (si existe) un modo de crítica
  multi-sesión/flujo. No hay plan concreto de construir eso todavía.
- **Duplicados** — varios candidatos que hubieran puntuado bien pero
  repetían cobertura ya promovida (consistencia de íconos, estado de
  selección visible, affordance de búsqueda, aria-label de íconos).

**Backlog explícito para la próxima ronda** (documentado en
`docs/research/CRITERIA-BACKLOG.md`, nada de esto se perdió):
1. Spot-check manual de los 7 criterios AAA de la ronda 2 contra w3.org en
   vivo (esa ronda se hizo sin acceso de red real, desde conocimiento
   entrenado — pendiente de verificación).
2. Revisar los 6 candidatos "borderline" (8/12, justo debajo del corte) de
   la ronda WCAG AAA — atomizarlos podría subirlos.
3. Data viz por tipo de gráfico específico (mapas, sankey, treemaps).
4. ISO 9241-210 desglosado (con un tratamiento distinto al de hallazgo
   atómico, más como checklist de research).
5. Re-encuestar las secciones de Holloway que quedaron detrás de paywall si
   se consigue acceso completo.
6. Nagging y otros patrones de Brignull dependientes del tiempo, si se
   construye un modo de crítica multi-sesión.

## 7. Feature de extracción de tokens de marca / export de skill

Construido esta etapa, reemplazando una primera propuesta de exportar un
`.zip` que el equipo rechazó por compleja. Flujo actual:

- El cliente sube material de marca (PDF/PNG/JPEG/WEBP, ≤3MB), etiquetado
  por rol: **material general**, **composición** (pantallas reales del
  producto) o **logo**.
- Opcionalmente, cada archivo pasa por "Analizar con IA" — reutiliza
  `api/critique.js` (mismo proxy que ya existía, sin backend nuevo) para
  extraer tokens de diseño: color, tipografía, radios, sombras. El resultado
  es editable por una persona antes de aceptarse — nunca se usa tal cual
  salió del modelo.
- Al descargar: un `skill.md` con jerarquía epistémica explícita (los
  criterios/reglas base mandan sobre las composiciones del cliente, que a
  su vez pesan más que el propio corpus de críticas aprobadas para fines de
  estilo/referencia) + `design-tokens.json` en formato DTCG + los archivos
  originales por separado (ya no un zip).
- **Todo esto es efímero, decisión explícita y confirmada por el equipo**:
  nada de lo que sube un cliente se guarda en Supabase. Vive solo en el
  estado del navegador durante la sesión del modal y termina en la carpeta
  de Descargas local al exportar. La única llamada de red que hace esta
  feature es a `/api/critique` cuando alguien aprieta "Analizar con IA" —
  eso sí sale del navegador (hacia la API de Claude, nunca se guarda ahí
  tampoco), y el modal lo dice explícitamente para no prometer más
  privacidad de la que realmente hay.

**Por qué no hay Edge Function ni backend nuevo:** se evaluó y el equipo lo
vetó explícitamente ("necesito que siga siendo simple") — la única pieza de
backend del proyecto sigue siendo `api/critique.js`, reutilizada, nunca
duplicada.

## 8. Autenticación y control de acceso

- Magic link (OTP) vía Supabase Auth, sin passwords que gestionar.
- **Hasta hoy 20 ago:** acceso binario — cualquier email podía pedir un
  link y entrar, sin roles ni restricción. Documentado así en `README.md`/
  `CLAUDE.md` como limitación conocida.
- **Cambio de hoy:** se restringió a una allowlist real de 3 correos
  (`jl.galeano1@gmail.com`, `polo@hey.com`, `dcalvo.89@gmail.com`).
  Implementado con:
  - Tabla `public.auth_allowlist` en Supabase (editable con SQL directo,
    sin tocar código para agregar o sacar a alguien).
  - Tabla `public.auth_login_attempts` — registra cada intento de magic
    link (email, hora, si fue permitido o no), para tener rastro de quién
    pidió acceso.
  - Un Auth Hook de Supabase (`Before User Created`, función Postgres
    `before_user_created_check_allowlist`) que bloquea la creación de
    cualquier cuenta nueva cuyo email no esté en la allowlist — enforcement
    real del lado del servidor, no solo un chequeo en el cliente que
    alguien técnico podría saltarse.
  - **Limitación real:** el hook solo dispara en la creación de una cuenta
    nueva, no en logins repetidos de alguien que ya tenía cuenta — se
    verificó que hoy la única cuenta existente es la del owner, así que no
    quedó nadie "colado" de antes.
  - Sigue sin haber roles/permisos diferenciados: adentro de la allowlist,
    todo el mundo puede ver y editar todo. Ese ítem sigue en Balde 2
    (sección 10).
  - Pendiente de decidir con el equipo: si además de guardar el registro de
    intentos, quieren una notificación activa (push/email) cuando alguien
    pide acceso — quedó como pregunta abierta, no implementado todavía.

## 9. Decisiones de UI/producto de esta etapa

- **Color de marca:** `#f7f5f0` → blanco (`--how-bg`), `#5b45e0` → gris
  oscuro (`--accent: #52525b`, con `--accent-soft`/`--accent-soft-fg`
  derivados), separado claramente de negro. Se corrigió también un caso
  hardcodeado que había quedado afuera del cambio (el botón del login en
  `Auth.jsx`, que no usa las variables CSS compartidas).
- **Batch upload:** el thumbnail de cada captura en la lista de "Nueva
  revisión" era demasiado chico para ver algo. Se agrandó (44×44 → 64×84,
  formato retrato) y se hizo clickeable para abrir un preview a tamaño
  completo en popup.
- **Sistema de marcadores (pines) en `DetailView`:** se reportó que los
  pines de hallazgos/wins se posicionaban de forma inexacta sobre la
  captura. Causa real: los pines se posicionaban en porcentaje relativo al
  marco (`.detail-img-frame`, centrado con flexbox), pero el clic se medía
  contra el rect de la imagen misma — como el marco casi siempre deja
  espacio vacío alrededor de la imagen (letterboxing) cuando el aspect
  ratio no coincide, el porcentaje no significaba lo mismo en ambos
  lugares. Se corrigió envolviendo la imagen en un contenedor que se ajusta
  exactamente a su tamaño renderizado, para que clic y pin usen el mismo
  sistema de coordenadas.
- **Botón "Descargar skill"** agregado al banner de cierre de "Cómo
  evaluamos".

## 10. Decisiones de arquitectura evaluadas y explícitamente rechazadas

| Propuesta | Quién la sugirió | Decisión | Por qué |
|---|---|---|---|
| Exportar el material del cliente como `.zip` | Propuesta inicial del asistente | Rechazada | El equipo no confiaba en cómo un builder consumiría un zip; se reemplazó por archivos separados + `skill.md` + JSON. |
| Edge Function de Supabase para procesar tokens de marca | Propuesta inicial del asistente | Rechazada | El equipo pidió explícitamente mantenerlo simple, sin secret keys ni infraestructura nueva — se resolvió reutilizando `api/critique.js`. |
| Migrar de storage clave-valor a Airtable/Notion (4 tablas relacionadas) | Otro colaborador del proyecto | Diferida | El volumen actual no lo justifica; se adoptó igual el sistema de pesos y tagging de contexto que traía la propuesta, solo se descartó la migración de storage. Se reevaluará si hace falta cruzar patrones entre críticas de formas que el JSON plano ya no soporte. |

## 11. Balde 2 — todo lo que falta, y por qué cada cosa está donde está

- 🔴 **RAG semántico real (embeddings)** — replanteado (se puede hacer sin
  vector DB, embeddings precalculados + similaridad coseno en JS puro), pero
  **bloqueado por la política de egress de red de este entorno de
  ejecución**: `api.voyageai.com` devuelve 403 en el CONNECT. No es
  problema de diseño ni de la API key — hace falta habilitar ese host a
  nivel de organización, o generar los embeddings desde otro entorno con
  acceso real. El script (`scripts/generate-embeddings.mjs`) ya está
  escrito, listo para correr en cuanto haya acceso.
- 🟡 **Grafo de criterios en conflicto** — infraestructura creada
  (`CRITERION_CONFLICTS`), una sola entrada real documentada a mano. Sin
  generación automática (dependía del RAG de arriba) ni UI propia.
- ⏳ **Fine-tuning / preference learning** — Anthropic no ofrece fine-tuning
  público vía API estándar. Alternativa realista: few-shot con datos de
  revisión humana (`reviewedBy`, `reviewNotes`, `status`) una vez que haya
  volumen suficiente — hoy no lo hay (sección 2).
- ⏳ **Suite formal de evaluación** — no arrancada. Es trabajo humano (armar
  un set de pantallas con defectos conocidos y etiquetarlas), no
  infraestructura — se puede construir en paralelo a cualquier otro punto.
- ⏳ **Base de datos relacional real** — diferida, mismo motivo que la
  propuesta de Airtable/Notion (sección 10).
- ⏳ **Roles/permisos diferenciados** — hoy la auth es binaria (adentro =
  todo permitido). El único avance de esta etapa fue restringir *quién*
  puede entrar (allowlist, sección 8), no *qué puede hacer cada quien* una
  vez adentro.
- 🔒 **Categoría 4 (feedback real de clientes)** — reservada en la
  taxonomía (namespace `client-feedback:`), sin modelo de datos ni UI. La
  idea es que sirva para cerrar hipótesis pendientes con evidencia real,
  pero el mecanismo de vínculo hipótesis↔caso real todavía no está
  diseñado.

**Orden recomendado si se retoma** (documentado ya en
`CRITERIOS-DE-CRITICA.md`): más rondas de curación de criterios primero
(cada ronda suma ~2-35 criterios reales, llegar a 1.500-2.000 son varias
decenas de rondas), suite de evaluación en paralelo porque no depende de
nada más. RAG, grafo y base relacional solo se justifican si el volumen
real empieza a superar lo que el filtrado por tags puede sostener.

## 12. Ideas de comercialización — todo lo discutido hasta ahora

**La propuesta original del equipo:** lanzar el proyecto como open source
acotado — una porción (ej. un cuarto) de los criterios y de las críticas
propias y de terceros disponible gratis, con una versión premium de pago
con mucho más contenido, prometiendo mejores resultados y homogeneidad.

**Mi lectura de esa propuesta, sin el rodeo de la primera respuesta** (la
primera vez me fui a una lista de riesgos en vez de opinar del negocio en
sí — quedó registrado como corrección del equipo):

- El modelo de negocio en sí — open-core, gratis limitado / premium con más
  contenido — es válido y es el mismo playbook de Sentry, GitLab, PostHog,
  Supabase. Para una herramienta que le dice a alguien "tu diseño está
  mal", que el criterio sea auditable públicamente genera confianza de
  categoría que ningún copy de marketing reemplaza.
- **El eje de corte importa más que el porcentaje.** Cortar "un cuarto al
  azar" no se traduce en valor percibido — los criterios de UI tienen
  mucha redundancia, un cuarto bien elegido puede cubrir la mayoría de los
  casos comunes (free tier "suficientemente bueno", nadie paga) o, si se
  corta mal, dar resultados pobres y quemar confianza antes de que alguien
  pruebe la versión paga. Recomendación: no vender volumen de contenido
  genérico (los criterios base ya son conocimiento público — WCAG, Nielsen,
  dark patterns — regalarlos no cuesta nada y da credibilidad). Vender la
  capa que sí compone: el corpus propio que se afina con cada crítica
  aprobada de un equipo específico, algo que un competidor no puede clonar
  leyendo el código. Alternativa más estándar: gating por volumen de uso o
  por feature (batch upload, extracción de tokens, export de skill,
  journeys) en vez de por profundidad de contenido — el usuario no percibe
  "tengo 53 criterios en vez de 212", percibe "puedo hacer esto o no".

**Bloqueadores reales, no opinables, que hay que resolver antes de publicar
cualquier cosa (independiente de qué modelo de negocio se elija):**

1. **Licencia de UICrit (categoría 2).** Confirmada como CC BY 4.0 para uso
   interno del proyecto — no está verificado que esa licencia permita
   redistribuir una porción del dataset como parte de un producto open
   source de terceros. Hay que revisarlo antes de publicar cualquier
   fracción de esas 151 pantallas/547 comentarios.
2. **Consentimiento de clientes sobre el corpus propio (categoría 3).** Las
   críticas propias probablemente contienen capturas reales de producto de
   clientes — marca, texto de UI real. Antes de pensar en qué porcentaje
   liberar, hay que confirmar si esos clientes autorizaron que su interfaz
   aparezca en un dataset público, aunque sea parcial. Sin ese
   consentimiento explícito, ese contenido no puede ser parte de la
   porción abierta, sin importar cuánto aportara.
3. **No hay aislamiento multi-tenant.** Toda la app corre sobre un solo
   proyecto de Supabase con auth binaria (ahora allowlist, pero sigue
   siendo "todo o nada"). Vender una versión premium con acceso hospedado
   requiere separar datos por cuenta y hacer cumplir el plan en el código
   — trabajo real, no un toggle.
4. **El "premium" hoy apenas existe.** El corpus de críticas propias
   aprobadas son **0 filas verificadas** (sección 2) — la promesa de
   "muchísimo más contenido, mejor homogeneidad" todavía es una proyección,
   no algo que se pueda vender hoy con evidencia real.

**Secuencia recomendada** (no descartada por el equipo, solo pendiente de
decidir cuándo arrancar): conseguir señal real de uso — más gente dentro
de la organización o algún partner de confianza — dejar crecer el corpus
propio a un volumen que sea un diferenciador defendible, y en paralelo
resolver las dos preguntas de licencia/consentimiento (no dependen de
estrategia de negocio, son un sí/no). Recién ahí diseñar el corte
free/premium — probablemente por uso o por feature, no por fracción del
dataset.

**Todavía no decidido, para cuando se retome este tema:**
- Qué licencia de código elegir si se abre el repo formalmente como
  proyecto open source (hoy es público mecánicamente en GitHub, pero no
  hay una licencia declarada pensada para eso — MIT/Apache permitiría que
  un competidor lo hostee comercialmente; algo tipo BSL/fair-source con
  cláusula de apertura demorada es más común en el playbook de open-core).
- Precio y forma de cobro de la versión premium.
- Si el gating final termina siendo por uso, por feature, o una
  combinación.

## 13. Pendientes abiertos, a la fecha de este documento

- Decidir si se quiere una notificación activa (no solo el registro en
  `auth_login_attempts`) cuando alguien pide un magic link.
- Activar manualmente el hook `Before User Created` en el dashboard de
  Supabase (paso que no se puede hacer por API) — confirmar que ya se hizo.
- Push pendiente en el repo local del usuario de los últimos cambios (pines,
  color del botón de login) si todavía no se corrió el commit+push.
- Las 6 líneas del backlog de criterios (sección 6).
- Toda la lista de Balde 2 (sección 11) — ninguna es "el siguiente paso
  obvio", se justifican solo si el volumen las empieza a exigir.
- Las tres preguntas de comercialización sin resolver (sección 12): licencia
  de código, precio, y forma exacta del corte free/premium — bloqueadas
  primero por licencia de UICrit y consentimiento de clientes.
