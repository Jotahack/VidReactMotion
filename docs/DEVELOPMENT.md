# Desarrollo y validación

## Instalación y verificación

```bash
npm install
npm test
npm run dev
```

Usa `.env.example` como referencia. **Nunca se versiona `.env`.** El proyecto requiere Node.js 20.11+ y npm. El primer render podría requerir que Remotion descargue su navegador compatible.

## Convenciones

1. Separar presentación, aplicación, IA, validación de escena y render.
2. Evitar abstraer anticipadamente: extraer código únicamente cuando tenga una responsabilidad o elimine duplicación real.
3. Toda ampliación del contrato de escenas exige tests y documentación.
4. Nunca ejecutar código, scripts ni recursos remotos enviados por el LLM sin un sistema específico de permisos y validación.
5. Proveedores y claves se configuran en Node. No poner secretos en `VITE_*` ni en `src/`.
6. Preferir ramas pequeñas y PR con pruebas verificadas y comprobaciones manuales pendientes.

## Validación pendiente en el PC del usuario

- [ ] `npm install` y `npm run dev` en Windows PowerShell.
- [ ] Vista previa y editor JSON sin IA.
- [ ] Generación con LM Studio y modelo compatible con JSON Schema.
- [ ] Generación mediante API key externa.
- [ ] Exportación MOV ProRes 4444 con canal alfa real.
- [ ] Exportación WebM VP8 con alfa.
- [ ] Importación de MOV alfa en la versión instalada de CapCut.
- [ ] Formatos horizontal/vertical sin recortes de texto.

**Pruebas automatizadas incluidas:** configuración, validación de escenas y contrato del adaptador de IA. No equivalen a una prueba E2E real de render.

## Hitos siguientes

1. CI y tests de render con comprobación de alfa; lockfile reproducible.
2. Timeline y arrastrar/soltar con zonas seguras para Shorts.
3. Recursos reutilizables (Lucide, SVG, gráficas, mapas).
4. Múltiples escenas, transiciones y animaciones complejas.
5. Progreso y cancelación del render; guardado de proyectos.
6. Perfiles múltiples de proveedores y gestión segura de credenciales.
