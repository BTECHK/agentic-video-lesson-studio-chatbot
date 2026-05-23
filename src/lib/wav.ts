/**
 * Minimal WAV duration reader. The Kokoro sidecar writes canonical PCM WAVs
 * (24 kHz mono 16-bit); this parses the `fmt ` and `data` chunks to return the
 * exact audio length in seconds — the authoritative input to timing inversion.
 */

export function wavDurationSeconds(buf: Buffer): number {
  if (buf.length < 12 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Not a RIFF/WAVE file');
  }

  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let dataBytes = -1;

  // Walk chunks starting after the 12-byte RIFF/WAVE header.
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const body = offset + 8;
    if (id === 'fmt ') {
      channels = buf.readUInt16LE(body + 2);
      sampleRate = buf.readUInt32LE(body + 4);
      bitsPerSample = buf.readUInt16LE(body + 14);
    } else if (id === 'data') {
      dataBytes = size;
    }
    // Chunks are word-aligned (padded to even length).
    offset = body + size + (size % 2);
  }

  if (sampleRate === 0 || channels === 0 || bitsPerSample === 0) {
    throw new Error('WAV missing fmt chunk');
  }
  if (dataBytes < 0) {
    throw new Error('WAV missing data chunk');
  }

  const bytesPerFrame = channels * (bitsPerSample / 8);
  return dataBytes / (sampleRate * bytesPerFrame);
}
