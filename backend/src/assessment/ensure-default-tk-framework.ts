import {
  defaultTkTemplate,
  DEFAULT_TK_TEMPLATE_NAME,
} from "./default-tk-template";
import { seedDefaultTkNarrativeMetadata } from "./seed-default-tk-narrative-metadata";

type DatabaseClient = {
  query: (
    text: string,
    values?: unknown[],
  ) => Promise<{
    rows: Array<Record<string, unknown>>;
    rowCount?: number | null;
  }>;
};

/**
 * Menjamin setiap sekolah memiliki satu salinan framework penilaian PAUD
 * standar. Framework bukan konfigurasi yang dikelola pengguna pada MVP.
 */
export async function ensureDefaultTkFramework(
  client: DatabaseClient,
  schoolId: string,
) {
  await client.query("SELECT id FROM schools WHERE id=$1 FOR UPDATE", [
    schoolId,
  ]);

  const existing = await client.query(
    `SELECT id
		 FROM assessment_frameworks
		 WHERE school_id=$1 AND name=$2 AND is_active=true
		 LIMIT 1`,
    [schoolId, DEFAULT_TK_TEMPLATE_NAME],
  );

  if (existing.rowCount) {
    await seedDefaultTkNarrativeMetadata(client, schoolId);
    return String(existing.rows[0].id);
  }

  await client.query(
    `UPDATE assessment_frameworks
		 SET is_active=false
		 WHERE school_id=$1 AND name=$2`,
    [schoolId, DEFAULT_TK_TEMPLATE_NAME],
  );

  const scale = (
    await client.query(
      `INSERT INTO assessment_scales(school_id,name)
			 VALUES($1,$2)
			 RETURNING id`,
      [schoolId, "Skala Perkembangan TK"],
    )
  ).rows[0];

  for (const [position, code] of ["BB", "MB", "BSH", "BSB"].entries()) {
    await client.query(
      `INSERT INTO assessment_scale_options(
				school_id,scale_id,code,label,position
			)
			VALUES($1,$2,$3,$4,$5)`,
      [schoolId, scale.id, code, code, position + 1],
    );
  }

  const framework = (
    await client.query(
      `INSERT INTO assessment_frameworks(school_id,scale_id,name)
			 VALUES($1,$2,$3)
			 RETURNING id`,
      [schoolId, scale.id, DEFAULT_TK_TEMPLATE_NAME],
    )
  ).rows[0];

  for (const [areaPosition, area] of defaultTkTemplate.entries()) {
    const savedArea = (
      await client.query(
        `INSERT INTO development_areas(school_id,framework_id,name,position)
				 VALUES($1,$2,$3,$4)
				 RETURNING id`,
        [schoolId, framework.id, area.name, areaPosition + 1],
      )
    ).rows[0];

    for (const [subAreaPosition, subArea] of area.subAreas.entries()) {
      const savedSubArea = (
        await client.query(
          `INSERT INTO sub_areas(school_id,development_area_id,name,position)
					 VALUES($1,$2,$3,$4)
					 RETURNING id`,
          [schoolId, savedArea.id, subArea.name, subAreaPosition + 1],
        )
      ).rows[0];

      for (const [
        indicatorPosition,
        description,
      ] of subArea.indicators.entries()) {
        await client.query(
          `INSERT INTO indicators(school_id,sub_area_id,description,position)
					 VALUES($1,$2,$3,$4)`,
          [schoolId, savedSubArea.id, description, indicatorPosition + 1],
        );
      }
    }
  }

  await seedDefaultTkNarrativeMetadata(client, schoolId);
  return String(framework.id);
}
