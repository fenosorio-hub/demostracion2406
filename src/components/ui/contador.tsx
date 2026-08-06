import { useEffect, useRef, useState } from "react";

/** Contador animado con easing suave; se re-anima cuando cambia el valor. */
export function Contador({
  valor,
  formato = (n: number) => n.toLocaleString("es-AR"),
  duracion = 700,
}: {
  valor: number;
  formato?: (n: number) => string;
  duracion?: number;
}) {
  const [mostrado, setMostrado] = useState(valor);
  const desde = useRef(valor);

  useEffect(() => {
    const inicio = performance.now();
    const origen = desde.current;
    const delta = valor - origen;
    if (delta === 0) return;
    let raf = 0;
    const paso = (t: number) => {
      const p = Math.min(1, (t - inicio) / duracion);
      const eased = 1 - Math.pow(1 - p, 3);
      setMostrado(origen + delta * eased);
      if (p < 1) raf = requestAnimationFrame(paso);
      else desde.current = valor;
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor, duracion]);

  return <span>{formato(Math.round(mostrado))}</span>;
}