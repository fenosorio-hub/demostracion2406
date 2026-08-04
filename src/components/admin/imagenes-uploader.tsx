import { useRef, useState } from "react";
import { GripVertical, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { borrarImagen, subirImagen, useImagenes } from "@/lib/storage";

export function ImagenesUploader({
  valor,
  onChange,
}: {
  valor: string[];
  onChange: (paths: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrado, setArrastrado] = useState<number | null>(null);
  const urls = useImagenes(valor);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setSubiendo(true);
    try {
      const paths = await Promise.all(Array.from(files).map(subirImagen));
      onChange([...valor, ...paths]);
      toast.success(`${paths.length} imagen(es) subida(s)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo subir la imagen");
    } finally {
      setSubiendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function quitar(index: number) {
    const path = valor[index]!;
    onChange(valor.filter((_, i) => i !== index));
    await borrarImagen(path);
  }

  function soltar(destino: number) {
    if (arrastrado === null || arrastrado === destino) return;
    const copia = [...valor];
    const [item] = copia.splice(arrastrado, 1);
    copia.splice(destino, 0, item!);
    onChange(copia);
    setArrastrado(null);
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void onFiles(e.dataTransfer.files);
        }}
        className="rounded-2xl border border-dashed bg-surface-2/50 p-6 text-center"
      >
        <UploadCloud className="mx-auto size-6 text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">
          Arrastrá imágenes acá o
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="ml-1 font-medium text-primary underline-offset-4 hover:underline"
          >
            elegí archivos
          </button>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {subiendo ? "Subiendo…" : "La primera imagen es la portada. Arrastrá para reordenar."}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => void onFiles(e.target.files)}
        />
      </div>

      {valor.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {valor.map((path, i) => (
            <li
              key={path}
              draggable
              onDragStart={() => setArrastrado(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => soltar(i)}
              className="group relative overflow-hidden rounded-xl border bg-surface-2"
            >
              <img
                src={urls[i] ?? ""}
                alt={`Imagen ${i + 1}`}
                className="aspect-[4/3] w-full object-cover"
              />
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[0.6rem] font-semibold text-primary-foreground">
                  Portada
                </span>
              )}
              <span className="absolute right-2 top-2 flex gap-1">
                <span className="cursor-grab rounded-md bg-background/80 p-1 backdrop-blur">
                  <GripVertical className="size-3.5" />
                </span>
                <button
                  type="button"
                  onClick={() => void quitar(i)}
                  aria-label="Eliminar imagen"
                  className="rounded-md bg-background/80 p-1 text-destructive backdrop-blur"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}