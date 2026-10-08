import { DEFAULT_TK_TEMPLATE_NAME } from "./default-tk-template";
import { defaultTkNarrativeMetadata } from "./default-tk-narrative-metadata";
import { DEFAULT_TK_NARRATIVE_METADATA_VERSION } from "./default-tk-narrative-metadata";

type Queryable = { query: (text: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }> };

/**
 * Maps the system-owned TK template to curated narrative metadata. This is
 * intentionally keyed by template structure during seed/bootstrap only, never
 * inferred from free-text indicators at narrative-generation time.
 */
export async function seedDefaultTkNarrativeMetadata(client: Queryable, schoolId: string) {
  const indicators = await client.query(
    `SELECT i.id, i.description, area.position AS area_position,
      sub_area.position AS sub_area_position, i.position AS indicator_position
     FROM indicators i
     JOIN sub_areas sub_area ON sub_area.id=i.sub_area_id
     JOIN development_areas area ON area.id=sub_area.development_area_id
     JOIN assessment_frameworks framework ON framework.id=area.framework_id
     WHERE framework.school_id=$1 AND framework.name=$2 AND framework.is_active=true
     ORDER BY area.position, sub_area.position, i.position`,
    [schoolId, DEFAULT_TK_TEMPLATE_NAME],
  );

  for (const indicator of indicators.rows) {
    const metadata = defaultTkNarrativeMetadata({
      areaPosition: Number(indicator.area_position),
      subAreaPosition: Number(indicator.sub_area_position),
      indicatorPosition: Number(indicator.indicator_position),
      description: String(indicator.description),
    });
    await client.query(
      `INSERT INTO indicator_narrative_metadata(
        school_id, indicator_id, semantic_group, competency_concept, narrative_label,
        observation_type, recommendation_tags, metadata_version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT(indicator_id) DO UPDATE SET
        semantic_group=EXCLUDED.semantic_group,
        competency_concept=EXCLUDED.competency_concept,
        narrative_label=EXCLUDED.narrative_label,
        observation_type=EXCLUDED.observation_type,
        recommendation_tags=EXCLUDED.recommendation_tags,
        metadata_version=EXCLUDED.metadata_version,
        updated_at=now()`,
      [schoolId, indicator.id, metadata.semanticGroup, metadata.competencyConcept, metadata.narrativeLabel, metadata.observationType, metadata.recommendationTags, DEFAULT_TK_NARRATIVE_METADATA_VERSION],
    );
  }

  return { mapped: indicators.rows.length };
}
