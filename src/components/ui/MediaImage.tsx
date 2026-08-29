import Image from "next/image";
import { cn } from "@/lib/cn";

interface MediaImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  className?: string;
  priority?: boolean;
}

/**
 * Imagen del sitio, con dos caminos deliberados.
 *
 * Las fotografias que sube el despacho pasan por `next/image`: se sirven en
 * AVIF/WebP, en varios tamanos y con lazy loading.
 *
 * Los marcadores SVG que se generan localmente se sirven con un `<img>`
 * normal. Optimizar un SVG de 1,5 KB no aporta nada, y activar
 * `dangerouslyAllowSVG` para ello abriria la puerta a que cualquier SVG subido
 * al bucket se sirviera desde nuestro dominio, que es un vector de XSS
 * conocido. El ancho y el alto van explicitos, asi que no hay CLS en ninguno
 * de los dos casos.
 */
export function MediaImage({
  src,
  alt,
  width,
  height,
  sizes,
  className,
  priority = false,
}: MediaImageProps) {
  const isVectorPlaceholder = src.startsWith("/") && src.endsWith(".svg");

  if (isVectorPlaceholder) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- ver comentario del componente
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={cn("size-full object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={cn("size-full object-cover", className)}
    />
  );
}
