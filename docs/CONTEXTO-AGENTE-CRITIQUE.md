# Bitácora de Crítica UI ("withtaste") — resumen de contexto

Producto: herramienta interna para auditar capturas de pantalla de interfaces (apps propias) usando IA como primer analista y un humano como aprobador final. Repo local: `~/Documents/GitHub/withtaste`.

## Stack y arquitectura

- Frontend: React + Vite, un único archivo grande (`app/ui-critique-repo.jsx`, ~5000 líneas) que contiene toda la lógica de UI, el prompt de IA y la base de criterios semilla.
- Backend de datos: Supabase (Postgres). Toda la persistencia pasa por una tabla `kv_store` (clave/valor) accedida a través de un shim `window.storage` (`get/set/delete/list`) — no hay tablas relacionales separadas por entidad. RLS restringe escritura a usuarios autenticados.
- Análisis de IA: un endpoint serverless en Vercel (`api/critique.js`) hace de proxy hacia la API de Anthropic (Claude, modelo con visión) para no exponer la API key en el cliente.
- Auth: magic-link de Supabase envuelve toda la app en producción (`<Auth><App/></Auth>`). Existe un atajo solo de desarrollo (`?preview=1`, gateado por `import.meta.env.DEV`) que saltea el login y usa un storage en memoria, para poder probar la UI localmente sin tocar la base real.

## Flujo de una crítica (experiencia)

1. Alguien sube una captura de una pantalla, le pone título/contexto y tags (ej. "Onboarding", "Flujo transaccional", "Dashboard / datos densos") que ajustan qué pesa más en la evaluación.
2. La app clasifica la pantalla (plataforma, tipo de pantalla, componentes visibles) y con eso arma un contexto de tres fuentes distintas antes de llamar a la IA:
   - Categoría 1 — Documentación propia: base de ~180 criterios atómicos (afirmaciones cortas con fuente citada: WCAG, Apple HIG, Fluent 2, GOV.UK, IBM Carbon, Refactoring UI, etc.), filtrados por componente/tags de contexto detectados.
   - Categoría 2 — Referencias externas: dataset de terceros (UICrit), solo pantallas mobile, usado como inspiración de qué tipo de problemas buscar, nunca citado como fuente normativa.
   - Categoría 3 — Corpus propio: críticas anteriores ya aprobadas por un humano (nunca las pendientes o rechazadas) con pantallas similares, usadas como calibración de tono y nivel de detalle.
3. Con ese contexto inyectado, se llama a la IA con un rubric prompt extenso y fijo que exige responder solo con JSON: un resumen, tres puntajes de bloque (Usabilidad /50, Consistencia /30, Dirección de arte /20, total /100, con regla de "fallo crítico" si Usabilidad <30), una lista de hallazgos (findings) y una lista de aciertos (wins).
4. Cada hallazgo tiene: bloque, categoría, tipo (violación / riesgo / hipótesis / convención / preferencia — con reglas estrictas de cuándo usar cada uno), severidad, confianza, principio/fuente citado, qué está mal, qué cambiar, y si es "hipótesis" qué habría que validar con interacción real (la IA tiene prohibido afirmar cosas que solo se confirman con datos/interacción a partir de una sola imagen estática). Cada acierto tiene la misma lógica pero en positivo (qué está bien resuelto y por qué), sin severidad ni tipo, entre 2 y 4 por crítica, y la IA tiene instrucción explícita de no inventar aciertos de relleno.
5. Tanto hallazgos como aciertos pueden traer una posición opcional (x/y en porcentaje) si se refieren a un elemento puntual de la pantalla; si son generales, esa posición queda vacía.
6. La crítica queda guardada con estado "pendiente". Un humano revisa: tiene que tildar cada hallazgo individualmente (el botón de aprobar queda bloqueado hasta que estén todos tildados) y puede editar el texto de cualquier hallazgo/acierto generado por la IA, o agregar hallazgos/aciertos que la IA no detectó a mano (quedan marcados con su origen: IA vs. humano, y si fueron editados). Los aciertos no bloquean la aprobación, solo sirven de registro. Al final el revisor aprueba, rechaza o deja pendiente, con su nombre y notas opcionales.
7. Función agregada recientemente: se puede "clavar" cualquier hallazgo/acierto (existente o recién agregado a mano) en un punto exacto de la captura — queda un marcador numerado sobre la imagen, compartiendo una sola numeración entre hallazgos y aciertos. Lo que no es puntual se deja sin marcar. La captura ahora tiene un alto mínimo y máximo fijo, así que no se deforma según cuántos hallazgos tenga la crítica.

## Curación de la base de criterios (categoría 1)

Es un proceso manual y documentado, no automático: cuando se evalúa una fuente nueva (documentación externa), cada candidato se puntúa 1-3 en cuatro ejes (observabilidad desde una imagen estática, fuerza de la evidencia, aplicabilidad a mobile, accionabilidad — máximo 12) y solo se promueven los que llegan a ≥9/12. Todo lo rechazado queda documentado con motivo (duplica un criterio existente, no es verificable desde una imagen, requiere interacción, etc.) en `docs/research/CRITERIA-BACKLOG.md`, que funciona como bitácora de auditoría de todas las rondas de curación. El estado actual y el changelog de versiones vive en `docs/CRITERIOS-DE-CRITICA.md`.

## Estado actual

App funcional end-to-end corriendo en local (`npm run dev`, Vite) contra el proyecto real de Supabase/Vercel del usuario, con datos reales ya cargados. Falta (no confirmado aún): si la versión desplegada en Vercel producción tiene todas estas features o quedó desactualizada respecto a local.
