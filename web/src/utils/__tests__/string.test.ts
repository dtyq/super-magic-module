import { describe, it, expect } from 'vitest';
import { encryptPhone, validatePhone } from '../string';

describe('encryptPhone', () => {
  it('should return the original phone number if it is invalid', () => {
    expect(encryptPhone('123')).toBe('123');
    expect(encryptPhone('abcdefghijk')).toBe('abcdefghijk');
  });

  it('should encrypt a valid phone number without country code', () => {
    expect(encryptPhone('13800138000')).toBe('138****8000');
  });

  it('should encrypt a valid phone number with country code', () => {
    expect(encryptPhone('+8613800138000')).toBe('+86138****8000');
  });

  it('should use custom symbol for encryption', () => {
    expect(encryptPhone('13800138000', '#')).toBe('138####8000');
  });
});

describe('validatePhone', () => {
  it('should return true for valid phone numbers', () => {
    expect(validatePhone('+8613800138000')).toBe(true);
    expect(validatePhone('13800138000')).toBe(true);
  });

  it('should return false for invalid phone numbers', () => {
    expect(validatePhone('123')).toBe(false);
    expect(validatePhone('abcdefghijk')).toBe(false);
  });
});