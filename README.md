# VidReactMotion

**Generador de overlays y animaciones con fondo transparente mediante prompts.** Editor React y render local con Remotion. La generación funciona con **LM Studio** o con una **API compatible con OpenAI** mediante clave.

> **Estado: MVP técnico.** Se incluyen editor JSON, previsualización, animaciones de títulos/etiquetas/cifras/barras/iconos y exportación MOV/WebM con alfa. No se ha validado todavía el render de extremo a extremo en tu Windows/CapCut.

## Aplicación de escritorio (plan de evolución)

Queremos que VidReactMotion se instale en Windows como una app normal **sin login ni base de datos**, desde un icono. La opción elegida para construirla es **Electron + React + Remotion** (no es necesario reescribir React en React Native).

**Estado actual:** la PR #1 contiene el MVP web-local. **Todavía no hay instalador .exe ni `npm run dev:desktop`**. La arquitectura, seguridad, persistencia local y las pruebas necesarias están documentadas en [docs/DESKTOP.md](docs/DESKTOP.md). En la versión de escritorio final, Node/Chromium irán empaquetados; LM Studio/modelo seguirán siendo requisitos del modo IA local.

## Instalación rápida

Requisitos: **Node.js 20.11+**, npm y conexión inicial para descargar dependencias. Si usas IA local, instala también LM Studio.

En PowerShell:

```powershell
git clone https://github.com/Jotahack/VidReactMotion.git
cd VidReactMotion
npm install
Copy-Item .env.example .env
npm run dev
```

Si la rama aún está en revisión, descarga la rama `feat/modular-local-mvp` o cambia a ella con `git switch feat/modular-local-mvp`.

Abre **http://127.0.0.1:5173**. La API escucha en **127.0.0.1:3131**. Puedes previsualizar y renderizar la **escena de prueba sin conectar ninguna IA**.

## IA local — LM Studio

1. Descarga LM Studio desde **https://lmstudio.ai/**.
2. Descarga y carga un modelo *instruct* que admita salida JSON estructurada.
3. Activa su servidor local compatible con OpenAI (habitualmente `http://127.0.0.1:1234/v1`).
4. Deja el archivo `.env` así:

```dotenv
AI_PROVIDER=lmstudio
AI_BASE_URL=http://127.0.0.1:1234/v1
AI_API_KEY=
AI_MODEL=
```

5. Ejecuta `npm run dev`, actualiza la lista de modelos, selecciona uno y escribe tu prompt.

Si el servidor usa otro puerto, actualiza `AI_BASE_URL`.

## IA por API key

Cambia el `.env`:

```dotenv
AI_PROVIDER=compatible
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=TU_CLAVE_PRIVADA
AI_MODEL=ID_DEL_MODELO_COMPATIBLE
```

También se admiten otros proveedores con endpoints estilo OpenAI, si el modelo admite `response_format: json_schema`. `AI_MODEL` sirve para proveedores que no ofrezcan `GET /models`. **Nunca subas `.env` a Git**, ni pegues la API key en el frontend. Con una API externa el prompt sale a ese proveedor; el vídeo se sigue renderizando localmente.

## Flujo de trabajo

1. Escribe un prompt como «Etiqueta roja ÚLTIMA HORA, titular sobre comercio mundial y contador hasta 72, estilo informativo».
2. Selecciona horizontal **1920 × 1080** o vertical **1080 × 1920**, duración **3–12 s**.
3. Genera, revisa y, si quieres, ajusta el JSON de escena.
4. Pulsa **Renderizar transparente** y descarga **MOV ProRes 4444** o **WebM VP8**. Los archivos quedan también en `outputs/`.

El patrón ajedrezado es **solo la guía de transparencia de la vista previa**. Un MP4 H.264 convencional no conserva ese alfa. La importación de MOV alfa depende del editor y versión de CapCut: hay que probarla en el equipo final. Remotion puede descargar un navegador compatible en el primer render.

## Comandos

| Comando | Para qué sirve |
| --- | --- |
| `npm run dev` | Arrancar React y API |
| `npm run studio` | Abrir Remotion Studio |
| `npm test` | Pruebas unitarias |
| `npm run check` | Pruebas y sintaxis de API |

## Diseño del código

```text
server/
  ai/          proveedor de IA y prompt
  render/      servicio de exportación alfa
  routes/      API HTTP y validaciones
  config.mjs   configuración y secretos
src/
  remotion/    componentes de vídeo
  shared/      contrato JSON compartido y normalización
  main.jsx     interfaz React
tests/         pruebas sin depender del proveedor
docs/          arquitectura y guía de desarrollo
```

Usamos **un solo backend Node.js ligero**, sin Django, base de datos ni Docker obligatorios. Aplica SOLID/DRY/KISS: rutas y servicios separados, adaptadores de IA intercambiables, contratos compartidos y cero microservicios prematuros.

- [Arquitectura y decisiones](docs/ARCHITECTURE.md)
- [Guía de desarrollo y checklist de validación](docs/DEVELOPMENT.md)
- [Documentación de LM Studio](https://lmstudio.ai/docs/developer/openai-compat)
- [Remotion y vídeo transparente](https://www.remotion.dev/docs/transparent-videos)
- [Licencia de Remotion](https://www.remotion.dev/docs/license/pricing)

**Límites de seguridad:** la API escucha solo en `127.0.0.1`, no se ejecuta código procedente del LLM y las claves se almacenan únicamente en el entorno del servidor. No expongas el servidor públicamente sin autenticación, controles de recursos y auditoría adicional.
