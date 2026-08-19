# Bitácora de Crítica UI

Herramienta de crítica de interfaces asistida por IA: se sube una captura
(JPG/PNG), Claude la evalúa contra un criterio documentado y versionado, y
queda como propuesta hasta que una persona del equipo la aprueba, rechaza o
edita. Corre como un artefacto de Claude.ai con almacenamiento compartido —
no requiere backend propio ni cuentas externas para la versión actual.

## Estado del proyecto

**Versión del criterio:** v1.5 (19 ago 2026) — ver `docs/CRITERIOS-DE-CRITICA.md`
para el historial completo. Desde v1.5 la app usa un pipeline de dos pasos:
clasifica la pantalla, matchea contra una base de criterios atómicos guardada en
storage (filtrado por tags, no RAG semántico todavía), y recién ahí genera la
crítica con solo los criterios relevantes.

## Estructura

```
app/
  ui-critique-repo.jsx      → la app completa (React + Anthropic API + storage)

docs/
  CRITERIOS-DE-CRITICA.md   → fuente de verdad del criterio: qué usa Claude
                               para evaluar, por qué, y el historial de
                               versiones. Editar ESTE archivo Y el
                               RUBRIC_PROMPT dentro del .jsx cuando cambie
                               algo — deben quedar sincronizados.

  prompts/
    PROMPT-EXTRACCION-ANATOMIA.md
                               → prompt reutilizable para pedirle a un agente
                                 con acceso web que extraiga secciones de
                                 Anatomy/Usage/States de design systems
                                 públicos, en un formato que se pueda
                                 indexar y aprobar antes de sumarlo al
                                 criterio.

  research/
    Design_Judgment_Knowledge_Base_Handoff_2026-08-19.docx
                               → investigación de ~130 fuentes (roadmap para
                                 una versión más madura del sistema — "Balde
                                 2": base de criterios versionada, RAG, grafo
                                 de conflictos, fine-tuning, evaluación
                                 formal). No implementado, documentado como
                                 backlog explícito.

    UX_Component_Critique_Criteria.pdf
                               → corpus de ~80 reglas a nivel de componente
                                 (select, modal, tabs, forms, etc.), cada una
                                 con su URL de origen. Parcialmente
                                 incorporado al RUBRIC_PROMPT en v1.4.
```

## Cómo funciona

1. Alguien del equipo sube una captura desde el artefacto.
2. La imagen se comprime en el navegador y se manda a la API de Claude
   (`claude-sonnet-4-6`, con visión) junto con el `RUBRIC_PROMPT`.
3. Claude devuelve un JSON estructurado: resumen, tres bloques de puntaje
   ponderados (Usabilidad 50 / Consistencia 30 / Dirección de arte 20), y una
   lista de hallazgos — cada uno con categoría, bloque, tipo epistémico
   (violación/riesgo/hipótesis/convención/preferencia), confianza, principio
   de origen, y recomendación.
4. Si Usabilidad < 30/50, se marca fallo crítico automáticamente (calculado
   en el código, no depende de que el modelo lo marque bien).
5. Todo se guarda en el storage compartido del artefacto. Cualquiera con
   acceso al artefacto puede aprobar, rechazar o dejar pendiente, con su
   nombre y notas.

## Limitaciones conocidas (léase antes de asumir más de lo que hay)

- **No hay autenticación por usuario.** Cualquiera con el link al artefacto
  ve y puede modificar todo. Para permisos reales hace falta backend propio.
- **No es una base de datos relacional.** Es almacenamiento clave-valor
  nativo de los artefactos de Claude — funciona bien al volumen actual, pero
  no tiene queries relacionales ni un grafo de criterios.
- **El criterio vive en un prompt de sistema fijo**, no en una base de
  criterios con recuperación (RAG). Eso es intencional por ahora — ver
  "Balde 2" en `docs/CRITERIOS-DE-CRITICA.md` para el plan de cuándo y por
  qué migrar.
- **max_tokens de la respuesta está fijado en 1000** por una restricción del
  entorno de artefactos — el prompt pide hallazgos concisos para no
  truncarse.

## Próximo paso: GitHub

Este repo está armado para poder hacer `git init` directo sobre esta carpeta
y subirlo. Pendiente: conectar con GitHub real (vía `gh repo create` o el
conector de GitHub) para que el historial de versiones del criterio quede
versionado con Git en vez de vivir solo en el changelog manual del `.md`.
