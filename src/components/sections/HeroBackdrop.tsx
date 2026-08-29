/**
 * Fondo del hero cuando el despacho todavia no ha subido su fotografia.
 *
 * Es un dibujo de lineas —volumenes, cubierta, retícula de fachada y linea de
 * horizonte— en lugar de una foto de banco de imagenes: no compromete a AGM
 * con una obra que no es suya, no cuesta una sola peticion de red y hace que
 * el LCP sea el titular, que es texto y se pinta de inmediato.
 *
 * En cuanto se sube una imagen desde el panel, `Hero` la usa en su lugar.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {/* Lavado de color muy tenue que da profundidad al fondo plano. */}
      <div className="absolute inset-0 bg-linear-to-b from-bg-alt via-bg to-bg" />
      <div className="absolute inset-0 bg-radial-[at_72%_28%] from-accent-soft/70 to-transparent to-70%" />

      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 size-full text-fg"
        fill="none"
        stroke="currentColor"
      >
        {/* Retícula de fondo: la trama de un plano. */}
        <g strokeWidth="1" className="opacity-[0.06]">
          {Array.from({ length: 17 }, (_, index) => (
            <line
              key={`v-${index}`}
              x1={index * 90}
              y1="0"
              x2={index * 90}
              y2="900"
            />
          ))}
          {Array.from({ length: 11 }, (_, index) => (
            <line
              key={`h-${index}`}
              x1="0"
              y1={index * 90}
              x2="1440"
              y2={index * 90}
            />
          ))}
        </g>

        {/* Volumen principal con cubierta a un agua y su retícula de vanos. */}
        <g strokeWidth="1.25" className="opacity-[0.16]">
          <path d="M820 720V330l260-120 260 120v390" />
          <path d="M820 330l260 120 260-120" />
          <path d="M1080 450v270" />
          <path d="M860 700h180M860 640h180M860 580h180M860 520h180" />
          <path d="M1120 700h180M1120 640h180M1120 580h180M1120 520h180" />
        </g>

        {/* Volumen secundario en primer plano, mas contrastado. */}
        <g strokeWidth="1.5" className="opacity-[0.13]">
          <path d="M540 720V470l180-70 180 70" />
          <path d="M540 470h360" />
          <path d="M620 720V560h100v160" />
        </g>

        {/* Linea de horizonte y pavimento. */}
        <g strokeWidth="1" className="opacity-[0.12]">
          <line x1="0" y1="720" x2="1440" y2="720" />
          <line x1="0" y1="756" x2="1440" y2="756" />
          <path d="M0 900l420-144M240 900l420-144M480 900l420-144M720 900l420-144M960 900l420-144" />
        </g>
      </svg>

      {/* Difuminado inferior: enlaza el hero con la seccion siguiente. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-b from-transparent to-bg" />
    </div>
  );
}
