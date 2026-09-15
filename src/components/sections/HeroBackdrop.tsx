/**
 * Fondo del hero cuando el despacho todavia no ha subido su fotografia.
 *
 * Luz en lugar de lineas: la proyeccion de una ventana con celosia sobre un
 * muro, con la penumbra suave de la luz natural y un grano minimo de enlucido.
 * Es el recurso con el que la arquitectura se fotografia a si misma, y a
 * diferencia del dibujo de lineas anterior no parece un icono generico de
 * "casa".
 *
 * Todo es CSS (degradados, `clip-path`, `blur`): cero peticiones de red y el
 * LCP sigue siendo el titular. Los colores salen de los tokens del tema, asi
 * que en claro es sol calido y en oscuro luz de luna fria. La deriva de la luz
 * es muy lenta y se desactiva con `prefers-reduced-motion`.
 *
 * En cuanto se sube una imagen desde el panel, `Hero` la usa en su lugar.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="hero-backdrop absolute inset-0 overflow-hidden">
      {/* Muro: mas luz arriba a la derecha, mas sombra hacia el titular. */}
      <div className="hero-backdrop__wall absolute inset-0" />

      {/* Resplandor amplio de la ventana, sin forma definida. */}
      <div className="hero-backdrop__glow absolute" />

      {/* Proyeccion de la ventana con las sombras de la celosia. */}
      <div className="hero-backdrop__beam absolute">
        <div className="hero-backdrop__slats size-full" />
      </div>

      {/* Arista de un muro en sombra: da profundidad sin dibujar nada. */}
      <div className="hero-backdrop__shade absolute" />

      {/* Grano de enlucido, casi imperceptible. */}
      <div className="hero-backdrop__grain absolute inset-0" />

      {/* Difuminado inferior: enlaza el hero con la seccion siguiente. */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-b from-transparent to-bg" />
    </div>
  );
}
