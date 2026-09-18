-- Corrections schéma pour App.jsx (CSP Sagesse Divine)
-- À exécuter dans Supabase → SQL Editor

-- 1) Coordonnées parrain sur les élèves (persistées au sync)
ALTER TABLE eleves
  ADD COLUMN IF NOT EXISTS parrain_nom text,
  ADD COLUMN IF NOT EXISTS parrain_telephone text;

-- 2) Téléphone parrain sur les demandes d'inscription
ALTER TABLE demandes_inscription
  ADD COLUMN IF NOT EXISTS parrain_telephone text;

-- 3) codes_acces.code doit pouvoir stocker le JSON des codes enseignants
-- (souvent déjà text ; sinon élargir)
ALTER TABLE codes_acces
  ALTER COLUMN code TYPE text USING code::text;

-- Vérification rapide (optionnel)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name IN ('eleves', 'demandes_inscription', 'codes_acces')
-- ORDER BY table_name, column_name;
