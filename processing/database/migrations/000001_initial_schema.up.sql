CREATE TABLE blocks
(
    id         BIGSERIAL,
    block_hash CHAR(64)                   NOT NULL,
    timestamp  BIGINT                     NOT NULL,
    parent_ids VARCHAR                    NOT NULL,
    height     BIGINT CHECK (height >= 0) NOT NULL,
    PRIMARY KEY (id)
);
