# Cómo se trabaja en WEBS

## Ramas y PR
- `main` siempre funciona y tiene las pruebas en verde. Nadie hace commit directo a `main`.
- Cada cambio va en una rama con nombre descriptivo (`fabrica/paletas-nuevas`, `autolote/reservas`, `clientes/nuevo-cliente`) y se une con un PR que revisa Diego.
- Un PR = un tema. Si toca un producto, su descripción dice qué producto y cuántas pruebas pasan.

## Pruebas
| Comando | Qué revisa |
|---|---|
| `npm test` | Estructura del repo, enlaces de la portada, que no haya secretos, bases de datos ni el correo personal de Diego |
| `npm run test:fabrica` | 24 pruebas de la Fábrica Web Signature (Python) |
| `npm run test:autolote` | 35 pruebas del autolote (vitest) |

GitHub Actions corre las tres en cada PR (`.github/workflows/pruebas.yml`).

## Identidad de commits
`Diego Guevara <335656306+diegoguevara912-pixel@users.noreply.github.com>`. Configúrala una sola vez dentro del repo:
```bash
git config user.name "Diego Guevara"
git config user.email "335656306+diegoguevara912-pixel@users.noreply.github.com"
```

## Mensajes de commit
En español, en presente y cortos: «Autolote: agrega formulario de reserva». Si el cambio es grande, una línea en `CHANGELOG.md`.

## Un cliente nuevo
1. Se genera en la fábrica (Signature Studio) en el equipo de Diego.
2. Se copia a `clientes/<slug>/` sin `motor/`, sin fotos descartadas y sin datos personales.
3. Si es una empresa real sin contrato: aviso «Propuesta de demostración no oficial», `noindex`, y confirmación de Diego antes de subirla (el repo es público).
4. Se anota en `clientes/README.md` y en `docs/estado-de-proyectos.md`.
