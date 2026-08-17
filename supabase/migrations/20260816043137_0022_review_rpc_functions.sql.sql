/*
# Create RPC functions for extracted_blocks and review operations
*/

CREATE OR REPLACE FUNCTION public.update_extracted_block(
  p_block_id uuid,
  p_updates jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE extracted_blocks SET
    status = COALESCE(p_updates->>'status', status),
    edited_text = COALESCE(p_updates->>'edited_text', edited_text),
    type = COALESCE(p_updates->>'type', type),
    bounding_box_json = COALESCE((p_updates->>'bounding_box_json')::jsonb, bounding_box_json),
    asset_path = COALESCE(p_updates->>'asset_path', asset_path)
  WHERE id = p_block_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_extracted_block(uuid, jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_extracted_block(
  p_import_job_id uuid,
  p_page_number integer,
  p_type text,
  p_source_text text,
  p_edited_text text,
  p_bounding_box_json jsonb,
  p_confidence numeric,
  p_status text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO extracted_blocks (
    import_job_id, page_number, type, source_text, edited_text,
    bounding_box_json, confidence, status
  )
  VALUES (
    p_import_job_id, p_page_number, p_type, p_source_text, p_edited_text,
    p_bounding_box_json, p_confidence, p_status
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_extracted_block(uuid, integer, text, text, text, jsonb, numeric, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_extracted_blocks(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_agg(
    jsonb_build_object(
      'id', id,
      'import_job_id', import_job_id,
      'page_number', page_number,
      'type', type,
      'source_text', source_text,
      'edited_text', edited_text,
      'bounding_box_json', bounding_box_json,
      'confidence', confidence,
      'asset_path', asset_path,
      'status', status
    )
    ORDER BY page_number ASC, created_at ASC
  ) FROM extracted_blocks WHERE import_job_id = p_job_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_extracted_blocks(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.list_ai_suggestions(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_agg(
    jsonb_build_object(
      'id', id,
      'suggestion_json', suggestion_json,
      'status', status
    )
    ORDER BY created_at ASC
  ) FROM ai_suggestions WHERE import_job_id = p_job_id AND suggestion_type = 'article_grouping';
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_ai_suggestions(uuid) TO anon, authenticated;