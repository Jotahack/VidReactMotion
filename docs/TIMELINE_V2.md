# Motor de animación V2: storyboards, grupos y keyframes

## Estado

Implementado en la rama feat/modular-local-mvp, **sin fusionar**. El render y la vista previa usan el mismo componente TimelineStage con Remotion. La lógica depende de los fotogramas y no de relojes CSS independientes. Los estilos combinan Tailwind v4 y CSS. El canal alfa sigue pendiente de prueba real en Windows y CapCut.

## Por qué se ha cambiado

El formato V1 generaba una sola lista plana de elementos. Un ejemplo de 12 segundos tenía el último elemento entre los segundos 6,5 y 8,5: 3,5 segundos vacíos. Ahora GPT-OSS produce un storyboard con varios planos y grupos que se mueven coordinadamente.

El normalizador hace que el último plano abarque la duración solicitada y prolonga la última capa activa cuando procede. Los avisos de calidad ayudan a detectar huecos y posibles colisiones. Esto no sustituye una revisión visual.

## Formato V2

- format: portrait (1080×1920) o landscape (1920×1080)
- duration: entre 3 y 60 segundos
- scenes[]: planos consecutivos con at, hold, transition (fade, slide, zoom, cut) y preset (hero, data, comparison, quote, lower-third, minimal)
- groups[]: cada grupo controla motion, at, hold y elements[]. El tiempo de grupo es relativo a su plano
- elements[]: tipo, texto, posición, tamaño, color, animación, inicio y duración. El tiempo de elemento es relativo al grupo
- keyframes[]: opcionales en los grupos, editables a mano. El renderer interpola sus valores de posición, escala, rotación, opacidad y desenfoque fotograma a fotograma. Los keyframes todavía no se piden al LLM en el JSON estricto

## Ejemplo

~~~json
{
  "format":"landscape",
  "duration":6,
  "scenes":[{
    "at":0,"hold":6,"transition":"fade","preset":"hero",
    "groups":[{
      "motion":"spring","at":0,"hold":6,
      "keyframes":[
        {"at":0,"x":-30,"y":20,"scale":0.9,"rotate":0,"opacity":0,"blur":12},
        {"at":0.7,"x":0,"y":0,"scale":1,"rotate":0,"opacity":1,"blur":0}
      ],
      "elements":[{
        "type":"kinetic","text":"EL FUTURO ESTÁ EN MOVIMIENTO",
        "value":0,"icon":"globe","x":9,"y":30,"width":82,
        "size":78,"color":"white","animation":"spring",
        "at":0.2,"hold":5.6
      }]
    }]
  }]
}
~~~

## Catálogo y limitaciones

Tipos: title, subtitle, tag, quote, pill, kinetic (texto palabra a palabra), stat, bar, ring, callout, icon (Lucide SVG), orbit (SVG animado) y divider.

Movimientos: fade, left, right, up, down, pop, zoom, rotate, blur, wipe y spring. Transiciones entre escenas: fade, slide, zoom y cut.

Actualmente hay 18 iconos seleccionados de Lucide, nueve colores y seis presets semánticos. Los presets son etiquetas que orientan al LLM, no plantillas de auto-layout terminadas. No hay mapas reales, imágenes, 3D, partículas ni datos estadísticos automáticos.

## Compatibilidad y pruebas

normalizeSpec acepta tanto documentos anteriores con elements[] como V2 con scenes[]. Los documentos antiguos se migran a un grupo dentro de una escena; no se ejecuta código de la IA. El endpoint de generación devuelve el formato V2 ya normalizado.

En PowerShell:

~~~powershell
npm install
npm run check
npm run build
npm run dev
~~~

Comprobar que no haya segundos muertos al final, que los grupos resulten legibles y no se superpongan, que el formato vertical respete los márgenes, que GPT-OSS 20B produzca el JSON correcto y que el MOV transparente se superponga sobre metraje en CapCut.

**Pendiente:** pruebas reales de LM Studio, render con canal alfa, compatibilidad CapCut, auto-layout con medición de texto, editor visual de timeline, biblioteca adicional de efectos y tests de regresión visual.

## Principio de diseño

El LLM planifica el storyboard. Remotion es el único que determina el movimiento fotograma a fotograma. React y Tailwind dan presentación, CSS da estilo estático y Lucide aporta iconos SVG. Nunca se evalúa código generado libremente por el modelo.
