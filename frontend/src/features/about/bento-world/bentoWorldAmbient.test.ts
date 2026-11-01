import { describe, expect, it } from 'vitest';
import { DAY_END_HOUR, DAY_START_HOUR, resolveAmbientMode } from './bentoWorldAmbient';

function at(hour: number, minute = 0): Date {
  return new Date(2026, 0, 15, hour, minute, 0, 0);
}

describe('resolveAmbientMode', () => {
  it('picks day from 07:00 to 19:00 and night outside that window', () => {
    expect(resolveAmbientMode(at(DAY_START_HOUR))).toBe('day');
    expect(resolveAmbientMode(at(12, 30))).toBe('day');
    expect(resolveAmbientMode(at(DAY_END_HOUR - 1, 59))).toBe('day');
    expect(resolveAmbientMode(at(DAY_END_HOUR))).toBe('night');
    expect(resolveAmbientMode(at(23, 45))).toBe('night');
    expect(resolveAmbientMode(at(6, 59))).toBe('night');
    expect(resolveAmbientMode(at(0))).toBe('night');
  });
});
