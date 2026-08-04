CREATE POLICY "Imagenes de vehiculos visibles para todos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'vehiculos');

CREATE POLICY "Admins suben imagenes de vehiculos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehiculos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins actualizan imagenes de vehiculos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehiculos' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'vehiculos' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins eliminan imagenes de vehiculos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehiculos' AND public.has_role(auth.uid(), 'admin'));