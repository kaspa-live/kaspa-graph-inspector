ALTER TABLE app_config
  ADD COLUMN network TEXT NULL;
UPDATE app_config SET network = '';
ALTER TABLE app_config ALTER
  COLUMN network SET NOT NULL;
