# Snapshot — google-research-datasets/uicrit (GitHub)

**Guardado el:** 19 de agosto de 2026, vía fetch directo al repo.
**Motivo:** el repo fue archivado por su dueño el 22 de enero de 2026 (ahora es de
solo lectura). Esta es una foto de su metadata para no depender de volver a
consultarlo — el dataset en sí (`uicrit_public.csv`, 11.344 filas) **no** se pudo
descargar en esta sesión por una restricción técnica del entorno (ver nota abajo).

**Estado en nuestra taxonomía:** Categoría 2 — Referencias visuales externas.
**Estado de aprobación:** 🟢 Aprobado con filtro, bloqueado por acceso a datos.
Regla de inclusión: entran las filas con `comments_source` = "human" o "both"; se
excluye únicamente lo marcado "llm" (generado 100% por Gemini, sin toque humano).
Se importa lote por lote aplicando ese filtro, en cuanto se consiga el CSV real.

---

## Qué es

UICrit es un dataset que contiene críticas de diseño en lenguaje natural generadas
por personas, bounding boxes correspondientes a cada crítica, y calificaciones de
calidad de diseño para 1.000 UIs móviles de RICO. Este dataset se recolectó para el
paper de UIST '24: https://dl.acm.org/doi/10.1145/3654777.3676381

## Columnas del CSV (`uicrit_public.csv`)

- `rico_id` — ID de pantalla correspondiente en el dataset RICO (permite obtener el
  screenshot de la UI móvil).
- `task` — la tarea principal para la que está diseñada la pantalla.
- `aesthetics_rating` — calificación numérica (escala 1-10) de la calidad estética.
- `learnability` — calificación numérica (escala 1-5) de qué tan intuitiva es.
- `efficency` [sic, error tipográfico del dataset original] — calificación numérica
  (escala 1-5) de eficiencia (qué tan rápido se completan tareas).
- `usability_rating` — calificación numérica (escala 1-10) de usabilidad general.
- `design_quality_rating` — calificación numérica (escala 1-10) de calidad de
  diseño general (depende de usabilidad + estética).
- `comments_source` — lista que indica el origen de cada comentario: **"human"**
  (anotador humano), **"llm"** (generado por Gemini), o **"both"**. Es la columna
  clave para filtrar antes de importar cualquier fila.
- `comments` — lista de comentarios de diseño para la pantalla, cada uno con
  coordenadas de bounding box normalizadas por las dimensiones del screenshot.

## Tamaño real

**11.344 críticas de diseño** — la versión pública actual es ~3 veces más grande que
la discutida en el paper original (donde cada pantalla la evaluaba un solo
anotador). En la versión pública, cada pantalla fue evaluada por tres anotadores
distintos.

## Licencia

**Creative Commons Attribution 4.0 International (CC BY 4.0).** Confirmado
directamente en el repo (no en el PDF del paper, que menciona "NoDerivs" de forma
inconsistente — se prioriza lo que dice el repo oficial por ser la fuente que
gobierna el uso real del dataset). CC BY permite adaptar/reformatear dando crédito.

## Alcance

Exclusivamente **mobile** (proviene de RICO). Coincide con la decisión de enfocarnos
solo en app/producto mobile por ahora — no haría falta filtrar por plataforma.

## Fuentes

- Repo: https://github.com/google-research-datasets/uicrit
- Paper (UIST '24): https://arxiv.org/abs/2407.08850
- DOI: https://doi.org/10.1145/3654777.3676381

## Nota técnica sobre esta foto

Esta captura incluye el metadata y la documentación del repo (README completo), pero
**no el contenido real del CSV** — no se pudo descargar en este entorno por una
restricción de la herramienta de fetch (solo puede traer URLs que ya aparecieron
literalmente en un resultado de búsqueda o fetch previo, y el link directo al CSV no
calificó). Tampoco hay acceso a red desde el entorno de ejecución de código de esta
sesión. Para importar el contenido real más adelante, hace falta o bien que alguien
suba el CSV manualmente a la conversación, o intentarlo desde un entorno con acceso
de red real (por ejemplo Claude Code).
