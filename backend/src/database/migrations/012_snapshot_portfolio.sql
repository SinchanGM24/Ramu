CREATE FUNCTION add_portfolio_to_report_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.snapshot = NEW.snapshot || jsonb_build_object('portfolio', COALESCE((SELECT jsonb_agg(jsonb_build_object('original_filename',p.original_filename,'content_type',p.content_type,'caption',p.caption) ORDER BY p.created_at) FROM portfolio_items p WHERE p.report_id=NEW.report_id AND p.included_in_report=true),'[]'::jsonb));
  RETURN NEW;
END;
$$;

CREATE TRIGGER report_versions_snapshot_portfolio BEFORE INSERT ON report_versions FOR EACH ROW EXECUTE FUNCTION add_portfolio_to_report_snapshot();
