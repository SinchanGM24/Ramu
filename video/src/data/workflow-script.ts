import { BASE_DURATION_SECONDS, VIDEO_CONFIG } from "../config";

export const FPS = VIDEO_CONFIG.fps;
export const TOTAL_DURATION_SECONDS = VIDEO_CONFIG.durationSeconds;

export type WorkflowSceneId =
  | "landing"
  | "dashboard"
  | "students"
  | "assessment"
  | "narrative"
  | "review"
  | "delivery"
  | "parent-pin"
  | "parent-report"
  | "closing";

export type WorkflowScene = {
  id: WorkflowSceneId;
  from: number;
  duration: number;
  title: string;
  caption: string;
  requiresCapture: boolean;
};

const seconds = (value: number) =>
  Math.round(value * (TOTAL_DURATION_SECONDS / BASE_DURATION_SECONDS) * FPS);

/** The same story can be retimed with RAMU_VIDEO_DURATION_SECONDS. */
export const workflowScenes: readonly WorkflowScene[] = [
  {
    id: "landing",
    from: seconds(0),
    duration: seconds(4),
    title: "Raport PAUD, tanpa ribet.",
    caption:
      "Semua proses raport sekolah, dari guru hingga wali, terasa lebih ringan.",
    requiresCapture: true,
  },
  {
    id: "dashboard",
    from: seconds(4),
    duration: seconds(4),
    title: "Satu sekolah. Satu alur.",
    caption:
      "Kebutuhan raport sekolah tersusun rapi dalam satu alur yang mudah diikuti.",
    requiresCapture: true,
  },
  {
    id: "students",
    from: seconds(8),
    duration: seconds(5),
    title: "Tambah murid. Langsung siap.",
    caption: "Daftarkan murid baru dan tempatkan mereka di kelas yang tepat.",
    requiresCapture: true,
  },
  {
    id: "assessment",
    from: seconds(13),
    duration: seconds(6),
    title: "Nilai satu per satu.",
    caption:
      "Guru mencatat perkembangan setiap anak, satu per satu dengan mudah.",
    requiresCapture: true,
  },
  {
    id: "narrative",
    from: seconds(19),
    duration: seconds(7),
    title: "Nilai menjadi draf.",
    caption:
      "Smart Narrative Engine merangkum hasil penilaian indikator pada setiap aspek perkembangan menjadi draf narasi yang hangat dan mudah dipahami wali.",
    requiresCapture: true,
  },
  {
    id: "review",
    from: seconds(26),
    duration: seconds(5),
    title: "Guru → Kepala Sekolah",
    caption: "Raport diperiksa bersama sebelum siap dibagikan kepada wali.",
    requiresCapture: true,
  },
  {
    id: "delivery",
    from: seconds(31),
    duration: seconds(5),
    title: "Final, lalu bagikan.",
    caption: "Bagikan raport yang sudah siap kepada setiap wali dengan mudah.",
    requiresCapture: true,
  },
  {
    id: "parent-pin",
    from: seconds(36),
    duration: seconds(4),
    title: "Satu PIN. Tanpa akun.",
    caption: "Masukkan PIN untuk membuka raport digital anak.",
    requiresCapture: true,
  },
  {
    id: "parent-report",
    from: seconds(40),
    duration: seconds(5),
    title: "Sampai ke wali.",
    caption: "Raport digital siap dilihat, diunduh, dan dicetak kapan saja.",
    requiresCapture: true,
  },
  {
    id: "closing",
    from: seconds(45),
    duration: seconds(4),
    title: "RAMU",
    caption: "Lebih ringan. Lebih bermakna.",
    requiresCapture: false,
  },
] as const;
