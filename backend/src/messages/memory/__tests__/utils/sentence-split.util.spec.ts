import {
  bufferSentences,
  cosineDistance,
  percentile,
  splitIntoSentences,
} from '../../utils/sentence-split.util';

describe('sentence-split util', () => {
  it('splits by punctuation and new lines', () => {
    const result = splitIntoSentences(
      'First sentence. Second sentence?\nThird one!',
    );

    expect(result).toEqual([
      'First sentence.',
      'Second sentence?',
      'Third one!',
    ]);
  });

  it('returns buffered windows', () => {
    const result = bufferSentences(['A', 'B', 'C', 'D'], 1);

    expect(result).toEqual(['A B', 'A B C', 'B C D', 'C D']);
  });

  it('calculates cosine distance', () => {
    expect(cosineDistance([1, 0], [1, 0])).toBeCloseTo(0);
    expect(cosineDistance([1, 0], [0, 1])).toBeCloseTo(1);
  });

  it('calculates percentile with interpolation', () => {
    const values = [0.1, 0.3, 0.5, 0.9];

    expect(percentile(values, 0)).toBe(0.1);
    expect(percentile(values, 50)).toBe(0.4);
    expect(percentile(values, 95)).toBeCloseTo(0.84);
    expect(percentile(values, 100)).toBe(0.9);
  });
});
