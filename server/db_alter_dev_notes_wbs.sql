-- This script modifies the dev_notes table to support a hierarchical structure (WBS)
-- and drops the now-redundant wbs table.

-- Step 1: Drop the wbs table if it exists
DROP TABLE IF EXISTS wbs CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column_wbs();

-- Step 2: Add parent_id and order columns to dev_notes
ALTER TABLE dev_notes
ADD COLUMN parent_id INTEGER REFERENCES dev_notes(id) ON DELETE SET NULL,
ADD COLUMN "order" INTEGER DEFAULT 0;

-- Step 3: Add comments for the new columns
COMMENT ON COLUMN dev_notes.parent_id IS 'Parent task in the hierarchy (NULL for root tasks)';
COMMENT ON COLUMN dev_notes.order IS 'Sort order among sibling tasks';

-- Note: The dev_notes table should already have created_at and updated_at.
-- If not, you would add them here.

-- Make sure content is not null
ALTER TABLE dev_notes ALTER COLUMN content SET NOT NULL; 