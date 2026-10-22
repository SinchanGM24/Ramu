import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const sampleRate = 44_100;
const seconds = 70;
const channels = 2;
const samples = sampleRate * seconds;
const tempo = 112;
const beat = 60 / tempo;
const output = join(
  dirname(fileURLToPath(import.meta.url)),
  "../public/audio/music-warm-paud.wav",
);

// C · G · Am · F: a familiar major-key loop, voiced like ukulele and marimba.
const chords = [
  { root: 130.81, notes: [261.63, 329.63, 392.0] },
  { root: 98.0, notes: [246.94, 293.66, 392.0] },
  { root: 110.0, notes: [220.0, 261.63, 329.63] },
  { root: 87.31, notes: [174.61, 220.0, 261.63] },
];

const melody = [
  659.25,
  783.99,
  880.0,
  783.99,
  659.25,
  587.33,
  523.25,
  null,
  587.33,
  783.99,
  987.77,
  783.99,
  659.25,
  587.33,
  523.25,
  null,
  659.25,
  880.0,
  1046.5,
  880.0,
  783.99,
  659.25,
  587.33,
  null,
  523.25,
  659.25,
  698.46,
  783.99,
  698.46,
  659.25,
  523.25,
  null,
];

const clamp = (value) => Math.max(-1, Math.min(1, value));
const noise = (index) => {
  const value = Math.sin(index * 12.9898 + 78.233) * 43_758.5453;
  return (value - Math.floor(value)) * 2 - 1;
};
const pluck = (frequency, time, decay = 0.3) => {
  if (time < 0) return 0;
  const envelope = Math.exp(-time / decay);
  const phase = 2 * Math.PI * frequency * time;
  return (
    envelope *
    (Math.sin(phase) + 0.34 * Math.sin(phase * 2) + 0.12 * Math.sin(phase * 3))
  );
};
const bell = (frequency, time) => {
  if (time < 0) return 0;
  const envelope = Math.exp(-time / 0.48);
  const phase = 2 * Math.PI * frequency * time;
  return envelope * (Math.sin(phase) + 0.28 * Math.sin(phase * 2.01));
};

const pcm = Buffer.alloc(samples * channels * 2);
for (let index = 0; index < samples; index += 1) {
  const time = index / sampleRate;
  const beatNumber = Math.floor(time / beat);
  const beatPhase = time - beatNumber * beat;
  const halfBeat = beat / 2;
  const halfBeatNumber = Math.floor(time / halfBeat);
  const halfBeatPhase = time - halfBeatNumber * halfBeat;
  const chord = chords[Math.floor(beatNumber / 4) % chords.length];
  const barBeat = beatNumber % 4;

  const ukeFrequency = chord.notes[halfBeatNumber % chord.notes.length];
  const uke = pluck(ukeFrequency, halfBeatPhase, 0.19) * 0.17;
  const ukeHigh = pluck(ukeFrequency * 2, halfBeatPhase, 0.12) * 0.055;

  const bass =
    (barBeat === 0 || barBeat === 2 ? pluck(chord.root, beatPhase, 0.58) : 0) *
    0.16;

  const melodyFrequency = melody[halfBeatNumber % melody.length];
  const melodySignal =
    melodyFrequency && halfBeatNumber % 2 === 0
      ? bell(melodyFrequency, halfBeatPhase) * 0.105
      : 0;

  const kick =
    (barBeat === 0 || barBeat === 2) && beatPhase < 0.16
      ? Math.sin(2 * Math.PI * (74 - 30 * (beatPhase / 0.16)) * beatPhase) *
        Math.exp(-beatPhase / 0.07) *
        0.15
      : 0;
  const handTap =
    (barBeat === 1 || barBeat === 3) && beatPhase < 0.09
      ? noise(index) * Math.exp(-beatPhase / 0.025) * 0.045
      : 0;
  const shaker =
    halfBeatPhase < 0.055
      ? noise(index + 19) * Math.exp(-halfBeatPhase / 0.018) * 0.018
      : 0;

  const intro = Math.min(1, time / 1.2);
  const outro = Math.min(1, (seconds - time) / 2.4);
  const master = Math.max(0, Math.min(intro, outro));
  const left =
    (uke * 1.04 +
      ukeHigh * 0.9 +
      bass +
      melodySignal * 0.86 +
      kick +
      handTap +
      shaker * 0.8) *
    master;
  const right =
    (uke * 0.9 +
      ukeHigh * 1.08 +
      bass +
      melodySignal * 1.08 +
      kick +
      handTap * 0.9 +
      shaker) *
    master;

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
console.log(`Dibuat: ${output} · ${tempo} BPM · stereo 44.1 kHz`);
