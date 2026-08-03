CREATE TABLE public.vehiculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  version TEXT,
  anio INTEGER NOT NULL,
  km INTEGER NOT NULL DEFAULT 0,
  combustible TEXT NOT NULL,
  caja TEXT NOT NULL,
  traccion TEXT NOT NULL,
  potencia_hp INTEGER,
  torque_nm INTEGER,
  consumo TEXT,
  cilindrada TEXT,
  tipo_motor TEXT,
  estado TEXT NOT NULL DEFAULT 'Usado',
  garantia TEXT,
  precio NUMERIC NOT NULL,
  precio_contado NUMERIC,
  precio_financiado NUMERIC,
  ubicacion TEXT NOT NULL DEFAULT 'Casa Central',
  tipo TEXT NOT NULL,
  color TEXT,
  imagen_url TEXT,
  galeria TEXT[] NOT NULL DEFAULT '{}',
  equipamiento TEXT[] NOT NULL DEFAULT '{}',
  destacado BOOLEAN NOT NULL DEFAULT false,
  publicado BOOLEAN NOT NULL DEFAULT true,
  vistas INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vehiculos TO anon;
GRANT SELECT ON public.vehiculos TO authenticated;
GRANT ALL ON public.vehiculos TO service_role;

ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalogo publico visible" ON public.vehiculos FOR SELECT TO anon, authenticated USING (publicado = true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vehiculos_updated_at BEFORE UPDATE ON public.vehiculos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.vehiculos (slug, marca, modelo, version, anio, km, combustible, caja, traccion, potencia_hp, torque_nm, consumo, cilindrada, tipo_motor, estado, garantia, precio, precio_contado, precio_financiado, ubicacion, tipo, color, imagen_url, galeria, equipamiento, destacado) VALUES
('porsche-911-carrera-s-2023','Porsche','911','Carrera S',2023,8500,'Nafta','Automática PDK 8v','Trasera',450,530,'9,5 L/100km','3.0 L','Bóxer 6 cil. biturbo','Usado','12 meses oficial',189000,182000,196000,'Casa Central — Palermo','Coupé','Gris Ágata','/images/vehiculos/porsche-911.jpg','{"/images/vehiculos/porsche-911.jpg"}','{"Techo corrediço eléctrico","Sport Chrono","Butacas deportivas calefaccionadas","Bose Surround","Faros LED Matrix","Llantas 20/21\"","Cámara 360°","Apple CarPlay"}',true),
('bmw-x5-xdrive40i-2024','BMW','X5','xDrive40i M Sport',2024,12000,'Nafta','Automática 8v Steptronic','Integral xDrive',381,540,'8,9 L/100km','3.0 L','6 cil. en línea turbo','Usado','24 meses oficial',124500,119900,131000,'Sucursal Norte — Vicente López','SUV','Negro Zafiro','/images/vehiculos/bmw-x5.jpg','{"/images/vehiculos/bmw-x5.jpg"}','{"Head-up display","Suspensión neumática","Asientos de cuero Vernasca","Harman Kardon","Portón eléctrico","Asistente de conducción","Climatizador 4 zonas"}',true),
('mercedes-benz-clase-c-300-2023','Mercedes-Benz','Clase C','C 300 AMG Line',2023,19800,'Nafta','Automática 9G-Tronic','Trasera',258,400,'7,1 L/100km','2.0 L','4 cil. turbo mild-hybrid','Usado','12 meses',89900,86500,94500,'Casa Central — Palermo','Sedán','Blanco Polar','/images/vehiculos/mercedes-c.jpg','{"/images/vehiculos/mercedes-c.jpg"}','{"MBUX 11,9\"","Burmester 3D","Techo panorámico","Ambient light 64 colores","Asistente de estacionamiento","Llantas AMG 19\""}',false),
('audi-q7-55-tfsi-2022','Audi','Q7','55 TFSI quattro S line',2022,34500,'Nafta','Tiptronic 8v','Integral quattro',340,500,'9,8 L/100km','3.0 L','V6 turbo','Usado','12 meses',97500,93000,102500,'Sucursal Sur — Lomas','SUV','Gris Daytona','/images/vehiculos/audi-q7.jpg','{"/images/vehiculos/audi-q7.jpg"}','{"7 asientos","Virtual Cockpit","Matrix LED","Bang & Olufsen","Suspensión adaptativa","Tercera fila eléctrica"}',false),
('tesla-model-3-performance-2024','Tesla','Model 3','Performance Dual Motor',2024,4200,'Eléctrico','Automática 1v','Integral AWD',513,660,'15,2 kWh/100km','—','Doble motor eléctrico','0 km','36 meses batería',72900,69900,76500,'Casa Central — Palermo','Eléctrico','Rojo Multicapa','/images/vehiculos/tesla-model3.jpg','{"/images/vehiculos/tesla-model3.jpg"}','{"Autopilot","Techo de cristal","Audio premium 17 parlantes","Carga rápida Supercharger","Asientos ventilados","Actualizaciones OTA"}',true),
('toyota-hilux-srx-2023','Toyota','Hilux','SRX 4x4 AT',2023,28700,'Diésel','Automática 6v','4x4',204,500,'8,1 L/100km','2.8 L','4 cil. turbodiésel','Usado','24 meses oficial',58900,56500,61900,'Sucursal Norte — Vicente López','Pickup','Gris Oscuro','/images/vehiculos/toyota-hilux.jpg','{"/images/vehiculos/toyota-hilux.jpg"}','{"Control de descenso","Cámara multiterreno","Barra antivuelco","Cubre caja","Tapizado de cuero","Toyota Safety Sense"}',false),
('range-rover-velar-r-dynamic-2023','Land Rover','Range Rover Velar','P340 R-Dynamic SE',2023,16400,'Híbrido','Automática 8v','Integral',340,480,'8,4 L/100km','2.0 L','4 cil. turbo híbrido','Usado','12 meses',108000,104000,113500,'Casa Central — Palermo','SUV','Verde Británico','/images/vehiculos/velar.jpg','{"/images/vehiculos/velar.jpg"}','{"Meridian Surround","Pantallas duales táctiles","Techo panorámico fijo","Suspensión electrónica","Manijas retráctiles","Asientos masajeadores"}',false),
('volkswagen-golf-gti-2022','Volkswagen','Golf','GTI 2.0 TSI DSG',2022,41000,'Nafta','DSG 7v','Delantera',245,370,'7,3 L/100km','2.0 L','4 cil. turbo','Usado','6 meses',46500,44900,48900,'Sucursal Sur — Lomas','Hatchback','Azul Atlantic','/images/vehiculos/golf-gti.jpg','{"/images/vehiculos/golf-gti.jpg"}','{"Diferencial autoblocante VAQ","Butacas deportivas","Digital Cockpit Pro","Faros IQ.Light","Llantas 18\"","Escape deportivo"}',false);