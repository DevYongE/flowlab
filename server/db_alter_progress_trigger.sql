-- This script creates a trigger to automatically update project progress
-- whenever a dev_note is inserted, updated, or deleted.

-- Step 1: Create the function that will be executed by the trigger.
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
DECLARE
    v_project_id INT;
BEGIN
    -- Determine the project_id from the changed row.
    IF (TG_OP = 'DELETE') THEN
        v_project_id := OLD.project_id;
    ELSE
        v_project_id := NEW.project_id;
    END IF;

    -- Recalculate the average progress for the project and update the projects table.
    UPDATE projects
    SET progress = (
        SELECT COALESCE(ROUND(AVG(progress)), 0)
        FROM dev_notes
        WHERE project_id = v_project_id
    )
    WHERE id = v_project_id;

    -- Return the appropriate value based on the operation.
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create the trigger that calls the function.
-- Drop the trigger if it already exists to allow for re-running the script.
DROP TRIGGER IF EXISTS dev_notes_progress_trigger ON dev_notes;

CREATE TRIGGER dev_notes_progress_trigger
AFTER INSERT OR UPDATE OF progress OR DELETE ON dev_notes
FOR EACH ROW
EXECUTE FUNCTION update_project_progress();

-- Step 3 (Optional but Recommended): Initialize progress for all existing projects.
-- Run this to ensure all current projects have the correct progress value.
UPDATE projects p
SET progress = (
    SELECT COALESCE(ROUND(AVG(dn.progress)), 0)
    FROM dev_notes dn
    WHERE dn.project_id = p.id
); 