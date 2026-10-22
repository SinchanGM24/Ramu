function positiveInteger(name: string, fallback: number) {
  const parsed = Number(process.env[name]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const VIDEO_CONFIG = {
  durationSeconds: positiveInteger("RAMU_VIDEO_DURATION_SECONDS", 49),
  fps: positiveInteger("RAMU_VIDEO_FPS", 30),
  height: positiveInteger("RAMU_VIDEO_HEIGHT", 1080),
  width: positiveInteger("RAMU_VIDEO_WIDTH", 1920),
} as const;

export const BASE_DURATION_SECONDS = 49;
