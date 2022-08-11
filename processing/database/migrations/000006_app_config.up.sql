CREATE TABLE app_config
(
    id                 BOOLEAN    PRIMARY KEY DEFAULT TRUE,
    kaspad_version     TEXT       NOT NULL,
    processing_version TEXT       NOT NULL,
    CONSTRAINT unique_row CHECK (id)
);