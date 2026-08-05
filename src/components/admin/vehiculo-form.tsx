import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ImagenesUploader } from "@/components/admin/imagenes-uploader";
import {
  actualizarVehiculo,
  crearVehiculo,
  slugify,
  type Vehiculo,
  type VehiculoInput,
} from "@/lib/vehiculos";

const COMBUSTIBLES = ["Nafta", "Diésel", "Híbrido", "Eléctrico", "GNC"];
const CAJAS = ["Manual", "Automática", "Automática 8v", "DSG 7v", "CVT"];
const ESTADOS = ["0 km", "Usado", "Certificado"];
const TIPOS = ["SUV", "Sedán", "Hatchback", "Coupé", "Pickup", "Eléctrico", "Familiar"];
const TRACCIONES = ["Delantera", "Trasera", "Integral", "4x4"];

type Estado = {
  marca: string;
  modelo: string;
  version: string;
  anio: string;
  precio: string;
  precio_contado: string;
  precio_financiado: string;
  km: string;
  combustible: string;
  caja: string;
  traccion: string;
  tipo: string;
  color: string;
  potencia_hp: string;
  torque_nm: string;
  consumo: string;
  cilindrada: string;
  tipo_motor: string;
  estado: string;
  garantia: string;
  ubicacion: string;
  descripcion: string;
  equipamiento: string;
  video_url: string;
  fecha_publicacion: string;
  publicado: boolean;
  destacado: boolean;
  vendido: boolean;
};

const texto = (v: unknown) => (v == null ? "" : String(v));

function inicial(v?: Vehiculo): Estado {
  return {
    marca: texto(v?.marca),
    modelo: texto(v?.modelo),
    version: texto(v?.version),
    anio: texto(v?.anio ?? new Date().getFullYear()),
    precio: texto(v?.precio),
    precio_contado: texto(v?.precio_contado),
    precio_financiado: texto(v?.precio_financiado),
    km: texto(v?.km ?? 0),
    combustible: v?.combustible ?? COMBUSTIBLES[0]!,
    caja: v?.caja ?? CAJAS[0]!,
    traccion: v?.traccion ?? TRACCIONES[0]!,
    tipo: v?.tipo ?? TIPOS[0]!,
    color: texto(v?.color),
    potencia_hp: texto(v?.potencia_hp),
    torque_nm: texto(v?.torque_nm),
    consumo: texto(v?.consumo),
    cilindrada: texto(v?.cilindrada),
    tipo_motor: texto(v?.tipo_motor),
    estado: v?.estado ?? ESTADOS[1]!,
    garantia: texto(v?.garantia),
    ubicacion: v?.ubicacion ?? "Casa Central — Palermo",
    descripcion: texto(v?.descripcion),
    equipamiento: (v?.equipamiento ?? []).join("\n"),
    video_url: texto(v?.video_url),
    fecha_publicacion: (v?.fecha_publicacion ?? new Date().toISOString()).slice(0, 10),
    publicado: v?.publicado ?? true,
    destacado: v?.destacado ?? false,
    vendido: v?.vendido ?? false,
  };
}

const num = (s: string) => (s.trim() === "" ? null : Number(s));
const str = (s: string) => (s.trim() === "" ? null : s.trim());

const inputCls =
  "w-full rounded-xl border bg-surface-2 px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-primary";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
      {label}
      {children}
    </label>
  );
}

export function VehiculoForm({
  vehiculo,
  onClose,
}: {
  vehiculo?: Vehiculo;
  onClose: () => void;
}) {
  const [f, setF] = useState<Estado>(() => inicial(vehiculo));
  const [galeria, setGaleria] = useState<string[]>(
    vehiculo?.galeria?.length ? vehiculo.galeria : vehiculo?.imagen_url ? [vehiculo.imagen_url] : [],
  );
  const qc = useQueryClient();
  const set = <K extends keyof Estado>(k: K, v: Estado[K]) => setF((p) => ({ ...p, [k]: v }));

  const guardar = useMutation({
    mutationFn: async () => {
      const payload: VehiculoInput = {
        marca: f.marca.trim(),
        modelo: f.modelo.trim(),
        version: str(f.version),
        anio: Number(f.anio),
        precio: Number(f.precio),
        precio_contado: num(f.precio_contado),
        precio_financiado: num(f.precio_financiado),
        km: Number(f.km || 0),
        combustible: f.combustible,
        caja: f.caja,
        traccion: f.traccion,
        tipo: f.tipo,
        color: str(f.color),
        potencia_hp: num(f.potencia_hp),
        torque_nm: num(f.torque_nm),
        consumo: str(f.consumo),
        cilindrada: str(f.cilindrada),
        tipo_motor: str(f.tipo_motor),
        estado: f.estado,
        garantia: str(f.garantia),
        ubicacion: f.ubicacion,
        descripcion: str(f.descripcion),
        video_url: str(f.video_url),
        equipamiento: f.equipamiento
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean),
        galeria,
        imagen_url: galeria[0] ?? null,
        publicado: f.publicado,
        destacado: f.destacado,
        vendido: f.vendido,
        fecha_publicacion: new Date(`${f.fecha_publicacion}T12:00:00Z`).toISOString(),
        slug:
          vehiculo?.slug ??
          slugify(`${f.marca} ${f.modelo} ${f.version} ${f.anio}`) + `-${Date.now().toString(36)}`,
      };

      const nombre = `${f.marca} ${f.modelo}${f.version ? ` ${f.version}` : ""}`.trim();
      if (vehiculo) {
        await actualizarVehiculo(vehiculo.id, payload);
        await registrarActividad("Editó un vehículo", nombre);
      } else {
        await crearVehiculo(payload);
        await registrarActividad("Creó un vehículo", nombre);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["vehiculos-admin"] });
      await qc.invalidateQueries({ queryKey: ["vehiculos"] });
      toast.success(vehiculo ? "Vehículo actualizado" : "Vehículo creado");
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "No se pudo guardar"),
  });

  const invalido = !f.marca.trim() || !f.modelo.trim() || !f.precio.trim() || !f.anio.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        guardar.mutate();
      }}
      className="space-y-8"
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Campo label="Marca *">
          <input className={inputCls} value={f.marca} onChange={(e) => set("marca", e.target.value)} required />
        </Campo>
        <Campo label="Modelo *">
          <input className={inputCls} value={f.modelo} onChange={(e) => set("modelo", e.target.value)} required />
        </Campo>
        <Campo label="Versión">
          <input className={inputCls} value={f.version} onChange={(e) => set("version", e.target.value)} />
        </Campo>
        <Campo label="Año *">
          <input type="number" className={inputCls} value={f.anio} onChange={(e) => set("anio", e.target.value)} required />
        </Campo>
        <Campo label="Precio (USD) *">
          <input type="number" className={inputCls} value={f.precio} onChange={(e) => set("precio", e.target.value)} required />
        </Campo>
        <Campo label="Kilómetros">
          <input type="number" className={inputCls} value={f.km} onChange={(e) => set("km", e.target.value)} />
        </Campo>
        <Campo label="Precio contado">
          <input type="number" className={inputCls} value={f.precio_contado} onChange={(e) => set("precio_contado", e.target.value)} />
        </Campo>
        <Campo label="Precio financiado">
          <input type="number" className={inputCls} value={f.precio_financiado} onChange={(e) => set("precio_financiado", e.target.value)} />
        </Campo>
        <Campo label="Color">
          <input className={inputCls} value={f.color} onChange={(e) => set("color", e.target.value)} />
        </Campo>
        <Campo label="Combustible">
          <select className={inputCls} value={f.combustible} onChange={(e) => set("combustible", e.target.value)}>
            {COMBUSTIBLES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Campo>
        <Campo label="Transmisión">
          <input className={inputCls} list="cajas" value={f.caja} onChange={(e) => set("caja", e.target.value)} />
        </Campo>
        <Campo label="Tracción">
          <select className={inputCls} value={f.traccion} onChange={(e) => set("traccion", e.target.value)}>
            {TRACCIONES.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Campo>
        <Campo label="Carrocería">
          <select className={inputCls} value={f.tipo} onChange={(e) => set("tipo", e.target.value)}>
            {TIPOS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Campo>
        <Campo label="Estado">
          <select className={inputCls} value={f.estado} onChange={(e) => set("estado", e.target.value)}>
            {ESTADOS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Campo>
        <Campo label="Potencia (CV)">
          <input type="number" className={inputCls} value={f.potencia_hp} onChange={(e) => set("potencia_hp", e.target.value)} />
        </Campo>
        <Campo label="Torque (Nm)">
          <input type="number" className={inputCls} value={f.torque_nm} onChange={(e) => set("torque_nm", e.target.value)} />
        </Campo>
        <Campo label="Consumo">
          <input className={inputCls} value={f.consumo} onChange={(e) => set("consumo", e.target.value)} />
        </Campo>
        <Campo label="Cilindrada">
          <input className={inputCls} value={f.cilindrada} onChange={(e) => set("cilindrada", e.target.value)} />
        </Campo>
        <Campo label="Tipo de motor">
          <input className={inputCls} value={f.tipo_motor} onChange={(e) => set("tipo_motor", e.target.value)} />
        </Campo>
        <Campo label="Garantía">
          <input className={inputCls} value={f.garantia} onChange={(e) => set("garantia", e.target.value)} />
        </Campo>
        <Campo label="Ubicación">
          <input className={inputCls} value={f.ubicacion} onChange={(e) => set("ubicacion", e.target.value)} />
        </Campo>
        <Campo label="Video (URL opcional)">
          <input className={inputCls} value={f.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://youtube.com/..." />
        </Campo>
        <Campo label="Fecha de publicación">
          <input type="date" className={inputCls} value={f.fecha_publicacion} onChange={(e) => set("fecha_publicacion", e.target.value)} />
        </Campo>
        <datalist id="cajas">
          {CAJAS.map((o) => <option key={o} value={o} />)}
        </datalist>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Campo label="Descripción">
          <textarea rows={6} className={inputCls} value={f.descripcion} onChange={(e) => set("descripcion", e.target.value)} />
        </Campo>
        <Campo label="Equipamiento (uno por línea)">
          <textarea rows={6} className={inputCls} value={f.equipamiento} onChange={(e) => set("equipamiento", e.target.value)} />
        </Campo>
      </section>

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Imágenes</p>
        <ImagenesUploader valor={galeria} onChange={setGaleria} />
      </section>

      <section className="flex flex-wrap gap-6">
        {([
          ["publicado", "Publicado"],
          ["destacado", "Destacado"],
          ["vendido", "Vendido"],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f[key]}
              onChange={(e) => set(key, e.target.checked)}
              className="size-4 accent-[oklch(0.78_0.13_85)]"
            />
            {label}
          </label>
        ))}
      </section>

      <div className="flex justify-end gap-3 border-t pt-5">
        <button type="button" onClick={onClose} className="rounded-full border px-5 py-2.5 text-sm">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={invalido || guardar.isPending}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {guardar.isPending ? "Guardando…" : vehiculo ? "Guardar cambios" : "Crear vehículo"}
        </button>
      </div>
    </form>
  );
}