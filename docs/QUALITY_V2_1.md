# VidReactMotion — iteración de calidad visual V2.1

## Problema que resuelve

Los renders anteriores eran técnicamente correctos pero generaban tarjetas desproporcionadas, textos partidos, composiciones con demasiados elementos y duraciones que no coincidían con el encargo. Esta entrega prioriza resultados legibles en lugar de aumentar el número de efectos.

## Nuevo flujo automático (LM Studio con GPT-OSS 20B)

- **Auto**: el router local identifica solicitudes de tarjeta, lista o tipografía a partir de instrucciones explícitas. Las piezas ambiguas o complejas siguen usando el storyboard avanzado.
- **Solo tipografía**: una llamada JSON de contenido y una composición controlada, con tamaño y cadencia calculados por Remotion.
- **Tarjeta informativa**: una llamada JSON para título y definición breve; la app construye un único componente infoCard vertical, con altura, padding y fondo semitransparente.
- **Lista animada**: conceptos aportados por el usuario en orden, con entradas escalonadas.
- **Avanzado**: briefing + plan por escenas + generación de cada plano. En clips cortos se usan 2–3 grupos por plano; en piezas largas, 4.

El modo y la tipografía se pueden seleccionar explícitamente. La selección automática todavía es heurística y no una clasificación semántica infalible. El texto redactado por GPT-OSS requiere revisión.

## Formato de datos

El normalizador acepta los documentos V2 anteriores. Los campos nuevos de elementos son opcionales:

- font: Montserrat, Inter, Arial.
- lineMode: single (una línea) o wrap.
- exit: none o fade.
- height: altura porcentual del componente.
- heading: título dentro del infoCard.

Se añade el componente infoCard y la animación none. Duraciones de **1 a 60 segundos**, sin convertir silenciosamente 2 segundos a 3.

Montserrat se importa de @fontsource/montserrat y queda empaquetada localmente para que la vista previa y el render usen la misma familia. No se distribuyen archivos de fuentes por separado.

## Prueba manual

En PowerShell, desde el proyecto, con los cambios locales guardados:

~~~powershell
git switch feat/modular-local-mvp
git pull --ff-only origin feat/modular-local-mvp
npm install
npm run check
npm run build
npm run render:card:smoke
npm run dev
~~~

Pulsar **Cargar plantilla · Tarjeta BIOTIPOS con Montserrat**. Verificar el panel a la derecha, el texto completo y la transparencia sobre una imagen o vídeo de referencia local.

Prompt de prueba en modo automático:

> Crea una explicación breve de qué es un biotipo, en un contenedor vertical a la derecha de la persona, con Montserrat y fondo oscuro semitransparente. Quiero una sola tarjeta que permanezca en pantalla durante 7 segundos.

Debe generar una escena y un solo componente, sin anillos ni gráficos innecesarios.

## Control de calidad

assessComposition avisa de márgenes inseguros, texto pequeño, solapamientos, tiempo sin contenido e invasión de la zona reservada. Es una inspección geométrica aproximada, no visión artificial. Las imágenes y vídeos de referencia se muestran solo en el navegador y **no se añaden al archivo exportado**.

## Siguientes mejoras pendientes

- Clasificador semántico robusto para solicitudes ambiguas, con benchmarks de prompts reales.
- Corrección automática de diseños complejos a partir de fotogramas renderizados y evaluación visual, no solo avisos geométricos.
- Detección opcional de siluetas en movimiento para reservar espacio alrededor de la persona.
- Editor visual de timeline y cajas sin editar JSON.
- Verificación real de GPT-OSS 20B en Windows, render de 60 s y compatibilidad CapCut.

**No fusionar la PR hasta completar la revisión de calidad y los checks.**
