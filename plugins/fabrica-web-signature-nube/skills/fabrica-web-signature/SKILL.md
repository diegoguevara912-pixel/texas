---
name: fabrica-web-signature
description: "Comando central que coordina toda la fábrica web signature. Usar cuando Diego diga /fabrica-web-signature, \"arranca la fábrica\", \"haz una web completa para un cliente\" o pregunte en qué etapa va un proyecto."
---

# Fábrica web signature (coordinador)

Coordina las etapas de la fábrica para un proyecto de cliente, de principio a fin, sin saltarse aprobaciones.

## Etapas, en orden
1. `/nuevo-cliente`: ficha y carpeta del proyecto.
2. `/analizar-negocio`: empresa, público y competidores.
3. `/concepto-signature`: tres conceptos y uno elegido.
4. `/diseno-signature`: identidad visual y sistema de diseño.
5. `/recursos-visuales`: imágenes y recursos con licencia.
6. `/generar-web`: páginas y código.
7. `/interacciones-premium`: animación, 3D o funciones especiales (opcional).
8. `/optimizar-web`: SEO, rendimiento, accesibilidad, móvil.
9. `/auditoria-signature`: revisión de calidad.
10. `/vista-previa`: comprobar el sitio funcionando.
11. `/preparar-hostinger`: paquete de despliegue.
12. `/publicar-hostinger`: solo con aprobación explícita.
13. `/entregar-cliente`: documentación y mantenimiento.
Para cambios posteriores sobre un sitio ya hecho: `/modificar-web`.

## Cómo coordinar
1. Preguntar o detectar qué proyecto: buscar `proyectos-web/*/estado.md`. Si no hay ninguno, empezar por `/nuevo-cliente`.
2. Leer `estado.md` y determinar la siguiente etapa pendiente.
3. Ejecutar la etapa siguiendo las instrucciones del comando correspondiente (cargar ese skill).
4. Al terminar cada etapa, actualizar `estado.md` con: etapa, fecha, archivos producidos, decisiones y pendientes.
5. Detenerse y pedir a Diego su decisión en los puntos de control: concepto elegido (etapa 3), diseño aprobado (etapa 4), auditoría superada (etapa 9), publicación (etapa 12).
6. Si una etapa no tiene la información necesaria, decir exactamente qué falta y no rellenarlo inventando.

## Formato de `estado.md`
```
# <Nombre del cliente>
Etapa actual: <n> <nombre>
| Etapa | Estado | Fecha | Archivos | Notas |
```
Al final de cada sesión, resumir en tres líneas: qué se hizo, qué sigue y qué necesita Diego.

## Reglas de la fábrica (siempre)
- Responder en español, claro y sin jerga.
- No inventar testimonios, reseñas, clientes, cifras ni resultados. Si falta un dato, dejar un marcador visible `[PENDIENTE: …]` y avisar.
- No usar datos reales de clientes en demos; las demos llevan datos ficticios marcados como ejemplo.
- Nunca escribir contraseñas, tokens ni claves en archivos del proyecto ni en el código del navegador.
- No gastar dinero, enviar mensajes a terceros ni publicar sin aprobación explícita de Diego.
- Cada proyecto vive en su propia carpeta `proyectos-web/<slug-cliente>/` y registra su avance en `estado.md`.
