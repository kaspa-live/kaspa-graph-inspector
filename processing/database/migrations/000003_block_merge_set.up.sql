ALTER TABLE blocks
    ADD COLUMN merge_set_red_ids JSONB NOT NULL,
    ADD COLUMN merge_set_blue_ids JSONB NOT NULL;
