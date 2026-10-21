# Modo "ficha para Hostinger" (camino por defecto, ahorra tokens)

Claude no escribe el código. Piensa el sitio y lo entrega en una **ficha completa** que Hostinger
AI Builder convierte en página. Es una sola skill: **no** llamar a agentes ni subagentes en este
modo (cada uno vuelve a leer todo y multiplica el consumo). Si algún día se usan, solo en el camino
a medida y a pedido de Diego.

## Hostinger AI Builder (según investigación web de octubre 2026; confirmar en la cuenta de Diego)
- En agosto de 2026 Hostinger unió Website Builder y Horizons en **AI Builder**:
  modo **agente** (antiguo Horizons, React + Tailwind + Framer Motion) y modo **manual**
  (antiguo Website Builder, arrastrar y soltar).
- El conector de Claude solo maneja el modo agente (`horizons_websites_create` / `_edit` / `_publish`).
  Usarlo **solo con autorización explícita de Diego**: crea un sitio y gasta créditos.
- Cada mensaje gasta **créditos variables**. Por eso la ficha va completa en un solo mensaje y se
  anotan los créditos de cada mensaje: `python core/fabrica.py creditos <slug> "mensaje" <créditos>`
  (aparece la tabla "Créditos de Hostinger" en ESTADO.md del proyecto).
- La cuenta de Diego no se lee hasta que él lo autorice en esa fase del proyecto.

## Además de la ficha, Hostinger necesita
1. Un plan con AI Builder y créditos (y hosting activo para publicar).
2. Contenido real del cliente: logo, fotos, contacto confirmado. Sin esto rellena con genérico.
3. Dominio (o subdominio temporal para la vista previa) y cupo de sitios en el plan.
4. Ajustes finales de Diego: correo del formulario, WhatsApp, redes, SEO, titular de la cuenta.

## Pasos
1. Brief → análisis breve → 3 conceptos → identidad (versión corta del flujo A–D).
2. `python core/fabrica.py ficha <slug>` crea `entrega/ficha-hostinger.md` desde
   `biblioteca/plantilla-ficha.md` con los datos del brief. Claude completa **solo** los apartados
   "[Claude: …]", reutilizando `biblioteca/bloques-texto.md` adaptados al cliente. Revisa
   `biblioteca/ejemplos-aprobados/` si hay fichas anteriores (sin copiar su diseño).
3. Pasar `biblioteca/revision-antes-de-enviar.md`.
4. Diego pega la ficha en AI Builder (o Claude la envía con autorización). Anotar créditos.
5. Diego ajusta en el editor y aprueba. Publicar es decisión suya.
6. Si la ficha dio buen resultado, guardar una copia sin datos privados en
   `biblioteca/ejemplos-aprobados/`.

No usar anime.js ni código propio insertado en este modo: en el constructor solo se ve en la vista
previa y el modo agente ya trae Framer Motion.
