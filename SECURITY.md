# Seguridad

Este repositorio es **público**. Todo lo que se sube aquí lo puede ver cualquiera, y aunque luego se borre queda en el historial de git.

## Lo que nunca se sube
- Archivos `.env` o cualquier contraseña, llave de API, token o secreto (solo `.env.example` con valores vacíos).
- Bases de datos (`*.sqlite`, `*.db`, volcados `.sql` con datos) y archivos subidos por usuarios (`uploads/`).
- Datos personales de clientes o visitantes (nombres, teléfonos, correos, direcciones, coordenadas) y el correo personal de Diego.
- Contraseñas de herramientas locales (OmniRoute, Signature Studio, Hostinger, GitHub).

`.gitignore` bloquea los casos comunes y `npm test` revisa el repositorio en cada PR.

## Dónde van los secretos
- **En el equipo:** en `.env` dentro de cada producto (ignorado por git).
- **En Hostinger:** en las variables de entorno de la app Node.js o en un archivo de configuración fuera de la carpeta pública. Nunca en el código ni en JavaScript del navegador.

## Reglas de los productos
- **Autolote:** contraseñas con bcrypt, sesiones con cookie `HttpOnly`, límite de intentos, Helmet y validación con zod. El primer administrador se crea con `npm run admin:create`; las variables `ADMIN_BOOTSTRAP_*` se borran después de usarlas.
- **Signature Studio:** solo escucha en `127.0.0.1` y pide una llave nueva cada vez que se abre.
- **Bases de datos en la nube:** ningún proyecto se publica sin seguridad por filas (RLS) o un control de acceso equivalente.

## Si se subió un secreto por error
1. Cambia (rota) la clave de inmediato en el servicio correspondiente: borrarla del repo no basta.
2. Avisa a Diego y abre un PR que la quite.
3. Si hace falta, se limpia el historial con ayuda; nunca se reescribe `main` sin acuerdo.

## Reportar un problema
Abre un *issue* sin incluir el secreto ni datos personales, o escribe a Diego por GitHub (@diegoguevara912-pixel).
