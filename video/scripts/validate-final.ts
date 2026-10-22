import { access, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  TOTAL_DURATION_SECONDS,
  workflowScenes,
} from "../src/data/workflow-script";
import { VIDEO_CONFIG } from "../src/config";

const exec = promisify(execFile);
const videoRoot = fileURLToPath(new URL("..", import.meta.url));
const captureDirectory = join(videoRoot, "public", "captures", "main");
const isReels = process.argv[2] === "reels";
const output = join(
  videoRoot,
  "out",
  isReels ? "ramu-promo-reels-v23-hd.mp4" : "ramu-promo-premium-v7-hd.mp4",
);
const outputConfig = isReels
  ? { height: 1920, width: 1080 }
  : { height: VIDEO_CONFIG.height, width: VIDEO_CONFIG.width };

async function assertFile(path: string) {
  const info = await stat(path).catch(() => undefined);
  if (!info?.isFile() || info.size === 0)
    throw new Error(`Artefak tidak tersedia: ${path}`);
}

async function assertHighDensityCapture(path: string) {
  await assertFile(path);
  const header = await readFile(path);
  const width = header.readUInt32BE(16);
  const height = header.readUInt32BE(20);
  if (width < VIDEO_CONFIG.width * 2 || height < VIDEO_CONFIG.height * 2)
    throw new Error(
      `Capture belum 2x: ${path} (${width}x${height}). Jalankan capture:main kembali.`,
    );
}

async function ffmpegPath() {
  if (process.env.RAMU_VIDEO_FFMPEG) return process.env.RAMU_VIDEO_FFMPEG;
  const remotion = join(
    videoRoot,
    "..",
    "node_modules",
    "@remotion",
    "compositor-win32-x64-msvc",
    "ffmpeg.exe",
  );
  if (
    await access(remotion)
      .then(() => true)
      .catch(() => false)
  )
    return remotion;
  const local = join(
    process.env.LOCALAPPDATA || "",
    "ms-playwright",
    "ffmpeg-1013",
    "ffmpeg-win64.exe",
  );
  if (
    await access(local)
      .then(() => true)
      .catch(() => false)
  )
    return local;
  return "ffmpeg";
}

function durationInSeconds(value: string) {
  const [, hours, minutes, seconds] =
    value.match(/(\d+):(\d+):(\d+(?:\.\d+)?)/) || [];
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

async function main() {
  for (const scene of workflowScenes.filter((item) => item.requiresCapture))
    await assertHighDensityCapture(join(captureDirectory, `${scene.id}.png`));
  await assertHighDensityCapture(join(captureDirectory, "landing-flow.png"));
  await assertFile(join(videoRoot, "public", "audio", "music-warm-paud.wav"));
  await assertFile(
    join(videoRoot, "public", "audio", "sfx-premium-motion.wav"),
  );
  await assertFile(output);
  const ffmpeg = await ffmpegPath();
  const probe = await exec(ffmpeg, ["-hide_banner", "-i", output]).catch(
    (error: { stderr?: string }) => ({ stderr: error.stderr || "" }),
  );
  const metadata = probe.stderr;
  const durationMatch = metadata.match(
    /Duration:\s*(\d\d:\d\d:\d\d(?:\.\d+)?)/,
  );
  const duration = durationMatch
    ? durationInSeconds(durationMatch[1])
    : Number.NaN;
  const videoPattern = new RegExp(
    `Video:\\s*h264.*${outputConfig.width}x${outputConfig.height}.*${VIDEO_CONFIG.fps} fps`,
    "i",
  );
  const video = videoPattern.test(metadata);
  const audio = /Audio:\s*aac/i.test(metadata);
  if (Math.abs(duration - TOTAL_DURATION_SECONDS) > 0.05 || !video || !audio)
    throw new Error(
      `Validasi MP4 gagal: durasi=${duration}, video=${video}, audio=${audio}.`,
    );
  console.log(
    `Valid: ${duration.toFixed(3)} dtk, ${outputConfig.width}x${outputConfig.height} @ ${VIDEO_CONFIG.fps} FPS, H.264/AAC.`,
  );
}

void main();
