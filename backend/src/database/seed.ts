import "dotenv/config";
import * as argon2 from "argon2";
import { createHash, randomUUID } from "crypto";
import { Pool, type PoolClient } from "pg";
import { ensureDefaultTkFramework } from "../assessment/ensure-default-tk-framework";
import { DEFAULT_TK_TEMPLATE_NAME } from "../assessment/default-tk-template";
import { assertSeedAllowed } from "./seed-guard";

const accounts = [
  ["Admin Sekolah", "admin@ramu.test", "081200000001", "SCHOOL_ADMIN"],
  ["Guru Aisyah", "guru.aisyah@ramu.test", "081200000002", "TEACHER"],
  ["Guru Budi", "guru.budi@ramu.test", "081200000003", "TEACHER"],
  ["Guru Citra", "guru.citra@ramu.test", "081200000004", "TEACHER"],
  ["Guru Dewi", "guru.dewi@ramu.test", "081200000005", "TEACHER"],
  ["Kepala Sekolah", "kepsek@ramu.test", "081200000006", "PRINCIPAL"],
] as const;

type ClassName = "Kelas Apel" | "Kelas Melati" | "Kelas Merpati";
type Gender = "MALE" | "FEMALE";
type ReportStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "IN_REVIEW"
  | "REVISION_REQUIRED"
  | "APPROVED"
  | "PUBLISHED";
type DemoStudent = {
  className: ClassName;
  gender: Gender;
  name: string;
  studentNumber: string;
};
type IdRow = { id: string };

const roster = (
  className: ClassName,
  startNumber: number,
  entries: Array<[string, Gender]>,
): DemoStudent[] =>
  entries.map(([name, gender], index) => ({
    className,
    gender,
    name,
    studentNumber: `TK-${String(startNumber + index).padStart(3, "0")}`,
  }));

// Seluruh nama merupakan data fiktif development untuk kebutuhan QA.
const students: DemoStudent[] = [
  {
    className: "Kelas Apel",
    gender: "FEMALE",
    name: "Alya Putri",
    studentNumber: "TK-001",
  },
  {
    className: "Kelas Apel",
    gender: "MALE",
    name: "Bima Saputra",
    studentNumber: "TK-002",
  },
  {
    className: "Kelas Melati",
    gender: "FEMALE",
    name: "Citra Lestari",
    studentNumber: "TK-003",
  },
  {
    className: "Kelas Merpati",
    gender: "MALE",
    name: "Dimas Pratama",
    studentNumber: "TK-004",
  },
  ...roster("Kelas Apel", 5, [
    ["Elisa Maharani", "FEMALE"],
    ["Farhan Akbar", "MALE"],
    ["Gita Anggraini", "FEMALE"],
    ["Hafiz Ramadhan", "MALE"],
    ["Intan Permata", "FEMALE"],
    ["Jihan Safitri", "FEMALE"],
    ["Khalid Fadillah", "MALE"],
    ["Laila Nuraini", "FEMALE"],
    ["Miko Prasetyo", "MALE"],
    ["Nadia Azzahra", "FEMALE"],
    ["Oki Setiawan", "MALE"],
    ["Putri Amelia", "FEMALE"],
    ["Qais Alfarizi", "MALE"],
    ["Rania Khairunnisa", "FEMALE"],
    ["Saka Wijaya", "MALE"],
    ["Tania Aprilia", "FEMALE"],
    ["Umar Hakim", "MALE"],
    ["Vina Oktaviani", "FEMALE"],
  ]),
  ...roster("Kelas Melati", 23, [
    ["Wahyu Nugroho", "MALE"],
    ["Xena Maharani", "FEMALE"],
    ["Yusuf Kurniawan", "MALE"],
    ["Zahra Nabila", "FEMALE"],
    ["Adit Pramudya", "MALE"],
    ["Bella Anindita", "FEMALE"],
    ["Cahya Mahendra", "MALE"],
    ["Dara Kirana", "FEMALE"],
    ["Ega Firmansyah", "MALE"],
    ["Fani Wulandari", "FEMALE"],
    ["Galang Prakoso", "MALE"],
    ["Hana Salsabila", "FEMALE"],
    ["Iqbal Maulana", "MALE"],
    ["Jasmine Aulia", "FEMALE"],
    ["Kamal Ardiansyah", "MALE"],
    ["Larasati Dewi", "FEMALE"],
    ["Madan Saputro", "MALE"],
    ["Nayla Kinasih", "FEMALE"],
    ["Omar Fikri", "MALE"],
  ]),
  ...roster("Kelas Merpati", 42, [
    ["Prita Lestari", "FEMALE"],
    ["Rafi Alamsyah", "MALE"],
    ["Salsa Meilani", "FEMALE"],
    ["Tegar Prabowo", "MALE"],
    ["Ulfa Rahmawati", "FEMALE"],
    ["Vito Pranata", "MALE"],
    ["Winda Kartika", "FEMALE"],
    ["Xavier Pratama", "MALE"],
    ["Yasmin Fauziah", "FEMALE"],
    ["Zidan Firmansyah", "MALE"],
    ["Anisa Fitria", "FEMALE"],
    ["Bagas Setyawan", "MALE"],
    ["Cantika Sari", "FEMALE"],
    ["Daffa Kurnia", "MALE"],
    ["Evelyn Putri", "FEMALE"],
    ["Faris Hakim", "MALE"],
    ["Ghina Ramadhani", "FEMALE"],
    ["Haikal Firdaus", "MALE"],
    ["Indah Puspita", "FEMALE"],
  ]),
];

const statusFor = (index: number): ReportStatus => {
  if (index < 10) return "PUBLISHED";
  if (index < 18) return "APPROVED";
  if (index < 26) return "IN_REVIEW";
  if (index < 36) return "SUBMITTED";
  if (index < 46) return "REVISION_REQUIRED";
  return "DRAFT";
};

const id = async (client: PoolClient, text: string, values: unknown[]) => {
  const result = await client.query<IdRow>(text, values);
  if (!result.rows[0])
    throw new Error("Data seed yang diperlukan tidak ditemukan.");
  return result.rows[0].id;
};

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

async function classPeriod(
  client: PoolClient,
  schoolId: string,
  classGroupId: string,
  academicYearId: string,
) {
  return id(
    client,
    `INSERT INTO class_periods(school_id,class_group_id,academic_year_id)
     VALUES($1,$2,$3)
     ON CONFLICT(class_group_id,academic_year_id)
     DO UPDATE SET class_group_id=EXCLUDED.class_group_id
     RETURNING id`,
    [schoolId, classGroupId, academicYearId],
  );
}

async function enrollment(
  client: PoolClient,
  input: {
    academicYearId: string;
    classPeriodId: string;
    end: string | null;
    schoolId: string;
    start: string;
    status: "ACTIVE" | "COMPLETED";
    studentId: string;
  },
) {
  const existing = await client.query<IdRow>(
    `SELECT id FROM student_enrollments
     WHERE school_id=$1 AND student_id=$2 AND academic_year_id=$3
       AND (effective_end_on IS NULL OR effective_end_on>$4::date)
     ORDER BY effective_start_on DESC LIMIT 1`,
    [input.schoolId, input.studentId, input.academicYearId, input.start],
  );
  if (existing.rows[0]) {
    await client.query(
      `UPDATE student_enrollments
       SET class_period_id=$2,status=$3,effective_start_on=$4,effective_end_on=$5,
           ended_at=CASE WHEN $5::date IS NULL THEN NULL ELSE now() END
       WHERE id=$1 AND school_id=$6`,
      [
        existing.rows[0].id,
        input.classPeriodId,
        input.status,
        input.start,
        input.end,
        input.schoolId,
      ],
    );
    return existing.rows[0].id;
  }
  return id(
    client,
    `INSERT INTO student_enrollments(
       school_id,student_id,academic_year_id,class_period_id,status,
       effective_start_on,effective_end_on,ended_at
     ) VALUES($1,$2,$3,$4,$5,$6,$7,CASE WHEN $7::date IS NULL THEN NULL ELSE now() END)
     RETURNING id`,
    [
      input.schoolId,
      input.studentId,
      input.academicYearId,
      input.classPeriodId,
      input.status,
      input.start,
      input.end,
    ],
  );
}

async function guardian(
  client: PoolClient,
  schoolId: string,
  studentId: string,
  studentName: string,
  index: number,
) {
  const phone = `0813${String(10000000 + index).slice(-8)}`;
  await client.query(
    `UPDATE guardian_contacts
     SET is_primary=false,is_delivery_recipient=false
     WHERE school_id=$1 AND student_id=$2 AND is_active
       AND (is_primary OR is_delivery_recipient)`,
    [schoolId, studentId],
  );
  const existing = await client.query<IdRow>(
    "SELECT id FROM guardian_contacts WHERE school_id=$1 AND student_id=$2 AND phone=$3 LIMIT 1",
    [schoolId, studentId, phone],
  );
  const name = `Wali ${studentName.split(" ")[0]}`;
  if (existing.rows[0]) {
    await client.query(
      `UPDATE guardian_contacts
       SET name=$2,relationship='Orang tua',occupation=$3,is_active=true,
           is_primary=true,is_delivery_recipient=true
       WHERE id=$1 AND school_id=$4`,
      [
        existing.rows[0].id,
        name,
        index % 4 === 0 ? null : "Pegawai swasta",
        schoolId,
      ],
    );
    return existing.rows[0].id;
  }
  return id(
    client,
    `INSERT INTO guardian_contacts(
       school_id,student_id,name,relationship,phone,occupation,is_active,
       is_primary,is_delivery_recipient
     ) VALUES($1,$2,$3,'Orang tua',$4,$5,true,true,true)
     RETURNING id`,
    [
      schoolId,
      studentId,
      name,
      phone,
      index % 4 === 0 ? null : "Pegawai swasta",
    ],
  );
}

async function seed() {
  assertSeedAllowed();
  const classCounts = students.reduce<Record<ClassName, number>>(
    (counts, student) => ({
      ...counts,
      [student.className]: counts[student.className] + 1,
    }),
    { "Kelas Apel": 0, "Kelas Melati": 0, "Kelas Merpati": 0 },
  );
  if (
    students.length !== 60 ||
    Object.values(classCounts).some((count) => count !== 20)
  ) {
    throw new Error(
      "Roster seed QA harus terdiri dari 3 kelas dengan 20 murid per kelas.",
    );
  }
  const connectionString =
    process.env.DATABASE_SEED_URL ||
    process.env.DATABASE_MIGRATION_URL ||
    process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_SEED_URL, DATABASE_MIGRATION_URL, atau DATABASE_URL harus diatur",
    );
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();
  const password = process.env.SEED_DEMO_PASSWORD || "pass1234";

  try {
    await client.query("BEGIN");
    const schoolLookup = await client.query<{ school_id: string }>(
      `SELECT membership.school_id
       FROM school_memberships membership
       JOIN users account ON account.id=membership.user_id
       WHERE account.email=lower($1) AND membership.role='SCHOOL_ADMIN'
       LIMIT 1`,
      [accounts[0][1]],
    );
    const schoolId = schoolLookup.rows[0]?.school_id || randomUUID();
    await client.query("SELECT set_config('app.school_id',$1,true)", [
      schoolId,
    ]);
    if (!schoolLookup.rowCount) {
      await client.query(
        `INSERT INTO schools(id,name,slug,address,phone)
         VALUES($1,$2,'tk-contoh-ceria','Jl. Pendidikan No. 1','021-555-0101')`,
        [schoolId, process.env.SEED_SCHOOL_NAME || "TK Contoh Ceria"],
      );
    }

    const userIds: Record<string, string> = {};
    const passwordHash = await argon2.hash(password);
    for (const [name, email, phone, role] of accounts) {
      const userId = await id(
        client,
        `INSERT INTO users(name,email,password_hash,phone)
         VALUES($1,lower($2),$3,$4)
         ON CONFLICT(email) DO UPDATE
         SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash,phone=EXCLUDED.phone
         RETURNING id`,
        [name, email, passwordHash, phone],
      );
      userIds[email] = userId;
      await client.query(
        `INSERT INTO school_memberships(user_id,school_id,role,is_active,deactivated_at)
         VALUES($1,$2,$3,true,NULL)
         ON CONFLICT(user_id,school_id) DO UPDATE
         SET role=EXCLUDED.role,is_active=true,deactivated_at=NULL`,
        [userId, schoolId, role],
      );
    }

    await ensureDefaultTkFramework(client, schoolId);
    await client.query(
      "UPDATE academic_years SET is_active=false WHERE school_id=$1",
      [schoolId],
    );
    const previousYearId = await id(
      client,
      `INSERT INTO academic_years(school_id,name,display_year,starts_on,ends_on,is_active)
       VALUES($1,'2025',2025,'2025-07-01','2026-06-30',false)
       ON CONFLICT(school_id,name) DO UPDATE
       SET display_year=EXCLUDED.display_year,starts_on=EXCLUDED.starts_on,
           ends_on=EXCLUDED.ends_on,is_active=false
       RETURNING id`,
      [schoolId],
    );
    const activeYearId = await id(
      client,
      `INSERT INTO academic_years(school_id,name,display_year,starts_on,ends_on,is_active)
       VALUES($1,'2026',2026,'2026-07-01','2027-06-30',true)
       ON CONFLICT(school_id,name) DO UPDATE
       SET display_year=EXCLUDED.display_year,starts_on=EXCLUDED.starts_on,
           ends_on=EXCLUDED.ends_on,is_active=true
       RETURNING id`,
      [schoolId],
    );
    for (const [yearId, firstStart, firstEnd, secondStart, secondEnd] of [
      [previousYearId, "2025-07-01", "2025-12-31", "2026-01-01", "2026-06-30"],
      [activeYearId, "2026-07-01", "2026-12-31", "2027-01-01", "2027-06-30"],
    ] as const) {
      await client.query(
        `INSERT INTO semesters(school_id,academic_year_id,name,starts_on,ends_on)
         VALUES($1,$2,'Semester I',$3,$4),($1,$2,'Semester II',$5,$6)
         ON CONFLICT(school_id,academic_year_id,name) DO UPDATE
         SET starts_on=EXCLUDED.starts_on,ends_on=EXCLUDED.ends_on`,
        [schoolId, yearId, firstStart, firstEnd, secondStart, secondEnd],
      );
    }
    await client.query(
      "UPDATE semesters SET is_active=false WHERE school_id=$1",
      [schoolId],
    );
    const activeSemesterId = await id(
      client,
      "SELECT id FROM semesters WHERE school_id=$1 AND academic_year_id=$2 AND name='Semester I'",
      [schoolId, activeYearId],
    );
    await client.query(
      "UPDATE semesters SET is_active=true WHERE id=$1 AND school_id=$2",
      [activeSemesterId, schoolId],
    );

    const groupIds = {} as Record<ClassName, string>;
    const activePeriods = {} as Record<ClassName, string>;
    const previousPeriods = {} as Record<ClassName, string>;
    for (const name of [
      "Kelas Apel",
      "Kelas Melati",
      "Kelas Merpati",
    ] as ClassName[]) {
      groupIds[name] = await id(
        client,
        `INSERT INTO class_groups(school_id,name,is_active) VALUES($1,$2,true)
         ON CONFLICT(school_id,name) DO UPDATE SET is_active=true RETURNING id`,
        [schoolId, name],
      );
      activePeriods[name] = await classPeriod(
        client,
        schoolId,
        groupIds[name],
        activeYearId,
      );
      previousPeriods[name] = await classPeriod(
        client,
        schoolId,
        groupIds[name],
        previousYearId,
      );
    }

    const classTeachers: Record<ClassName, string[]> = {
      "Kelas Apel": ["guru.aisyah@ramu.test", "guru.budi@ramu.test"],
      "Kelas Melati": ["guru.aisyah@ramu.test", "guru.citra@ramu.test"],
      "Kelas Merpati": ["guru.budi@ramu.test", "guru.citra@ramu.test"],
    };
    for (const [className, teacherEmails] of Object.entries(
      classTeachers,
    ) as Array<[ClassName, string[]]>) {
      for (const email of teacherEmails) {
        await client.query(
          `INSERT INTO teacher_class_assignments(school_id,class_period_id,teacher_user_id)
           VALUES($1,$2,$3)
           ON CONFLICT(class_period_id,teacher_user_id) WHERE ended_at IS NULL
           DO UPDATE SET ended_at=NULL`,
          [schoolId, activePeriods[className], userIds[email]],
        );
      }
    }

    const areas = await client.query<{ id: string; name: string }>(
      `SELECT area.id,area.name FROM development_areas area
       JOIN assessment_frameworks framework ON framework.id=area.framework_id
       WHERE area.school_id=$1 AND framework.name=$2 AND framework.is_active
       ORDER BY area.position`,
      [schoolId, DEFAULT_TK_TEMPLATE_NAME],
    );
    const indicators = await client.query<IdRow>(
      `SELECT indicator.id FROM indicators indicator
       JOIN sub_areas sub_area ON sub_area.id=indicator.sub_area_id
       JOIN development_areas area ON area.id=sub_area.development_area_id
       JOIN assessment_frameworks framework ON framework.id=area.framework_id
       WHERE indicator.school_id=$1 AND framework.name=$2 AND framework.is_active
       ORDER BY area.position,sub_area.position,indicator.position`,
      [schoolId, DEFAULT_TK_TEMPLATE_NAME],
    );
    const options = await client.query<IdRow>(
      `SELECT option.id FROM assessment_scale_options option
       JOIN assessment_frameworks framework ON framework.scale_id=option.scale_id
       WHERE option.school_id=$1 AND framework.name=$2 AND framework.is_active
       ORDER BY option.position`,
      [schoolId, DEFAULT_TK_TEMPLATE_NAME],
    );
    if (!areas.rowCount || !indicators.rowCount || !options.rowCount) {
      throw new Error("Framework PAUD default belum lengkap untuk seed QA.");
    }

    const studentIds: string[] = [];
    for (const [index, student] of students.entries()) {
      const studentId = await id(
        client,
        `INSERT INTO students(
           school_id,name,student_number,birth_date,birth_place,nickname,gender,
           religion,child_order,address,lifecycle_status
         ) VALUES($1,$2,$3,$4,$5,$6,$7::student_gender,'Islam',$8,$9,'ACTIVE')
         ON CONFLICT(school_id,student_number) DO UPDATE
         SET name=EXCLUDED.name,birth_date=EXCLUDED.birth_date,birth_place=EXCLUDED.birth_place,
             nickname=EXCLUDED.nickname,gender=EXCLUDED.gender,religion=EXCLUDED.religion,
             child_order=EXCLUDED.child_order,address=EXCLUDED.address,
             lifecycle_status='ACTIVE',updated_at=now()
         RETURNING id`,
        [
          schoolId,
          student.name,
          student.studentNumber,
          `2021-${String((index % 9) + 1).padStart(2, "0")}-${String((index % 20) + 1).padStart(2, "0")}`,
          index % 2 === 0 ? "Jakarta" : "Depok",
          student.name.split(" ")[0],
          student.gender,
          (index % 3) + 1,
          `Jl. Pendidikan No. ${index + 1}`,
        ],
      );
      studentIds.push(studentId);
      const activeEnrollmentId = await enrollment(client, {
        academicYearId: activeYearId,
        classPeriodId: activePeriods[student.className],
        end: null,
        schoolId,
        start: "2026-07-01",
        status: "ACTIVE",
        studentId,
      });
      await enrollment(client, {
        academicYearId: previousYearId,
        classPeriodId: previousPeriods[student.className],
        end: "2026-06-30",
        schoolId,
        start: "2025-07-01",
        status: "COMPLETED",
        studentId,
      });
      const guardianId = await guardian(
        client,
        schoolId,
        studentId,
        student.name,
        index,
      );
      await client.query(
        `INSERT INTO reports(school_id,student_id,semester_id,student_enrollment_id,status)
         VALUES($1,$2,$3,$4,'DRAFT')
         ON CONFLICT(student_id,semester_id) DO UPDATE
         SET student_enrollment_id=EXCLUDED.student_enrollment_id,updated_at=now()
         WHERE reports.status<>'PUBLISHED'`,
        [schoolId, studentId, activeSemesterId, activeEnrollmentId],
      );
      const report = await client.query<{ id: string; status: ReportStatus }>(
        "SELECT id,status FROM reports WHERE school_id=$1 AND student_id=$2 AND semester_id=$3",
        [schoolId, studentId, activeSemesterId],
      );
      const reportId = report.rows[0].id;
      const targetStatus = statusFor(index);
      const teacherIds = classTeachers[student.className].map(
        (email) => userIds[email],
      );

      if (report.rows[0].status !== "PUBLISHED") {
        await client.query(
          "UPDATE reports SET status='DRAFT',submitted_at=NULL,approved_at=NULL WHERE id=$1",
          [reportId],
        );
        const complete = targetStatus !== "DRAFT";
        const assessmentCount = complete
          ? indicators.rows.length
          : Math.floor(indicators.rows.length / 3);
        for (const [indicatorIndex, indicator] of indicators.rows.entries()) {
          if (indicatorIndex >= assessmentCount) break;
          await client.query(
            `INSERT INTO student_assessments(
               school_id,student_id,semester_id,indicator_id,scale_option_id,assessed_by
             ) VALUES($1,$2,$3,$4,$5,$6)
             ON CONFLICT(student_id,semester_id,indicator_id) DO UPDATE
             SET scale_option_id=EXCLUDED.scale_option_id,assessed_by=EXCLUDED.assessed_by,assessed_at=now()`,
            [
              schoolId,
              studentId,
              activeSemesterId,
              indicator.id,
              options.rows[(indicatorIndex + index) % options.rows.length].id,
              teacherIds[index % teacherIds.length],
            ],
          );
        }
        const narrativeCount = complete
          ? areas.rows.length
          : Math.max(1, Math.floor(areas.rows.length / 2));
        for (const [areaIndex, area] of areas.rows.entries()) {
          if (areaIndex >= narrativeCount) break;
          await client.query(
            `INSERT INTO report_narratives(school_id,report_id,development_area_id,content,updated_by)
             VALUES($1,$2,$3,$4,$5)
             ON CONFLICT(report_id,development_area_id) DO UPDATE
             SET content=EXCLUDED.content,updated_by=EXCLUDED.updated_by,updated_at=now()`,
            [
              schoolId,
              reportId,
              area.id,
              `Ananda menunjukkan perkembangan yang baik pada area ${area.name}. Pendampingan dilakukan secara bertahap dan konsisten.`,
              teacherIds[index % teacherIds.length],
            ],
          );
        }
        if (complete || index % 2 === 0) {
          await client.query(
            `INSERT INTO attendance_summaries(school_id,student_id,semester_id,sick_days,permission_days,unexcused_days)
             VALUES($1,$2,$3,$4,$5,$6)
             ON CONFLICT(student_id,semester_id) DO UPDATE
             SET sick_days=EXCLUDED.sick_days,permission_days=EXCLUDED.permission_days,unexcused_days=EXCLUDED.unexcused_days`,
            [
              schoolId,
              studentId,
              activeSemesterId,
              index % 3,
              index % 2,
              index % 5 === 0 ? 1 : 0,
            ],
          );
        }
        if (index % 3 !== 0) {
          await client.query(
            `INSERT INTO growth_records(school_id,student_id,semester_id,weight_kg,height_cm,head_circumference_cm)
             VALUES($1,$2,$3,$4,$5,$6)
             ON CONFLICT(student_id,semester_id) DO UPDATE
             SET weight_kg=EXCLUDED.weight_kg,height_cm=EXCLUDED.height_cm,head_circumference_cm=EXCLUDED.head_circumference_cm`,
            [
              schoolId,
              studentId,
              activeSemesterId,
              14 + (index % 6) + 0.5,
              98 + (index % 8),
              index % 4 === 0 ? null : 50 + (index % 3),
            ],
          );
        }
        if (complete && index % 4 === 0) {
          await client.query(
            `INSERT INTO extracurricular_records(school_id,student_id,semester_id,activity_name,grade)
             VALUES($1,$2,$3,'Seni dan kreativitas',$4)
             ON CONFLICT(student_id,semester_id,activity_name) DO UPDATE SET grade=EXCLUDED.grade`,
            [
              schoolId,
              studentId,
              activeSemesterId,
              index % 8 === 0 ? "A" : "B",
            ],
          );
        }
        await client.query(
          `UPDATE reports SET status=$2::report_status,
             submitted_at=CASE WHEN $2 IN ('SUBMITTED','IN_REVIEW','APPROVED','PUBLISHED') THEN now() ELSE NULL END,
             approved_at=CASE WHEN $2 IN ('APPROVED','PUBLISHED') THEN now() ELSE NULL END,
             updated_at=now() WHERE id=$1`,
          [reportId, targetStatus],
        );
      }

      if (targetStatus === "REVISION_REQUIRED") {
        await client.query(
          `INSERT INTO report_approvals(school_id,report_id,actor_user_id,action,note)
           SELECT $1,$2,$3,'revision','Mohon lengkapi narasi perkembangan dan cek kembali catatan semester.'
           WHERE NOT EXISTS(SELECT 1 FROM report_approvals WHERE report_id=$2 AND action='revision')`,
          [schoolId, reportId, userIds["kepsek@ramu.test"]],
        );
      }

      if (targetStatus === "PUBLISHED") {
        const existingVersion = await client.query<IdRow>(
          "SELECT id FROM report_versions WHERE report_id=$1 ORDER BY version_number DESC LIMIT 1",
          [reportId],
        );
        let versionId = existingVersion.rows[0]?.id;
        if (!versionId) {
          const assessments = await client.query<{
            area_name: string;
            code: string;
            description: string;
            sub_area_name: string;
          }>(
            `SELECT area.name AS area_name,sub_area.name AS sub_area_name,
                    indicator.description,option.code
             FROM student_assessments assessment
             JOIN indicators indicator ON indicator.id=assessment.indicator_id
             JOIN sub_areas sub_area ON sub_area.id=indicator.sub_area_id
             JOIN development_areas area ON area.id=sub_area.development_area_id
             JOIN assessment_scale_options option ON option.id=assessment.scale_option_id
             WHERE assessment.school_id=$1 AND assessment.student_id=$2
               AND assessment.semester_id=$3
             ORDER BY area.position,sub_area.position,indicator.position`,
            [schoolId, studentId, activeSemesterId],
          );
          const narratives = await client.query<{
            content: string;
            name: string;
          }>(
            `SELECT area.name,narrative.content
             FROM report_narratives narrative
             JOIN development_areas area ON area.id=narrative.development_area_id
             WHERE narrative.report_id=$1
             ORDER BY area.position`,
            [reportId],
          );
          const growth = await client.query<{
            head_circumference_cm: string | null;
            height_cm: string | null;
            weight_kg: string | null;
          }>(
            `SELECT weight_kg,height_cm,head_circumference_cm
             FROM growth_records
             WHERE school_id=$1 AND student_id=$2 AND semester_id=$3`,
            [schoolId, studentId, activeSemesterId],
          );
          const attendance = await client.query<{
            permission_days: number;
            sick_days: number;
            unexcused_days: number;
          }>(
            `SELECT sick_days,permission_days,unexcused_days
             FROM attendance_summaries
             WHERE school_id=$1 AND student_id=$2 AND semester_id=$3`,
            [schoolId, studentId, activeSemesterId],
          );
          const teachers = await client.query<{
            name: string;
            phone: string | null;
          }>(
            "SELECT name,phone FROM users WHERE id=ANY($1::uuid[]) ORDER BY name",
            [teacherIds],
          );
          versionId = await id(
            client,
            `INSERT INTO report_versions(
               school_id,report_id,version_number,snapshot,pdf_storage_key,published_by
             ) VALUES($1,$2,1,$3,NULL,$4) RETURNING id`,
            [
              schoolId,
              reportId,
              JSON.stringify({
                report: { id: reportId, status: "PUBLISHED" },
                school: {
                  address: "Jl. Pendidikan No. 1",
                  logo_storage_key: null,
                  name: process.env.SEED_SCHOOL_NAME || "TK Contoh Ceria",
                },
                student: {
                  address: `Jl. Pendidikan No. ${index + 1}`,
                  birth_date: "2021-03-12",
                  birth_place: "Jakarta",
                  child_order: (index % 3) + 1,
                  class_name: student.className,
                  gender: student.gender,
                  name: student.name,
                  nickname: student.name.split(" ")[0],
                  religion: "Islam",
                  student_number: student.studentNumber,
                },
                semester: { academic_year_name: "2026", name: "Semester I" },
                teachers: teachers.rows,
                assessments: assessments.rows,
                narratives: narratives.rows,
                growth: growth.rows[0] ?? null,
                attendance: attendance.rows[0] ?? null,
                guardians: [],
              }),
              teacherIds[0],
            ],
          );
        }
        const token = `demo-raport-${student.studentNumber.toLowerCase()}`;
        await client.query(
          `INSERT INTO report_access(school_id,report_version_id,token_hash,pin_hash)
           SELECT $1,$2,$3,$4 WHERE NOT EXISTS(SELECT 1 FROM report_access WHERE token_hash=$3)`,
          [schoolId, versionId, hash(token), hash("123456")],
        );
        const deliveryStatus = ["READ", "SENT", "QUEUED", "FAILED"][index % 4];
        await client.query(
          `INSERT INTO report_deliveries(
             school_id,report_version_id,guardian_contact_id,recipient_phone,status,attempt_count,
             sent_at,read_at,failed_at,failure_reason
           ) SELECT $1,$2,$3,contact.phone,$4::report_delivery_status,
             CASE WHEN $4='QUEUED' THEN 0 ELSE 1 END,
             CASE WHEN $4 IN ('SENT','READ') THEN now() ELSE NULL END,
             CASE WHEN $4='READ' THEN now() ELSE NULL END,
             CASE WHEN $4='FAILED' THEN now() ELSE NULL END,
             CASE WHEN $4='FAILED' THEN 'Nomor WhatsApp belum dapat dihubungi.' ELSE NULL END
           FROM guardian_contacts contact WHERE contact.id=$3 AND contact.school_id=$1
           ON CONFLICT(report_version_id,guardian_contact_id) DO UPDATE
           SET status=EXCLUDED.status,attempt_count=EXCLUDED.attempt_count,sent_at=EXCLUDED.sent_at,
               read_at=EXCLUDED.read_at,failed_at=EXCLUDED.failed_at,
               failure_reason=EXCLUDED.failure_reason,updated_at=now()`,
          [schoolId, versionId, guardianId, deliveryStatus],
        );
      }
    }

    await client.query(
      `INSERT INTO lifecycle_requests(school_id,request_type,requested_by,reason,payload,status)
       SELECT $1,'TRANSFER',$2,'Penyesuaian kelompok belajar',$3,'PENDING'
       WHERE NOT EXISTS(
         SELECT 1 FROM lifecycle_requests
         WHERE school_id=$1 AND request_type='TRANSFER' AND status='PENDING'
           AND reason='Penyesuaian kelompok belajar'
       )`,
      [
        schoolId,
        userIds["guru.aisyah@ramu.test"],
        JSON.stringify({
          items: [
            {
              studentId: studentIds[0],
              targetClassGroupId: groupIds["Kelas Melati"],
              effectiveOn: "2026-11-03",
            },
          ],
        }),
      ],
    );
    await client.query(
      `INSERT INTO lifecycle_requests(school_id,request_type,requested_by,reason,payload,status)
       SELECT $1,'GRADUATION',$2,'Kelulusan akhir tahun untuk ditinjau',$3,'PENDING'
       WHERE NOT EXISTS(
         SELECT 1 FROM lifecycle_requests
         WHERE school_id=$1 AND request_type='GRADUATION' AND status='PENDING'
           AND reason='Kelulusan akhir tahun untuk ditinjau'
       )`,
      [
        schoolId,
        userIds["guru.budi@ramu.test"],
        JSON.stringify({
          studentIds: [studentIds[1]],
          effectiveOn: "2027-06-30",
        }),
      ],
    );
    for (const [number, status, note] of [
      ["CALON-001", "PENDING", null],
      ["CALON-002", "REJECTED", "Mohon perbaiki nomor induk dan kelas tujuan."],
    ] as const) {
      await client.query(
        `INSERT INTO student_admission_requests(
           school_id,requested_by,target_class_group_id,payload,status,reviewed_by,reviewed_at,review_note
         ) SELECT $1,$2,$3,$4,$5::varchar,$6,
           CASE WHEN $5::varchar='REJECTED' THEN now() ELSE NULL END,$7
         WHERE NOT EXISTS(
           SELECT 1 FROM student_admission_requests
           WHERE school_id=$1 AND payload->>'studentNumber'=$8
         )`,
        [
          schoolId,
          userIds["guru.citra@ramu.test"],
          groupIds["Kelas Merpati"],
          JSON.stringify({
            name: `Calon Murid ${number}`,
            studentNumber: number,
            gender: "FEMALE",
          }),
          status,
          status === "REJECTED" ? userIds["admin@ramu.test"] : null,
          note,
          number,
        ],
      );
    }

    await client.query("COMMIT");
    console.log(
      [
        "Seed QA selesai untuk TK Contoh Ceria.",
        "60 murid aktif: 20 di Kelas Apel, 20 di Kelas Melati, dan 20 di Kelas Merpati.",
        `Akun demo memakai kata sandi: ${password}`,
        "Akses wali contoh: /r/demo-raport-tk-001 dengan PIN 123456.",
      ].join("\n"),
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
