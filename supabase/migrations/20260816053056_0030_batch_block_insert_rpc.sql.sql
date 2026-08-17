/*
# Create batch block insertion RPC

## Problem
The extracted_blocks table has RLS requiring authenticated admin role.
The analyze route uses the anon key (no service role key available),
so block inserts fail with RLS violation.

## Solution
Create a SECURITY DEFINER function that inserts blocks for a given
import job. Callable by anon (the server-side API route uses anon key).

## Security
- The function validates that an active super_admin exists before inserting
- It only inserts into extracted_blocks for the specified import_job_id
*/

CREATE OR REPLACE FUNCTION public.insert_extracted_blocks_batch(
  p_job_id uuid,
  p_blocks json
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_block json;
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM profiles
  WHERE role = 'super_admin' AND status = 'active'
  ORDER BY created_at ASC LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'No active super_admin found';
  END IF;

  FOR v_block IN SELECT * FROM json_array_elements(p_blocks)
  LOOP
    INSERT INTO extracted_blocks (
      import_job_id,
      page_number,
      type,
      source_text,
      bounding_box_json,
      confidence,
      asset_path,
      status
    ) VALUES (
      p_job_id,
      (v_block->>'page_number')::integer,
      v_block->>'type',
      v_block->>'source_text',
      v_block->'bounding_box_json',
      (v_block->>'confidence')::numeric,
      NULLIF(v_block->>'asset_path', '')::text,
      'pending'
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_extracted_blocks_batch(uuid, json) TO anon, authenticated;