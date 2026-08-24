DROP POLICY IF EXISTS "accident media own update" ON storage.objects;
CREATE POLICY "accident media own update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'accident-media'
  AND (storage.foldername(name))[1] = (auth.uid())::text
)
WITH CHECK (
  bucket_id = 'accident-media'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);