import { parseConfigFloat, parseConfigInt } from './parse-config-number.util';

describe('parseConfigInt', () => {
  const bounds = { min: 1, max: 100 };

  it('uses default when raw is undefined', () => {
    expect(parseConfigInt(undefined, 20, bounds)).toBe(20);
  });

  it('uses default when raw is empty or non-numeric', () => {
    expect(parseConfigInt('', 20, bounds)).toBe(20);
    expect(parseConfigInt('  ', 20, bounds)).toBe(20);
    expect(parseConfigInt('abc', 20, bounds)).toBe(20);
  });

  it('parses numeric strings and truncates', () => {
    expect(parseConfigInt('42', 20, bounds)).toBe(42);
    expect(parseConfigInt('42.9', 20, bounds)).toBe(42);
  });

  it('clamps to bounds', () => {
    expect(parseConfigInt('0', 20, bounds)).toBe(1);
    expect(parseConfigInt('500', 20, bounds)).toBe(100);
  });
});

describe('parseConfigFloat', () => {
  const bounds = { min: 0, max: 1 };

  it('uses default when raw is invalid', () => {
    expect(parseConfigFloat(undefined, 0.4, bounds)).toBe(0.4);
    expect(parseConfigFloat('x', 0.4, bounds)).toBe(0.4);
  });

  it('parses finite floats', () => {
    expect(parseConfigFloat('0.35', 0.4, bounds)).toBe(0.35);
    expect(parseConfigFloat(0.75, 0.4, bounds)).toBe(0.75);
  });

  it('clamps', () => {
    expect(parseConfigFloat('-1', 0.4, bounds)).toBe(0);
    expect(parseConfigFloat('2', 0.4, bounds)).toBe(1);
  });
});
