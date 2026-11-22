# PR #2 — Director de composiciones V3: auditoría y criterios de aceptación

**Base:** feat/modular-local-mvp (PR #1 sin fusionar).
**Rama:** feat/composition-director-v3.
**Estado:** borrador hasta pasar CI + revisión de renders + prueba con GPT-OSS 20B en Windows.

## Diagnóstico del MVP V2.1

1. La IA redactaba contenido pero las posiciones eran heurísticas, y las cartelas se parecían demasiado unas a otras.
2. No había una biblioteca de diseños seleccionables: el usuario debía retocar coordenadas JSON.
3. El texto podía quedar demasiado pequeño; el truncamiento silencioso de 120 caracteres se corrigió en la base.
4. El diagnóstico era geométrico, no una evaluación visual exhaustiva sobre metraje.
5. La generación avanzada utilizaba demasiados grupos en peticiones sencillas.
6. No había configuración explícita para probar Gemini.

## Arquitectura adoptada

Prompt -> detectar intención y restricciones -> IA devuelve CONTENIDO + templateId + motivo -> catálogo de recetas compatibles -> generar alternativas -> normalizar y revisar solapes, tamaños, zona de presentador y tiempo -> seleccionar candidata -> preview -> render alfa.

**Seguridad:** los modelos producen datos JSON, nunca React/CSS/JS ejecutable ni URL.

- src/shared/design-catalog.js: 13 recetas originales con variantes agrupadas por intención.
- server/ai/director.mjs: ranking de diseños y evaluación comparativa.
- server/ai/creative-router.mjs: intención en español y esquema reducido por modo.
- src/remotion/ProfessionalElements.jsx: cartelas y etiquetas originales, renderizadas por fotograma y transparentes.
- Interfaz: selector de tipografía, estilo, motivo de selección y dos alternativas sin pedir más tokens.
- Transiciones nativas Remotion opcionales en varias escenas.

## Bibliotecas incorporadas

- @remotion/layout-utils: medidas de texto y ajuste de párrafos.
- @remotion/shapes: SVG vectorial.
- @remotion/paths: trazos animados deterministas.
- @remotion/transitions: transiciones de secuencia para storyboard avanzado.
- @fontsource/oswald y @fontsource/playfair-display, además de Montserrat.

Todos los paquetes oficiales Remotion fijados a la versión 4.0.539 como el motor ya existente.

**Referencias externas evaluadas, NO vendorizadas en bloque:** RemotionUI, lifeprompt-team/remotion-scenes, reactvideoeditor/remotion-templates. Sus ejemplos MIT pueden servir de referencia, pero importar cientos de escenas sin controles añade mantenimiento y no garantiza mejores resultados. Los componentes de esta PR se han diseñado originalmente sobre API oficiales. Cada componente de terceros necesitará auditoría individual de código, licencia y render antes de copiarse. La licencia comercial de Remotion requiere revisión separada.

Fuentes:
- https://www.remotion.dev/docs/layout-utils/
- https://www.remotion.dev/docs/transitions/
- https://www.remotion.dev/docs/shapes
- https://www.remotion.dev/docs/paths
- https://remotionui.com/docs/components/browse
- https://github.com/lifeprompt-team/remotion-scenes
- https://github.com/reactvideoeditor/remotion-templates
- https://www.remotion.dev/docs/license/pricing

## Gemini

AI_PROVIDER=gemini apunta al endpoint oficial de compatibilidad OpenAI de Google; las credenciales permanecen en el servidor. No implica cuenta conectada ni compatibilidad real probada. GPT-OSS 20B mediante LM Studio sigue siendo el primer proveedor.

- https://ai.google.dev/gemini-api/docs/openai

## Puertas de calidad antes de fusionar

- [ ] API: JSON estructurado con contenido y diseño compatible; pruebas de elección/reparación.
- [ ] Texto íntegro, sin cortes ni errores de tipografía, horizontal y vertical.
- [ ] Al menos 13 recetas válidas, dos relaciones de aspecto y zonas reservadas.
- [ ] Vídeo de 2 s igual a 60 fotogramas (30 fps), sin salida prematura.
- [ ] Cinco ejemplos PNG reales transparentes revisados visualmente.
- [ ] ProRes 4444 y canal alfa comprobados con ffprobe.
- [ ] Sin regresiones de las pruebas preexistentes.
- [ ] Revisión visual sobre metraje real del usuario: pendiente hasta que se pruebe Windows.
- [ ] Gemini en cuenta real: pendiente hasta que haya credenciales.
- [ ] Compatibilidad CapCut en el equipo final: pendiente.

Los tests geométricos o de píxeles no demuestran calidad estética general. **No fusionar PR #1 ni PR #2 automáticamente.**
