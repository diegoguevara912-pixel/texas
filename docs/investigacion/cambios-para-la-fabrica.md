# Cambios para la Fábrica Web Signature (resultado de la comparación de herramientas)

Origen: informe "Fábrica actual vs herramientas alternativas.md" (misma carpeta). Diego aprobó el 2026-10-15: "solamente suma a la fábrica lo que realmente sea aprovechable".
Reglas que siguen vigentes: no crear páginas, no tocar ni leer la cuenta de Hostinger, nada comercial, no comprar nada.

## 1. Modo ficha: apuntar a AI Builder y medir créditos
- Actualizar textos: en agosto de 2026 Hostinger unió Website Builder y Horizons en **AI Builder** (modo agente = antiguo Horizons; modo manual = antiguo Website Builder). El conector de Claude solo maneja el modo agente.
- La ficha debe salir completa en un solo documento (todas las secciones, textos finales, colores, tipografías, contenido real del cliente o lo que falta) para que Hostinger acierte en pocos mensajes: cada mensaje gasta créditos dinámicos.
- Agregar al `estado.md` de cada proyecto una tabla "Créditos de Hostinger" (fecha, mensaje, créditos) para medir el costo real por página con el uso.
- Enviar la ficha por el conector solo con autorización explícita de Diego (sin cambios a la regla actual).

## 2. Biblioteca reutilizable (compatible con Obsidian, opcional)
- Crear `biblioteca/` con: plantilla de ficha, ejemplos de fichas aprobadas (vacía por ahora), lista de revisión antes de enviar a Hostinger y bloques de texto en español reutilizables.
- El modo ficha lee la plantilla y completa solo lo que cambia por cliente, en vez de redactar todo desde cero (ahorra tokens).
- Todo en Markdown simple: Diego puede abrir la carpeta de la fábrica como bóveda en Obsidian si quiere, sin plugins. Obsidian no es requisito ni se instala.

## 3. anime.js solo en el camino de código a medida
- En la guía de interacciones del camino a medida: usar anime.js v4 (MIT) para 2 o 3 detalles de marca (logo que se dibuja, contadores, aparición al hacer scroll), cargando solo los módulos necesarios desde un archivo local del proyecto, respetando `prefers-reduced-motion` y revisando velocidad en celular.
- No usarlo en el modo ficha ni en código insertado en el constructor de Hostinger (allí se ve solo en vista previa, y el modo agente ya trae Framer Motion).

## 4. README: sección "Para aprender"
- Enlace a https://blog.vibecoder.me (tutoriales gratis de construir con IA, en inglés). Solo lectura opcional.

## 5. Agentes: no conectarlos al modo ficha
- Mantener el modo ficha como una sola skill, sin llamar a los 15 agentes (cada agente vuelve a leer todo y multiplica el consumo de tokens).
- Si algún día se conectan, que sea solo en el camino a medida y a pedido (por ejemplo `seguridad` y `control-calidad`).

## Lo que no se suma (decisión del informe)
Manus, MotionSites, n8n y Ollama: pagos nuevos, costo impredecible, servidor aparte o requisitos de equipo, sin mejorar el paso "definir → Hostinger construye → aprobar".
