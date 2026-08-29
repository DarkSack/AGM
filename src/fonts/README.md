# Tipografías

Se autoalojan en lugar de pedirlas a Google en cada visita.

**Por qué:** evita una conexión a un tercero en la ruta crítica de carga (DNS +
TLS + petición antes de poder pintar texto), no expone la IP del visitante a
Google, y hace el build reproducible aunque la máquina que compila no pueda
llegar a `fonts.googleapis.com`.

| Fichero | Familia | Pesos | Origen |
|---|---|---|---|
| `InstrumentSerif-Regular.woff2` | Instrument Serif | 400 | Google Fonts |
| `Archivo-Variable.woff2` | Archivo | 400–700 (variable) | Google Fonts |

Ambas están bajo **SIL Open Font License 1.1**, que permite el uso comercial y
el alojamiento propio. Son los subconjuntos latinos, que es lo que necesitan el
español y el inglés.

Para actualizarlas, descarga el `.woff2` del bloque `/* latin */` que devuelve
`https://fonts.googleapis.com/css2?family=...` con un User-Agent de navegador
moderno, y sustituye el fichero conservando el nombre.
