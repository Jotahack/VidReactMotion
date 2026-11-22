# Arquitectura

## ¿Por qué backend?

**Sí, pero pequeño.** Necesitamos un proceso local para hablar con LM Studio y proveedores cloud, proteger API keys, renderizar con Remotion, acceder al sistema de archivos y devolver el vídeo. Elegimos **Node.js + Express** para compartir runtime con Remotion y evitar introducir Django, Python o dos procesos de backend.

**No necesitamos una base de datos en el MVP.** Las escenas están en memoria del navegador y los vídeos se escriben en `outputs/`. La persistencia de proyectos será una evolución independiente.

## Flujo

```text
Prompt -> React -> API Express -> proveedor IA
                                |-> LM Studio localhost
                                |-> API externa + clave del servidor
                     <- JSON de escena validado
       React + Remotion Player -> previsualización
       React -> API /render -> Remotion Renderer -> MOV / WebM alfa
```

## Responsabilidades de módulos

| Capa | Responsabilidad |
| --- | --- |
| `src/main.jsx` | Prompt, estados, formularios, vista previa |
| `src/shared/spec.js` | Esquema compartido, enumeraciones, normalización |
| `src/remotion/` | Componentes visuales de la animación |
| `server/routes/api.mjs` | Validación de solicitudes y orquestación |
| `server/ai/provider.mjs` | Contrato `listModels` / `generateScene` y transporte HTTP |
| `server/ai/prompt.mjs` | Instrucciones de generación |
| `server/render/render-service.mjs` | Render local, codec alfa y control de concurrencia |
| `server/config.mjs` | Validar variables de entorno sin filtrar claves |

## Principios

- **SOLID:** cada módulo cumple una responsabilidad. Rutas reciben por inyección los servicios de IA y render, en lugar de acoplarse a sus implementaciones.
- **DRY:** frontend y backend comparten `normalizeSpec`; un solo contrato de escena.
- **KISS:** un proyecto Node, una UI React y sin Docker/base de datos/colas en la primera versión.
- **Seguridad:** el LLM genera JSON estructurado, no JS/HTML ejecutable. Configuración de proveedores fija por `.env`, no por URLs introducidas por el prompt. No exponer el servicio local en red pública.

## API

- `GET /api/health`: estado y proveedor, sin secretos.
- `GET /api/models`: modelos disponibles o `AI_MODEL`.
- `POST /api/generate`: prompt, modelo, orientación y duración => escena normalizada.
- `POST /api/render`: escena y codec => nombre y URL de descarga.
- `GET /api/files/:filename`: archivos renderizados.

## Evolución a aplicación de escritorio

La siguiente etapa propone **Electron** para conservar React/Remotion y distribuir un ejecutable Windows sin cuentas ni base de datos. No debemos integrar directamente Electron en los servicios de negocio: un adaptador de escritorio por IPC compartirá operaciones con el adaptador Express del modo web. Las claves de API requieren almacenamiento seguro del sistema, mientras escenas y ajustes se guardarán en archivos locales.

El plan técnico y sus pruebas de aceptación están en [DESKTOP.md](DESKTOP.md). **Esta integración aún no está implementada.**

## Decisiones pendientes

- API cloud: actualmente exige soporte de JSON Schema estructurado. Más adelante soportaremos capacidades diferentes por proveedor.
- El render es **secuencial** para controlar consumo de recursos. Falta progreso, cancelación y limpieza automática.
- Falta prueba E2E del MOV con canal alfa e importación en CapCut.
- No se admiten todavía assets remotos ni código arbitrario producido por IA; los incorporaremos con mecanismos de validación separados.
