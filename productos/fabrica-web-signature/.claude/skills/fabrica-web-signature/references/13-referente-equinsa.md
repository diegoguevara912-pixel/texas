# Referente de proceso y calidad: Equinsa Energy

Equinsa Energy (demo de octubre de 2026, concepto «Plano vivo») es la referencia de **nivel y
procedimiento** de la fábrica. **No es una plantilla visual.** No copies su paleta azul y verde, sus
tipografías Sora y Source Sans 3, su plano animado, su orden de secciones ni sus textos. Una clínica
no debe parecer una empresa energética; un restaurante no debe parecer una constructora.
Auditoría completa: `docs/auditoria-equinsa.md`.

## Lo que se repite en cada proyecto (criterios, no apariencia)
1. **Concepto nacido del mundo del cliente.** Antes de los conceptos, lista la «materia prima»
   real del negocio (oficio, lugares, objetos, procesos, historia verificable). Cada concepto parte de ahí.
2. **Tres conceptos de verdad distintos**, con la razón concreta para descartar dos (ej.: «depende de
   fotos que no existen», «se aleja de los colores que pidió Diego»).
3. **Un solo elemento memorable** que explica el negocio en 5 segundos, y todo lo demás sobrio.
   Escribe cuál es y por qué.
4. **Revisión contra lo genérico, escrita**: qué patrón trillado se iba a usar y por qué se cambió
   (filas de números grandes, tarjetas idénticas, fotos de banco, degradados de moda…).
5. **Honestidad visible**: HECHO/HIPÓTESIS con fuente en el análisis; `[PENDIENTE]` para lo que el
   cliente debe confirmar; «Ejemplo ilustrativo» en demos; nunca obras ajenas como propias.
6. **Funciones que califican al prospecto**: la interacción ayuda a decidir (diagnóstico,
   cotizador, selector) y alimenta el formulario o WhatsApp; nada decorativo sin propósito.
7. **Sistema tipográfico con tokens**: dos familias como máximo, escala fija con `clamp`, reglas de
   uso escritas (mayúsculas, pesos, largo de línea 60–72 caracteres).
8. **Color con reglas de uso** y contraste AA medido; si un tono falla, se corrige el token y se
   actualiza `identidad.json` (en Equinsa quedó desactualizado: no repetirlo).
9. **Bucle medido**: probar en navegador real, corregir y volver a probar. Equinsa pasó de 45/50 a
   50/50 y de Lighthouse móvil 87 a 100. Reporta lo no ejecutado.
10. **Ligero y compatible**: sitio estático sin framework (~300 KB), carga de fuentes no bloqueante,
    `.htaccess` con 404, seguridad y caché; funciona en cualquier plan de Hostinger.

## Señales de calidad que se exigen
- Primera pantalla: qué es, para quién y qué hacer, en 5 segundos, también en 390 px.
- Jerarquía tipográfica clara; nada de texto gris claro sobre blanco.
- Movimiento solo donde explica algo, y detenido con `prefers-reduced-motion`.
- Formularios con validación en vivo, mensajes claros, foco en el primer error y privacidad enlazada.
- Sin errores de consola, sin scroll horizontal, sin recursos rotos.
