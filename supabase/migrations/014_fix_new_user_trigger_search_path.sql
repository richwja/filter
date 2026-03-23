-- Fix handle_new_user() trigger: add explicit search_path so it resolves
-- table names correctly when fired from the auth schema context.
-- Without this, new user signup fails with "Database error saving new user".
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, org_id)
  VALUES (
    NEW.id,
    NEW.email,
    (SELECT id FROM public.organizations WHERE slug = 'milltown' LIMIT 1)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
