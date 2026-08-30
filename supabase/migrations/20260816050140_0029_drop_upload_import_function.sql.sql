/*
# Drop unused upload_import_file RPC function

The upload is now handled by the upload-import Edge Function which
uses the service role key internally. The RPC function is no longer
needed.
*/

DROP FUNCTION IF EXISTS public.upload_import_file(text, text, text);