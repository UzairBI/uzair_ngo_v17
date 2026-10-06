-- Contact messages (admin Dashboard -> Contact messages): lets an admin delete a message sent through a website form.
-- Until now admins could only read and update form_submissions. Run this in Supabase SQL Editor (safe to run more than once).

drop policy if exists "Admins can delete form_submissions" on form_submissions;
create policy "Admins can delete form_submissions"
  on form_submissions for delete
  using (is_admin());

grant delete on form_submissions to authenticated;
