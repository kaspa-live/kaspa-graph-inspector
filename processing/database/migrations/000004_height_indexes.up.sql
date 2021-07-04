CREATE INDEX blocks_height_idx ON blocks(height DESC);
CREATE INDEX edges_to_height_idx ON edges(to_height DESC);
CREATE INDEX edges_from_height_idx ON edges(from_height DESC);
