import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sampleRate = 48_000;
const duration = Number(process.env.RAMU_VIDEO_DURATION_SECONDS || 70);
const channels = 2;
const samples = Math.round(sampleRate * duration);
const output = join(
  dirname(fileURLToPath(import.meta.url)),
  "../public/audio/sfx-premium-motion.wav",
);

const scale = duration / 70;
const sceneChanges = [7, 14, 22, 31, 41, 48, 55, 60, 66].map(
  (value) => value * scale,
);
const clicks = [17.2, 25.6, 34.8, 51.3, 57.2].map((value) => value * scale);
const handoffs = [22, 41, 55].map((value) => value * scale);

const clamp = (value) => Math.max(-1, Math.min(1, value));
const noise = (index) => {
  const raw = Math.sin(index * 12.9898 + 31.337) * 43_758.5453;
  return (raw - Math.floor(raw)) * 2 - 1;
};

function whoosh(time, start, index) {
  const local = time - start;
  if (local < 0 || local > 0.62) return 0;
  const envelope = Math.sin((Math.PI * local) / 0.62) ** 1.6;
  const sweep = Math.sin(2 * Math.PI * (155 + 470 * (local / 0.62)) * local);
  return envelope * (noise(index) * 0.052 + sweep * 0.026);
}

function click(time, start) {
  const local = time - start;
  if (local < 0 || local > 0.12) return 0;
  return (
    Math.sin(2 * Math.PI * 1450 * local) * Math.exp(-local / 0.022) * 0.095
  );
}

function chime(time, start) {
  const local = time - start;
  if (local < 0 || local > 1.1) return 0;
  const envelope = Math.exp(-local / 0.34);
  return (
    envelope *
    (Math.sin(2 * Math.PI * 659.25 * local) * 0.05 +
      Math.sin(2 * Math.PI * 987.77 * local) * 0.027)
  );
}

const pcm = Buffer.alloc(samples * channels * 2);
for (let index = 0; index < samples; index += 1) {
  const time = index / sampleRate;
  let left = 0;
  let right = 0;

  sceneChanges.forEach((start, eventIndex) => {
    const signal = whoosh(time, start, index);
    const pan = eventIndex % 2 === 0 ? 0.84 : 1.08;
    left += signal * pan;
    right += signal * (1.92 - pan);
  });
  clicks.forEach((start) => {
    const signal = click(time, start);
    left += signal * 0.9;
    right += signal;
  });
  handoffs.forEach((start, eventIndex) => {
    const signal = chime(time, start);
    left += signal * (eventIndex % 2 === 0 ? 0.84 : 1);
    right += signal * (eventIndex % 2 === 0 ? 1 : 0.84);
  });

  pcm.writeInt16LE(Math.round(clamp(left) * 32_767), index * 4);
  pcm.writeInt16LE(Math.round(clamp(right) * 32_767), index * 4 + 2);
}

const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write("WAVEfmt ", 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(channels, 22);
header.writeUInt32LE(sampleRate, 24);
header.writeUInt32LE(sampleRate * channels * 2, 28);
header.writeUInt16LE(channels * 2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(pcm.length, 40);

await mkdir(dirname(output), { recursive: true });
await writeFile(output, Buffer.concat([header, pcm]));
console.log(`Dibuat: ${output} · ${duration} detik · stereo 48 kHz`);
