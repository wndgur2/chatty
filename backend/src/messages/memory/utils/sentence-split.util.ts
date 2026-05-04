export function splitIntoSentences(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  const rough = normalized
    .split(/(?<=[.!?])\s+|[\r\n]+/g)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (rough.length === 0) {
    return [normalized];
  }

  return rough;
}

export function bufferSentences(
  sentences: string[],
  bufferSize: number,
): string[] {
  if (sentences.length === 0) {
    return [];
  }

  const normalizedBufferSize = Math.max(0, bufferSize);
  return sentences.map((_, index) => {
    const start = Math.max(0, index - normalizedBufferSize);
    const end = Math.min(sentences.length, index + normalizedBufferSize + 1);
    return sentences.slice(start, end).join(' ');
  });
}

export function cosineDistance(left: number[], right: number[]): number {
  const length = Math.min(left.length, right.length);
  if (length === 0) {
    return 1;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 1;
  }

  const similarity = dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
  return 1 - similarity;
}

export function percentile(
  values: number[],
  requestedPercentile: number,
): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const clampedPercentile = Math.min(100, Math.max(0, requestedPercentile));
  const rank = (clampedPercentile / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);

  if (lower === upper) {
    return sorted[lower];
  }

  const weight = rank - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
