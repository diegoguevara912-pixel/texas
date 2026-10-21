# Clientes

Un proyecto por carpeta, generado con la [Fábrica Web Signature](../productos/fabrica-web-signature/README.md). Nada aquí está publicado.

| Carpeta | Negocio | Tipo | Ver |
|---|---|---|---|
| [`sonrisa-norte/`](sonrisa-norte/) | Clínica Dental Sonrisa Norte | **Ficticio**: prueba de la fábrica, ningún dato es real | `sonrisa-norte/sitio/index.html` |
| [`sonrisa-norte-piloto/`](sonrisa-norte-piloto/) | La misma clínica, concepto «Una pausa luminosa» | **Ficticio**: piloto de Signature 2.0 | `sonrisa-norte-piloto/sitio/index.html` |

## Qué tiene cada cliente
| Archivo o carpeta | Contenido |
|---|---|
| `brief.md` / `brief.json` | Brief Inteligente Signature |
| `investigacion/` | Análisis del negocio y del sector |
| `diseno/` | Conceptos, identidad, paleta, tipografía |
| `sitio/` | La página web lista (HTML/CSS/JS estático) |
| `qa/` | Resultados de control de calidad y capturas |
| `recursos/` | Licencias de fotos y fuentes |
| `ESTADO.md`, `HISTORIAL.md` | Estado y cambios |

## Ver un sitio en local
```bash
cd clientes/sonrisa-norte-piloto/sitio
python -m http.server 8080    # abrir http://localhost:8080
```

## Usar esta carpeta con la fábrica
```powershell
$env:FABRICA_CLIENTES = "C:\ruta\a\texas\clientes"
python productos\fabrica-web-signature\core\fabrica.py qa sonrisa-norte-piloto
```

## Reglas
- No se suben registros del motor (`motor/`), fotos descartadas ni datos personales.
- Una empresa real sin contrato solo entra con la confirmación de Diego, el aviso «Propuesta de demostración no oficial» y `noindex`.
