# VidReactMotion

Aplicación para crear **overlays animados con transparencia** desde prompts, con React y Remotion.

**En desarrollo (MVP).** El render se ejecuta localmente. La generación de escenas puede utilizar **LM Studio** en el ordenador o un servicio de IA con **API key**.

## Propuesta de arquitectura

- **Frontend React + Remotion Player:** editor de escenas, previsualización y exportación.
- **Backend ligero Node.js:** puente con proveedores IA, custodia de API keys y orquestación del render.
- **Escenas JSON validadas:** el modelo devuelve datos estructurados; nunca ejecutamos JavaScript generado por IA.
- **MOV ProRes 4444/WebM con alfa:** superposición sobre el vídeo principal en editores compatibles.
- **Sin Django, base de datos ni Docker obligatorios** para el MVP. Un solo `npm install` y `npm run dev`.

El backend es útil aunque la IA se ejecute localmente: Remotion necesita renderizar, escribir archivos y gestionar recursos; las claves de APIs externas nunca deben ir en el navegador.

Documentación de instalación, configuración y arquitectura y código de la primera versión se preparan en una rama de desarrollo antes de integrarlos.

## Enlaces

- [LM Studio](https://lmstudio.ai/)
- [Remotion](https://www.remotion.dev/)
- [Licencia de Remotion](https://www.remotion.dev/docs/license/pricing)
