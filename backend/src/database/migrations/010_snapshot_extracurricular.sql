CREATE FUNCTION add_extracurricular_to_report_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE report_row reports%ROWTYPE;
BEGIN
  SELECT * INTO report_row FROM reports WHERE id=NEW.report_id;
  NEW.snapshot = NEW.snapshot || jsonb_build_object('extracurricular', COALESCE((SELECT jsonb_agg(jsonb_build_object('activity_name',e.activity_name,'grade',e.grade) ORDER BY e.activity_name) FROM extracurricular_records e WHERE e.student_id=report_row.student_id AND e.semester_id=report_row.semester_id),'[]'::jsonb));
  RETURN NEW;
END;
$$;

CREATE TRIGGER report_versions_snapshot_extracurricular BEFORE INSERT ON report_versions FOR EACH ROW EXECUTE FUNCTION add_extracurricular_to_report_snapshot();
