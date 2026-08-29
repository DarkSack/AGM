export const THEME_STORAGE_KEY = "agm-theme";

/**
 * Script bloqueante minimo que aplica el tema antes del primer pintado.
 *
 * Sin esto, una recarga en modo oscuro muestra un destello blanco: el HTML se
 * pinta antes de que React hidrate. Va inline en el <head> y ocupa unos pocos
 * cientos de bytes.
 *
 * Sin eleccion guardada se sigue `prefers-color-scheme`, y en ese caso se
 * marca `data-theme-source="system"` para que la preferencia del sistema se
 * pueda seguir en vivo.
 */
const script = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
    var root = document.documentElement;
    if (stored === 'dark' || stored === 'light') {
      root.classList.toggle('dark', stored === 'dark');
      root.dataset.themeSource = 'user';
    } else {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.dataset.themeSource = 'system';
    }
  } catch (e) {
    /* Navegacion privada con storage bloqueado: se queda en el tema claro. */
  }
  document.documentElement.classList.add('js-reveal');

  /* Salvavidas: si el bundle de la aplicacion no llega a ejecutarse, el
     observador nunca revelaria nada y la pagina se quedaria en blanco. Pasado
     el margen, se retira la clase y todo el contenido queda visible. */
  setTimeout(function () {
    if (!document.documentElement.dataset.revealReady) {
      document.documentElement.classList.remove('js-reveal');
    }
  }, 2500);
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
