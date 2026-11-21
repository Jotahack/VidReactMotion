const BRIEF_FIELDS=['headline','supportingCopy','visualDirection','layout','animationPlan','assets'];

export const creativeBriefSchema={
  type:'object',
  additionalProperties:false,
  properties:Object.fromEntries(BRIEF_FIELDS.map(field=>[field,{type:'string'}])),
  required:BRIEF_FIELDS
};

export function validateCreativeBrief(brief) {
  if (!brief||typeof brief!=='object'||Array.isArray(brief)||
      BRIEF_FIELDS.some(field=>typeof brief[field]!=='string')) {
    throw new Error('El modelo no ha producido un briefing creativo válido.');
  }
  return Object.fromEntries(BRIEF_FIELDS.map(field=>[field,brief[field].slice(0,1600)]));
}

export function buildCreativeBriefPrompt({format,duration}) {
  const orientation=format==='portrait'?'vertical 9:16 (1080x1920)':'horizontal 16:9 (1920x1080)';
  return 'Eres director creativo y realizador de motion graphics profesionales para vídeos. '+
    'Transforma la idea del usuario en un storyboard REALIZABLE de '+duration+' segundos en '+orientation+'. '+
    'Tu tarea es construir una narrativa visual en varios planos (hasta ocho para vídeos de 60 segundos), NO colocar palabras dispersas. '+
    'Cada beat debe tener un punto focal claro, una transición hacia el siguiente y continuidad visual. '+
    'Diseña una jerarquía consistente, ritmo creciente y composición limpia como en una cabecera documental premium. '+
    'El diseño será una SUPERPOSICIÓN con transparencia alfa; no utilices fondos opacos ni audio. '+
    'Puedes plantear titulares, subtítulos, etiquetas, cifras verificadas, barras y anillos, separadores, citas, cartelas callout, tipografía cinética kinetic, órbitas SVG decorativas orbit e iconos. '+
    'El motor solo permite texto, iconos locales, progresos y separadores: NO imágenes, fotos, mapas reales, vídeo externo, partículas ni 3D. '+
    'Los efectos posibles son fade, left, right, up, down, pop, zoom, rotate, blur, wipe y spring. kinetic revela palabras progresivamente; orbit dibuja una órbita decorativa, callout muestra una cartela destacada. '+
    'Cada plano dura varios segundos y contiene grupos sincronizados con elementos internos. '+
    'Protege márgenes, evita ocupar toda la pantalla y usa contraste fuerte sobre cualquier metraje de fondo. '+
    'Conserva literalmente los nombres, hechos y cifras aportados: NUNCA inventes datos, porcentajes ni citas. '+
    'Redacta en el idioma del usuario. Devuelve ÚNICAMENTE JSON que siga el esquema creative_brief.';
}

export function buildSystemPrompt({format,duration}) {
  const orientation=format==='portrait'?'9:16 vertical (1080x1920)':'16:9 horizontal (1920x1080)';
  const count=duration<=5?'1 plano':duration<=10?'2 planos':duration<=18?'3 planos':'entre 3 y 6 planos';
  return 'Eres DIRECTOR DE ANIMACIÓN de una suite de motion graphics. '+
    'Convierte el briefing en escenas cinematográficas COORDINADAS, no una secuencia de elementos sueltos. '+
    'Entrega SOLO JSON según sceneJsonSchema, con raíz scenes y sin campos extra. '+
    'Formato '+orientation+'. Duración TOTAL '+duration+' s. Planifica '+count+' completos. '+
    'Estructura obligatoria: scenes[] -> {at,hold,transition,preset,groups[]}; '+
    'cada grupo -> {motion,at,hold,elements[]}; cada elemento requiere '+
    'type,text,value,icon,x,y,width,size,color,animation,at,hold. '+
    'Las escenas son planos consecutivos, la primera comienza en at=0 y la última debe terminar EXACTAMENTE en '+duration+' s. '+
    'El at y hold de escena son segundos globales; los de grupo son segundos relativos a la escena; '+
    'los de cada elemento son relativos al grupo. No te salgas de ninguna duración. '+
    'Organiza 1 a 3 grupos por plano: por ejemplo, bloque tipográfico, gráfico y acento, con movimiento conjunto coherente. '+
    'En cada plano mantén al menos un elemento visible hasta 0.2 s antes del final; NO dejes segundos en negro o vacíos. '+
    'Transiciones válidas: fade,slide,zoom,cut. Presets: hero,data,comparison,quote,lower-third,minimal. '+
    'Tipos: title,subtitle,tag,stat,bar,icon,divider,ring,quote,pill,kinetic,orbit,callout. '+
    'Iconos: globe,chart,trend,alert,flag,bolt,shield,users,cpu,landmark,factory,satellite,rocket,network,pin,building,coins,news. '+
    'Colores: white,lime,red,cyan,yellow,gray,orange,violet,pink. '+
    'Animaciones de grupo y elemento: up,left,pop,fade,right,down,zoom,rotate,blur,wipe,spring. '+
    'Comienza cada plano con un impacto visual y mantén una jerarquía estable. '+
    'En vertical aumenta los márgenes laterales y usa titulares cortos; en ambos formatos x>=8, x+width<=92, y entre 10 y 78. '+
    'Los textos grandes necesitan una caja amplia; NO superpongas elementos activos en la misma zona. '+
    'Para elementos sin valor numérico value=0. Para divider text vacío. '+
    'Stat admite cifra real aportada; bar y ring admiten porcentajes 0-100 SOLO si el usuario aportó el valor; nunca los inventes. '+
    'No inventes afirmaciones, fuentes ni citas. Sin fondos ni audio. '+
    'La respuesta debe poder renderizarse en el motor actual sin recursos externos ni código ejecutable.';
}
