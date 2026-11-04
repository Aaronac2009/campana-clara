
create policy "inst assets read" on storage.objects for select to authenticated
  using (bucket_id = 'institution-assets' and public.is_member(((storage.foldername(name))[1])::uuid, auth.uid()));
create policy "inst assets insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'institution-assets'
    and public.has_inst_role(((storage.foldername(name))[1])::uuid, auth.uid(), array['admin','editor']::public.app_role[])
    and lower(storage.extension(name)) in ('png','jpg','jpeg','webp','gif','mp4','webm'));
create policy "inst assets delete" on storage.objects for delete to authenticated
  using (bucket_id = 'institution-assets'
    and public.has_inst_role(((storage.foldername(name))[1])::uuid, auth.uid(), array['admin']::public.app_role[]));
create trigger audit_institutions after insert or update on public.institutions for each row execute function public.audit_row();
