import { describe, it, expect } from 'vitest';
import { wavDurationSeconds } from '../src/lib/wav';

/** Build a minimal canonical PCM WAV header with the given params + data size. */
function makeWav(sampleRate: number, channels: number, bits: number, dataBytes: number): Buffer {
  const blockAlign = channels * (bits / 8);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * blockAlign, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bits, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataBytes, 40);
  return Buffer.concat([header, Buffer.alloc(dataBytes)]);
}

describe('wavDurationSeconds', () => {
  it('computes duration for Kokoro-native 24kHz mono 16-bit PCM', () => {
    // 2 seconds: 24000 samples/s * 2 bytes/sample * 2 s = 96000 data bytes.
    const buf = makeWav(24000, 1, 16, 96000);
    expect(wavDurationSeconds(buf)).toBeCloseTo(2.0, 5);
  });

  it('accounts for channels and bit depth (stereo 16-bit 48kHz)', () => {
    // 1 second stereo: 48000 * (2ch * 2bytes) * 1s = 192000 bytes.
    const buf = makeWav(48000, 2, 16, 192000);
    expect(wavDurationSeconds(buf)).toBeCloseTo(1.0, 5);
  });

  it('throws on a non-WAV buffer', () => {
    expect(() => wavDurationSeconds(Buffer.from('not a wav file at all'))).toThrow(/wav/i);
  });
});
