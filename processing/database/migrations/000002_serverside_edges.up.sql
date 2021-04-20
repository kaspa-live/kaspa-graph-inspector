ALTER TABLE blocks
    ADD COLUMN height_group_index INT NOT NULL;

CREATE TABLE edges
(
    from_block_id           BIGINT NOT NULL,
    to_block_id             BIGINT NOT NULL,
    from_height             BIGINT NOT NULL,
    to_height               BIGINT NOT NULL,
    from_height_group_index INT    NOT NULL,
    to_height_group_index   INT    NOT NULL,
    PRIMARY KEY (from_block_id, to_block_id)
);

CREATE TABLE height_groups
(
    height BIGINT NOT NULL,
    size   INT    NOT NULL,
    PRIMARY KEY (height)
);
