import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EmpleadosPanel } from "@/components/admin/empleados-panel";
import { EntregasPanel } from "@/components/admin/entregas-panel";
import { HistorialPanel } from "@/components/admin/historial-panel";
import { PanelCargando, PanelShell, Pestanas } from "@/components/admin/panel-shell";
import { VehiculosPanel } from "@/components/admin/vehiculos-panel";
import { useCuenta } from "@/lib/cuenta";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel de administración | Stark Automotores" },
      { name: "description", content: "Administración de empleados, catálogo, entregas e historial de Stark Automotores." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Panel de administración | Stark Automotores" },
      { property: "og:description", content: "Administración de empleados, catálogo e historial." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PanelAdministracion,
});

type Pestana = "vehiculos" | "entregas" | "empleados" | "historial";

function PanelAdministracion() {
  const navigate = useNavigate();
  const { cuenta, cargando } = useCuenta();
  const [pestana, setPestana] = useState<Pestana>("vehiculos");

  useEffect(() => {
    if (!cargando && cuenta && cuenta.rol !== "admin") {
      void navigate({ to: "/panel", replace: true });
    }
  }, [cargando, cuenta, navigate]);

  if (cargando || !cuenta) return <PanelCargando />;
  if (cuenta.rol !== "admin") return <PanelCargando mensaje="Redirigiendo al panel operativo…" />;

  return (
    <PanelShell
      cuenta={cuenta}
      actual="admin"
      titulo="Panel de administración"
      bajada="Control total del negocio: equipo, catálogo, entregas y auditoría de cambios."
    >
      <Pestanas
        valor={pestana}
        onCambio={setPestana}
        opciones={[
          ["vehiculos", "Vehículos"],
          ["entregas", "Entregas"],
          ["empleados", "Empleados"],
          ["historial", "Historial"],
        ]}
      />
      <div className="mt-8">
        {pestana === "vehiculos" && <VehiculosPanel puedeEliminar />}
        {pestana === "entregas" && <EntregasPanel userId={cuenta.id} />}
        {pestana === "empleados" && <EmpleadosPanel miId={cuenta.id} />}
        {pestana === "historial" && <HistorialPanel />}
      </div>
    </PanelShell>
  );
}