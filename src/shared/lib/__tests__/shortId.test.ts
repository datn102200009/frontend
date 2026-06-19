import { describe, it, expect } from 'vitest';
import { shortId, shortAssetCode } from '../shortId';

describe('shortId helper library', () => {
  describe('shortId', () => {
    it('returns 8-char uppercase of valid UUID', () => {
      expect(shortId('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')).toBe('A1B2C3D4');
    });

    it('handles null', () => {
      expect(shortId(null)).toBe('—');
    });

    it('handles undefined', () => {
      expect(shortId(undefined)).toBe('—');
    });

    it('handles empty string', () => {
      expect(shortId('')).toBe('—');
    });

    it('handles short non-UUID string by uppercasing and slicing up to 8 chars', () => {
      expect(shortId('abc')).toBe('ABC');
      expect(shortId('abcdefghij')).toBe('ABCDEFGH');
    });
  });

  describe('shortAssetCode', () => {
    it('returns user-typed code unchanged', () => {
      expect(shortAssetCode('MOLD-001')).toBe('MOLD-001');
    });

    it('returns user-typed long code unchanged', () => {
      expect(shortAssetCode('MOLD-PRODUCTION-MACHINE-2026')).toBe('MOLD-PRODUCTION-MACHINE-2026');
    });

    it('truncates UUID format with FA- prefix to 8 chars uppercase', () => {
      expect(shortAssetCode('FA-a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')).toBe('FA-A1B2C');
    });

    it('truncates raw UUID to 8 chars uppercase', () => {
      expect(shortAssetCode('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d')).toBe('A1B2C3D4');
    });

    it('handles null/undefined/empty string', () => {
      expect(shortAssetCode(null)).toBe('—');
      expect(shortAssetCode(undefined)).toBe('—');
      expect(shortAssetCode('')).toBe('—');
    });

    it('handles short non-UUID string by returning unchanged if length is less than 32', () => {
      expect(shortAssetCode('ABC')).toBe('ABC');
    });
  });
});
