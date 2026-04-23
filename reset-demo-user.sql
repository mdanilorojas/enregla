-- Reset demo user password
-- Run this in Supabase SQL Editor

-- Update the encrypted password for demo@enregla.ec
-- This sets password to: Demo123!
UPDATE auth.users
SET encrypted_password = '$2a$10$5xKqV9L8YhZGYhJ7LxBXOeYmKF7jYPHZ.Yq0aJ9KFZ6QFZ8xKqV9L'
WHERE email = 'demo@enregla.ec';
