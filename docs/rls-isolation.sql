-- Repeatable isolation check. Runs inside one DO block and always raises at the end,
-- so every temporary user/row is rolled back. Expected: every check says "blocked".
do $$
declare a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); r uuid := gen_random_uuid();
ia uuid; ib uuid; ca uuid; n int; out text := '';
begin
  insert into auth.users(id, email, instance_id, aud, role) values
   (a,'a@t.test','00000000-0000-0000-0000-000000000000','authenticated','authenticated'),
   (b,'b@t.test','00000000-0000-0000-0000-000000000000','authenticated','authenticated'),
   (r,'r@t.test','00000000-0000-0000-0000-000000000000','authenticated','authenticated');
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub',a,'role','authenticated')::text, true);
  ia := public.create_institution('Inst A','',''); perform public.add_member_by_email(ia,'r@t.test','reviewer');
  insert into public.campaigns(institution_id, title_es, status) values (ia,'Hola','revision') returning id into ca;
  perform set_config('request.jwt.claims', json_build_object('sub',b,'role','authenticated')::text, true);
  ib := public.create_institution('Inst B','','');
  select count(*) into n from public.campaigns; out := out || 'B sees campaigns=' || n;
  begin perform public.add_member_by_email(ia,'b@t.test','admin'); out := out || ' | B self-add A=ALLOWED(BAD)';
  exception when others then out := out || ' | B self-add A=blocked'; end;
  begin perform public.decide_review(ca,'aprobar','es',''); out := out || ' | B review A=ALLOWED(BAD)';
  exception when others then out := out || ' | B review A=blocked'; end;
  begin insert into public.memberships values (ia,b,'admin'); out := out || ' | B insert membership=ALLOWED(BAD)';
  exception when others then out := out || ' | B insert membership=blocked'; end;
  perform set_config('request.jwt.claims', json_build_object('sub',r,'role','authenticated')::text, true);
  begin out := out || ' | deny without reason=' || public.decide_review(ca,'denegar','es','');
  exception when others then out := out || ' | deny without reason=blocked'; end;
  out := out || ' | reviewer decides=' || public.decide_review(ca,'aprobar','es','');
  update public.campaigns set status='borrador' where id=ca; get diagnostics n = row_count; out := out || ' | reviewer edit rows=' || n;
  raise exception 'RESULT: %', out;
end $$;
