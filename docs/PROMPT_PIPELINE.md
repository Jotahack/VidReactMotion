# Pipeline de generación por IA — VidReactMotion

> **Estado:** el refinamiento de prompts y el motor V2 de escenas/grupos están implementados en la PR #1. Las pruebas reales con LM Studio/GPT-OSS 20B, el alfa de CapCut, las métricas visuales y el editor de timeline siguen pendientes. Electron permanece aparcado.

## Problema identificado

Antes se enviaba una idea corta directamente al LLM con un único prompt genérico y se devolvía una escena JSON. Una escena puede ser válida técnicamente y aun así tener mala jerarquía, ritmo o composición. Hay dos restricciones independientes:

1. **Inteligencia creativa:** interpretar intención, estilo, copy, ritmo, tipografía y composición.
2. **Capacidad del renderer:** solo implementa `title`, `subtitle`, `tag`, `stat`, `bar`, `icon` y `up`, `left`, `pop`, `fade`. Un prompt sofisticado NO crea efectos que el renderer todavía no sabe dibujar.

## Fase A — Dos etapas con JSON estructurado (implementada)

```text
Usuario: "Titular dramático sobre el comercio mundial"
   |
   v
LLM #1 Director creativo -> briefing JSON estricto
  - headline
  - supportingCopy
  - visualDirection
  - layout
  - animationPlan
  - assets
   |
   v
Validación del briefing en servidor
   |
   v
LLM #2 Director técnico -> sceneJsonSchema (elementos renderizables)
   |
   v
normalizeSpec() -> API { spec, brief }
   |
   v
React: muestra briefing + Remotion Player -> exportación alfa sin cambios
```

El usuario sigue escribiendo un prompt sencillo y pulsando **Generar con IA**. La aplicación explica qué dirección creativa ha usado el modelo. No se pide iniciar sesión ni se añade base de datos.

**Límites del MVP:**
- El método hace **dos inferencias consecutivas**, lo que consume más tiempo y tokens que una sola; puede ser más lento con modelos de razonamiento como GPT-OSS 20B y tendrá mayor coste si se usa una API de pago.
- Ambos pasos dependen de un modelo con soporte real para `response_format: json_schema`. El briefing se valida antes de intentar generar la escena.
- No se inventan estadísticas ni noticias; si faltan datos, se usan mensajes genéricos sin cifra. Las salidas del LLM requieren igualmente revisión humana.
- El prompt de sistema limita recursos a los ya implementados: no solicita 3D, vídeos, partículas, ni mapas reales inexistentes.
- Las zonas seguras y las superposiciones están **indicadas al modelo, no garantizadas algorítmicamente**. Antes de distribuir el producto hace falta detección real de recortes y colisiones.
- Todavía no existe puntuación automática de calidad ni modo de edición textual del briefing. El JSON de escena sí puede editarse.

## Prueba en LM Studio

1. Iniciar LM Studio y cargar **GPT-OSS 20B**, el modelo que se está utilizando, o cualquier otro compatible con JSON Schema. Verificar en su versión de LM Studio que el modo estructurado funciona con él.
2. Desde la rama `feat/modular-local-mvp`, ejecutar `npm install`, `npm test`, `npm run dev`.
3. Crear la misma escena varias veces con esta idea: «Titular urgente sobre comercio mundial, serio y elegante». Revisar que **no se introduzcan cifras inventadas**.
4. Repetir con «Animación minimalista: EL MUNDO CAMBIA» en **16:9** y **9:16** y duración de 6 s.
5. Probar «72 % de avance; etiqueta ÚLTIMA HORA» y verificar que la barra use 72 y no otra cifra.
6. Abrir «Briefing creativo utilizado» y comparar intención, copy, color, tiempos, distribución y resultado visual.
7. Exportar un MOV alfa y colocarlo sobre vídeo real en CapCut. La presencia de alfa está **pendiente de validar en el equipo**.

**Comparación opcional, no requisito:** Qwen3 4B Instruct puede servir como referencia de velocidad y consumo frente a GPT-OSS 20B, pero no es el modelo por defecto ni se exige descargarlo. GPT-OSS 20B requiere más memoria y puede ser más lento en equipos con poca VRAM; su calidad efectiva debe probarse con los mismos prompts. Si se producen respuestas JSON vacías, inválidas o truncadas, comprobar el límite de tokens, la configuración de razonamiento y el soporte del modo estructurado en la versión instalada de LM Studio.

**Evaluación de cada escena:** claridad a tamaño móvil, legibilidad, contraste con metraje real, ausencia de recortes, ausencia de datos inventados, ritmo, coherencia y correcta transparencia. Registrar ejemplos fallidos antes de ampliar el número de efectos.

## Fase B — Calidad visual del motor (en progreso)

- Ya integrados: escenas consecutivas, movimiento de grupos, keyframes manuales de grupo, entradas con `spring()` y `interpolate()`, tipografía cinética, SVG orbital y detección básica de huecos.
- Pendiente: keyframes por elemento renderizados, timeline visual editable y auto-layout.
- Tipografía y estilos: tracking, bloques, gradientes y trazos/contornos controlados, estilos de noticia e infografía.
- Disponibles: ring, counter, callout, orbit, divider y kinetic; por implementar: line/connector, shapes avanzadas, gráficos de datos reales y recursos gráficos adicionales.
- Timeline de varias secuencias, con editor de posiciones y duraciones.
- Cálculo de cajas de texto, zonas seguras, colisiones y desbordamientos tanto vertical como horizontal.

## Fase C — Calidad medible (pendiente)

- Conjunto de 10–20 prompts cortos, salidas esperadas, capturas por fotogramas y validación automática de alfa.
- Test visual de regresiones, tiempos de generación y coste del proveedor.
- Refinamiento editable: botón «Mejorar briefing», opción «Reintentar escena», historial de intentos.
- Biblioteca de estilos visuales reproducibles sin duplicar código; presets por tipo de vídeo.
- Diseño sin asignar un valor de verdad a datos no aportados por el usuario.

## Referencias

- [Anthropic — Prompting best practices](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-templates-and-variables)
- [Remotion — interpolate](https://www.remotion.dev/docs/interpolate)
- [Remotion — spring](https://www.remotion.dev/docs/spring)

La estrategia toma **principios públicos** de ingeniería de prompts; no es una reproducción del sistema interno de Claude ni un uso de su API.
