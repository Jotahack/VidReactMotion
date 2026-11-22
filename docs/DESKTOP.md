# VidReactMotion Desktop — decisión de arquitectura (propuesta)

> Estado: **diseño y plan de implementación**, no aplicación de escritorio terminada. La PR #1 sigue siendo un MVP web-local; esta decisión no implica que ya exista un instalador.

## Objetivo de producto

Una app de escritorio **Windows** que se abra desde el menú Inicio o un icono, sin navegador, sin cuentas ni base de datos ni Docker. Se instala una vez y permite generar y exportar overlays animados de vídeo (16:9 y 9:16) a partir de prompts con **LM Studio local** o un proveedor compatible por API key. El vídeo se procesa en el equipo. Mac y Linux son destinos posteriores si se validan sus binarios.

## Decisión: Electron + React + Remotion

**Preferimos Electron (Electron Forge) a React Native Windows y a Tauri para la primera versión.**

- Conservamos la UI React DOM y `@remotion/player` sin reescribirla como componentes nativos.
- Electron integra Chromium y Node, lo que facilita las operaciones de filesystem, exportación y render local con `@remotion/renderer`.
- El template oficial `remotion-dev/template-electron` proporciona una referencia para Electron Forge + Vite + Remotion.
- A cambio el instalador ocupa más. Tauri es posible, pero empacar y controlar el runtime Node como *sidecar* añade complejidad al MVP.
- React Native Windows es técnicamente posible, pero no aporta una ventaja clara: la UI y el motor actual dependen de React web y APIs de navegador.

Referencias:
- https://www.remotion.dev/docs/electron
- https://github.com/remotion-dev/template-electron
- https://www.electronjs.org/docs/latest/
- https://microsoft.github.io/react-native-windows/
- https://v2.tauri.app/learn/sidecar-nodejs/

## UX sin login

1. Doble clic en **VidReactMotion** -> abre la ventana principal.
2. Primer inicio: asistente de conexión para **LM Studio** (endpoint local; detectar estado y modelos) o **API compatible** (endpoint/modelo/clave). Ningún registro de usuario.
3. Crear escena desde prompt, escoger **16:9 / 9:16**, editar escena y previsualizar con cuadrícula alfa o vídeo de referencia.
4. Exportar MOV ProRes 4444 o WebM alfa, elegir carpeta con el selector nativo y abrir el resultado.
5. Los proyectos/ajustes se guardan **en el ordenador**. No se requiere una base de datos.

**Importante:** LM Studio y un modelo descargado/cargado siguen siendo necesarios para el modo IA local; la app no debería afirmar que administra LM Studio automáticamente. Para funcionamiento totalmente offline, también se deben empacar los componentes de render que Remotion pueda necesitar.

## Capas (SOLID / DRY / KISS)

```text
UI React + Remotion Player
  -> Desktop gateway (preload; IPC limitado) / Web gateway (fetch actual)
      -> Application services (generateScene, listModels, render, saveProject)
          -> AI provider adapter (LM Studio / API compatible)
          -> Remotion renderer adapter
          -> Local project/settings storage (archivos)
Electron main: ventana, ciclo de vida, filesystem seguro, diálogos, IPC
```

Los servicios de dominio no deben importar `electron`, `express` ni componentes React. Express continúa disponible para el modo desarrollo web; el escritorio utiliza un adaptador IPC con las mismas operaciones. Evitamos duplicar el render y el contrato de escenas. **No ejecutar JS arbitrario generado por el LLM.**

## Persistencia local, sin base de datos

- **Configuración no sensible**: JSON validado en el directorio de datos de usuario de Electron (`app.getPath('userData')`). Preferencias: idioma, formato por defecto, proveedor seleccionado, último proyecto.
- **Proyectos**: archivos JSON versionados, exportables/importables, con migraciones pequeñas de esquema cuando sea necesario. No usar `localStorage` como almacenamiento principal de proyectos.
- **Vídeos**: carpeta elegida por el usuario, con salida temporal segura en `app.getPath('temp')`; limpieza de archivos fallidos.
- **API keys**: nunca en JSON, `.env`, logs ni bundle de frontend en producción. Usar el almacén seguro del sistema a través de la integración de Electron (por ejemplo `safeStorage` con comprobación de disponibilidad) y documentar limitaciones por plataforma. `.env` queda exclusivamente para desarrollo.
- Un modo local sin API key debe poder funcionar únicamente con LM Studio.

## Seguridad del escritorio

- Ventana con `nodeIntegration: false`, `contextIsolation: true` y `sandbox: true` donde lo permita el bridge.
- `preload` expone solo comandos específicos (nunca filesystem genérico ni `ipcRenderer` completo).
- Validar payload, tamaño, rutas y origen de cada IPC; impedir navegación no deseada y limitar permisos.
- Mantener el modelo `JSON -> validación -> componentes`; no evaluar código del prompt.
- Los renders pueden ser pesados: progreso, cancelación y límite de uno concurrente; manejo de errores sin filtrar secretos.
- Revisar licencias de Remotion y dependencias para distribución.

## Particularidades críticas del empaquetado Remotion

La documentación oficial de Remotion **marca la integración Electron como experimental**. Para un ejecutable de verdad:

1. En desarrollo se puede usar `bundle()` al renderizar. **Empaquetado: generar el bundle Remotion durante el build**; no ejecutar `bundle()` en producción.
2. Invocar `selectComposition()` y `renderMedia()` desde el proceso principal, no desde la ventana web.
3. Extraer el compositor nativo al directorio desempaquetado (`app.asar.unpacked`) y configurar `binariesDirectory`.
4. Decidir si distribuir Chrome Headless Shell con la aplicación o descargarlo en el primer render con `ensureBrowser()`; avisar al usuario de la primera descarga. Solo la primera opción facilita renders completamente offline desde el primer arranque, pero aumenta el tamaño.
5. Probar un instalador Windows real, no solo `npm run dev`; verificar transparencia en MOV/WebM y compatibilidad con CapCut.

## Plan de trabajo en PRs pequeñas

- [ ] **Fase 1 — Desktop shell:** dependencias y configuración Electron Forge; ventana, acceso directo y scripts `dev:desktop`/packaging sin romper el modo web.
- [ ] **Fase 2 — Gateway:** extraer lógica de aplicación de rutas Express; adaptador IPC y preload mínimo; mantener `fetch` para navegador de desarrollo.
- [ ] **Fase 3 — Ajustes y proyectos:** asistente LM Studio/API, almacenamiento local JSON, credenciales protegidas y errores de conexión comprensibles.
- [ ] **Fase 4 — Render empaquetado:** prebundle Remotion, compositor/binarios y navegador; diálogo de guardado, progreso y cancelación.
- [ ] **Fase 5 — Calidad:** tests unitarios + integración + smoke test instalador Windows, alfa real y CapCut; CI y documentación de instalación/actualizaciones.

### Criterios de aceptación de la primera versión de escritorio

- Se instala y abre desde un icono **sin exigir Node, npm ni un navegador al usuario final**.
- **No hay registro ni inicio de sesión**. Funciona sin base de datos ni servicio cloud obligatorio.
- Descubre LM Studio local y explica qué hacer si el servidor/modelo no están listos.
- Mantiene escena y formato coherentes entre vista previa y render, para 9:16 y 16:9.
- Exporta vídeo con **canal alfa comprobado mediante una prueba automatizada y una prueba manual en CapCut**.
- Las claves no aparecen en el frontend, en la carpeta de proyectos ni en los logs.
- Se puede desarrollar la UI desde el modo web actual sin deshacer la arquitectura.
