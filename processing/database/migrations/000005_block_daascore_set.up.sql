ALTER TABLE blocks
  ADD COLUMN daa_score BIGINT NULL;
UPDATE blocks SET daa_score = 0;
ALTER TABLE blocks ALTER
  COLUMN daa_score SET NOT NULL;
