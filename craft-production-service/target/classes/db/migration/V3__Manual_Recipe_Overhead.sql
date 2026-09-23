ALTER TABLE recipes ADD COLUMN additional_overhead_per_batch NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (additional_overhead_per_batch >= 0);
