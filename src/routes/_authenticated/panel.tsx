import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { EntregasPanel } from "@/components/admin/entregas-panel";
import { PanelCargando, PanelShell, Pestanas } from "@/components/admin/panel-shell";
import { VehiculosPanel } from "@/components/admin/vehiculos-panel";
import { useCuenta } from "@/lib/cuenta";

export const Route = createFileRoute("/_authenticated/panel")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel operativo | Stark Automotores" },
      { name: "description", content: "Gestión diaria de vehículos y entregas del equipo de Stark Automotores." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Panel operativo | Stark Automotores" },
      { property: "og:description", content: "Gestión diaria de vehículos y entregas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PanelOperativo,
});

type Pestana = "vehiculos" | "entregas";

function PanelOperativo() {
  const { cuenta, cargando } = useCuenta();
  const [pestana, setPestana] = useState<Pestana>("vehiculos");

  if (cargando || !cuenta) return <PanelCargando />;

  return (
    <PanelShell
      cuenta={cuenta}
      actual="panel"
      titulo="Panel operativo"
      bajada="Actualizá el catálogo y registrá las entregas realizadas. Los cambios se sincronizan en tiempo real con el equipo."
    >
      <Pestanas
        valor={pestana}
        onCambio={setPestana}
        opciones={[
          ["vehiculos", "Vehículos"],
          ["entregas", "Entregas"],
        ]}
      />
      <div className="mt-8">
        {pestana === "vehiculos" ? (
          <VehiculosPanel puedeEliminar={cuenta.rol === "admin"} />
        ) : (
          <EntregasPanel userId={cuenta.id} />
        )}
      </div>
    </PanelShell>
  );
}