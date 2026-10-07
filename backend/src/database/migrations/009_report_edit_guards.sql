CREATE FUNCTION prevent_published_student_data_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM reports WHERE student_id=NEW.student_id AND semester_id=NEW.semester_id AND status='PUBLISHED') THEN
    RAISE EXCEPTION 'Published report data cannot be changed until a correction draft is started';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER student_assessments_published_guard BEFORE INSERT OR UPDATE ON student_assessments FOR EACH ROW EXECUTE FUNCTION prevent_published_student_data_mutation();
CREATE TRIGGER growth_records_published_guard BEFORE INSERT OR UPDATE ON growth_records FOR EACH ROW EXECUTE FUNCTION prevent_published_student_data_mutation();
CREATE TRIGGER attendance_summaries_published_guard BEFORE INSERT OR UPDATE ON attendance_summaries FOR EACH ROW EXECUTE FUNCTION prevent_published_student_data_mutation();
CREATE TRIGGER extracurricular_records_published_guard BEFORE INSERT OR UPDATE ON extracurricular_records FOR EACH ROW EXECUTE FUNCTION prevent_published_student_data_mutation();

CREATE FUNCTION prevent_published_narrative_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM reports WHERE id=NEW.report_id AND status='PUBLISHED') THEN
    RAISE EXCEPTION 'Published report narratives cannot be changed until a correction draft is started';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER report_narratives_published_guard BEFORE INSERT OR UPDATE ON report_narratives FOR EACH ROW EXECUTE FUNCTION prevent_published_narrative_mutation();
