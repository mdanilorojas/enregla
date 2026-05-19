-- handle_new_user intentaba insertar role='member' pero el CHECK de profiles
-- solo acepta admin|operator|viewer. El fallo lo tragaba EXCEPTION WHEN OTHERS,
-- dejando al usuario autenticado sin profile y sin poder completar onboarding.
-- User nuevo = admin de su empresa (owner). Si luego quiere invitar colaboradores,
-- se podran asignar con rol operator/viewer.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'admin'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;
