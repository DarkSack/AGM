import type { Metadata, Viewport } from "next";
import { displayFont, sansFont } from "@/fonts";
import { ThemeKeeper } from "@/components/layout/ThemeKeeper";
import { ThemeScript } from "@/components/layout/ThemeScript";
import "../../globals.css";

/**
 * Root layout del panel, independiente del sitio publico.
 *
 * Next permite varios root layouts si cuelgan de grupos de ruta distintos, y
 * aqui interesa: el panel no necesita el serif editorial, ni las traducciones,
 * ni el observador de animaciones. Separarlos evita cargar en `/admin` codigo
 * que solo sirve para la portada, y al reves.
 */
export const metadata: Metadata = {
  title: "Panel · AGM Diseño y Proyección",
  description: "Administración del sitio de AGM Diseño y Proyección.",
  // El panel nunca debe aparecer en un buscador.
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Igual que en el sitio publico: <html> se deja fuera de React para que
    // el script de tema pueda gestionarlo sin que un re-render lo borre.
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${sansFont.variable} ${displayFont.variable} min-h-svh bg-bg-alt font-sans antialiased`}
      >
        {children}
        <ThemeKeeper />
      </body>
    </html>
  );
}
