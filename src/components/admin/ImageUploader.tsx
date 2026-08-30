"use client";

import { useCallback, useRef, useState } from "react";
import { LOCALES } from "@/config/site";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import {
  MAX_UPLOAD_BYTES,
  STORAGE_BUCKET,
  isAllowedImageType,
} from "@/lib/supabase/config";
import { slugify } from "@/lib/slug";
import type { ProjectImage } from "@/types/content";
import { useDragReorder } from "./useDragReorder";

interface ImageUploaderProps {
  images: ProjectImage[];
  onChange: (images: ProjectImage[]) => void;
  /** Carpeta dentro del bucket. Agrupa los archivos por proyecto. */
  folder: string;
  /** Cuando es true, la primera imagen se marca como portada en la interfaz. */
  firstIsCover?: boolean;
}

/**
 * Galeria de imagenes del panel.
 *
 * La subida va directa del navegador a Supabase Storage con la sesion del
 * usuario, sin pasar por nuestro servidor: no tiene sentido gastar ancho de
 * banda y tiempo de funcion en reenviar un archivo que el bucket puede recibir.
 *
 * Se valida tipo y tamano antes de subir para dar un error inmediato, pero la
 * barrera real es el bucket, que tiene declarados `allowed_mime_types` y
 * `file_size_limit`, y la politica RLS que exige ser personal del despacho.
 * Un cliente manipulado no puede saltarse ninguna de las dos.
 */
export function ImageUploader({
  images,
  onChange,
  folder,
  firstIsCover = true,
}: ImageUploaderProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const readDimensions = (file: File) =>
    new Promise<{ width: number | null; height: number | null }>((resolve) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
        URL.revokeObjectURL(url);
      };
      image.onerror = () => {
        // Sin dimensiones la imagen sigue siendo valida; solo perdemos el
        // ratio exacto, que el CSS resuelve con el contenedor.
        resolve({ width: null, height: null });
        URL.revokeObjectURL(url);
      };
      image.src = url;
    });

  const upload = useCallback(
    async (files: FileList) => {
      setError(null);
      setBusy(true);

      try {
        const supabase = createClient();
        const uploaded: ProjectImage[] = [];

        for (const file of Array.from(files)) {
          if (!isAllowedImageType(file.type)) {
            throw new Error(
              `«${file.name}» no es un formato admitido. Usa JPG, PNG, WebP o AVIF.`,
            );
          }
          if (file.size > MAX_UPLOAD_BYTES) {
            const mb = (MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0);
            throw new Error(`«${file.name}» supera los ${mb} MB permitidos.`);
          }

          const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
          // El nombre original puede traer acentos, espacios o caracteres que
          // complican la URL; se descarta y se genera uno propio.
          const path = `${slugify(folder) || "general"}/${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(path, file, { cacheControl: "31536000", upsert: false });

          if (uploadError) throw new Error(uploadError.message);

          const { data } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(path);

          const { width, height } = await readDimensions(file);

          uploaded.push({
            id: path,
            url: data.publicUrl,
            alt: Object.fromEntries(
              LOCALES.map((locale) => [locale, ""]),
            ) as ProjectImage["alt"],
            position: images.length + uploaded.length,
            width,
            height,
          });
        }

        onChange([...images, ...uploaded]);
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "No se pudo subir la imagen.",
        );
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [folder, images, onChange],
  );

  const { itemRef, dragState } = useDragReorder(images.length, (f, t) =>
    reorder(f, t),
  );

  const reorder = (from: number, to: number) => {
    const next = [...images];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    onChange(next.map((image, position) => ({ ...image, position })));
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    reorder(index, target);
  };

  const remove = async (index: number) => {
    const image = images[index];
    if (!image) return;

    // Se borra tambien del bucket para no dejar archivos huerfanos ocupando
    // cuota. Si falla, la imagen desaparece igualmente de la galeria: dejarla
    // en el formulario por un error de almacenamiento seria peor.
    try {
      const supabase = createClient();
      await supabase.storage.from(STORAGE_BUCKET).remove([image.id]);
    } catch {
      // Silencioso a proposito: el archivo puede no existir ya.
    }

    onChange(
      images
        .filter((_, position) => position !== index)
        .map((item, position) => ({ ...item, position })),
    );
  };

  const setAlt = (index: number, locale: string, text: string) => {
    onChange(
      images.map((image, position) =>
        position === index
          ? { ...image, alt: { ...image.alt, [locale]: text } }
          : image,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex h-10 items-center rounded-[3px] border border-line-strong px-4 font-sans text-sm text-fg transition-colors hover:bg-fg hover:text-bg disabled:opacity-60"
        >
          {busy ? "Subiendo…" : "Añadir imágenes"}
        </button>
        <span className="font-sans text-xs text-fg-subtle">
          JPG, PNG, WebP o AVIF · hasta{" "}
          {(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} MB por archivo
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        onChange={(event) => {
          if (event.target.files?.length) void upload(event.target.files);
        }}
      />

      {error ? (
        <p role="alert" className="font-sans text-sm text-accent">
          {error}
        </p>
      ) : null}

      {images.length === 0 ? (
        <p className="rounded-[3px] border border-dashed border-line px-4 py-8 text-center font-sans text-sm text-fg-subtle">
          Todavía no hay imágenes.
          {firstIsCover ? " La primera que subas será la portada." : ""}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              ref={itemRef(index)}
              data-arrastrando={dragState(index).dragging || undefined}
              data-borde={dragState(index).edge ?? undefined}
              className="reordenable flex cursor-grab flex-col gap-3 rounded-[3px] border border-line bg-surface p-3 active:cursor-grabbing sm:flex-row"
            >
              <div className="relative h-28 w-full shrink-0 overflow-hidden bg-bg-alt sm:w-40">
                {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local del panel, no forma parte del sitio publico */}
                <img
                  src={image.url}
                  alt=""
                  className="size-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                {firstIsCover && index === 0 ? (
                  <span className="absolute top-1.5 left-1.5 bg-fg px-2 py-0.5 font-sans text-[0.625rem] tracking-[0.1em] text-bg uppercase">
                    Portada
                  </span>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="grid gap-2 sm:grid-cols-2">
                  {LOCALES.map((locale) => (
                    <label key={locale} className="flex flex-col gap-1">
                      <span className="font-sans text-[0.6875rem] tracking-[0.1em] text-fg-subtle uppercase">
                        Texto alternativo ({locale})
                      </span>
                      <input
                        type="text"
                        value={image.alt[locale] ?? ""}
                        onChange={(event) =>
                          setAlt(index, locale, event.target.value)
                        }
                        placeholder="Describe qué se ve en la imagen"
                        className="w-full rounded-[3px] border border-line bg-bg px-2.5 py-1.5 font-sans text-sm text-fg focus:border-accent focus:outline-none"
                      />
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <IconAction
                    label="Subir"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </IconAction>
                  <IconAction
                    label="Bajar"
                    disabled={index === images.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </IconAction>
                  {firstIsCover && index > 0 ? (
                    <button
                      type="button"
                      onClick={() => move(index, -index)}
                      className="rounded-[3px] border border-line px-2.5 py-1 font-sans text-xs text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
                    >
                      Hacer portada
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void remove(index)}
                    className="ml-auto rounded-[3px] px-2.5 py-1 font-sans text-xs text-fg-subtle transition-colors hover:text-accent"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconAction({
  label,
  children,
  onClick,
  disabled,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-[3px] border border-line font-sans text-sm text-fg-muted transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:border-line-strong hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
