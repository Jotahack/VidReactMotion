# Generación cinematográfica y validación de 60 segundos

## Objetivo verificable

El ejemplo de referencia tiene **8 escenas, 32 grupos, 65 elementos y 96 keyframes** con duración de 60 segundos. El código incorpora una demo reproducible con esos mismos recuentos en horizontal (16:9) y vertical (9:16). Esta demo permite probar el renderizador **sin depender de ningún LLM**.

## Arquitectura de generación

En lugar de pedir 65 elementos en una única respuesta (demasiado larga y propensa a JSON incompleto), el servicio hace:

1. **Briefing creativo**: interpretar la idea y elegir un estilo.
2. **Storyboard global**: planificar hasta 8 planos distintos para cubrir 60 segundos.
3. **Construcción de cada plano**: 4 grupos de movimiento y 7–9 elementos en cada plano largo. Se genera con un esquema JSON reducido y se reintenta un plano insuficiente una vez.
4. **Distribución visual automática**: posicionar los grupos del LLM en zonas adaptadas a 16:9/9:16, sin alterar el contenido ni las cifras. Los archivos JSON importados no se recolocan.
5. **Keyframes**: el motor crea tres puntos de animación por grupo según su efecto, sin consumir tokens del modelo. Los fotogramas se calculan de forma determinista.
6. **Normalización y diagnóstico**: preservar tiempos, limitar coordenadas, señalar huecos y posibles solapamientos. Una advertencia de calidad todavía requiere revisión visual.

Para 60 s hay **10 inferencias secuenciales** si no hay reintentos. Un GPT-OSS 20B en un equipo con GPU de VRAM limitada puede tardar mucho. El usuario ve progreso por cada etapa, puede cancelar la generación y el servidor aborta las peticiones en curso.

Para vídeos cortos el número de planos y elementos se reduce automáticamente para no sobrecargar la composición. Los valores de la demo de estrés que parecen porcentajes o estadísticas están explícitamente marcados como *ficticios*; no hay acceso a fuentes de datos reales.

## Catálogo actual

- **16 componentes visuales**: title, subtitle, tag, stat, bar, icon, divider, ring, quote, pill, kinetic, orbit, callout, pulse, beam, ticker
- **11 entradas**: up, left, pop, fade, right, down, zoom, rotate, blur, wipe, spring
- **4 transiciones de plano**: fade, slide, zoom, cut
- **8 planos máximo**, hasta 4 grupos por plano y hasta 10 elementos por grupo
- SVG con iconos Lucide locales; Tailwind v4 y CSS; Remotion controla el tiempo. Los estilos deben funcionar tanto en preview como en exportación

El modelo **solo produce datos JSON**. No puede ejecutar JS, CSS arbitrario, scripts, URLs o componentes no implementados.

## Prueba manual en Windows

En PowerShell, desde el directorio del repositorio:

~~~powershell
git fetch origin
git switch feat/modular-local-mvp
git pull --ff-only origin feat/modular-local-mvp
npm install
npm run check
npm run build
npm run dev
~~~

Abrir http://127.0.0.1:5173.

**Prueba A — sin IA**: elegir horizontal o vertical, pulsar «Cargar prueba extrema · 60 segundos · formato elegido» y observar la vista previa. El editor muestra cuántas escenas y grupos tiene el documento. Exportar un MOV de prueba, verificar que el fondo es transparente, que el audio original sigue siendo audible en CapCut y que hay contenido en el inicio, la mitad y el final.

**Prueba B — con GPT-OSS 20B**: activar el servidor LM Studio, elegir modelo y seleccionar 60 segundos. Usar por ejemplo:

> Crea una demostración de motion graphics transparente con ocho capítulos visuales distintos sobre tecnología y creatividad. Debe incluir titulares cinematográficos, texto cinético, gráficos orbitales, cartelas, separadores, anillos de progreso con valores expresamente ficticios, cintas animadas, efectos de luz y cierre impactante. Los elementos deben estar coordinados, no solaparse y mantener continuidad durante los 60 segundos. No inventes noticias ni cifras reales.

Comprobar que aparece el progreso «plano X/8», que la app no se queda en una sola llamada gigante y que el resultado cuenta con numerosos elementos bien distribuidos. El recuento real puede superar 65 si el modelo devuelve más de los mínimos solicitados.

## Pruebas automatizadas del repositorio

~~~powershell
npm run check
npm run build
npm run bundle:check
npm run render:smoke
~~~

Las pruebas de CI también renderizan fragmentos PNG de distintos planos, en 16:9 y 9:16, y comprueban que hay **píxeles visibles** y **píxeles totalmente transparentes**. Otro script genera un fragmento MOV de ProRes 4444 y analiza su flujo con ffprobe para verificar que mantiene un formato de píxel con alfa. El script MOV de CI necesita ffprobe en PATH y no se debe confundir con una prueba completa de CapCut.

## Qué no está garantizado todavía

- Que tu instalación particular de LM Studio con GPT-OSS 20B respete en cada llamada el esquema estricto JSON (pendiente de probar en ese equipo).
- Rendimiento de render de 60 segundos a resolución completa en Windows, consumo de memoria y tamaño final de archivos.
- Importación real del MOV con alfa en la versión concreta de CapCut del usuario.
- Ausencia de todo desbordamiento de texto: la distribución es heurística, no hace medición tipográfica exacta.
- Calidad comparable a una edición profesional en *todas* las instrucciones: requiere evaluación visual, iteraciones y más presets.

Estas son **condiciones pendientes**, no afirmaciones de que el producto ya sea una herramienta lista para distribuir. Electron sigue aparcado.
