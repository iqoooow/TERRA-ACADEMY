-- Ensure owner can INSERT into payments (explicit WITH CHECK for RLS)
-- Run in Supabase SQL Editor if "Saqlash" fails with RLS/permission errors

drop policy if exists "Admins can manage payments" on payments;
create policy "Admins can manage payments" on payments
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));
