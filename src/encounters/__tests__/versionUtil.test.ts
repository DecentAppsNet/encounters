import { describe, expect, it } from 'vitest';
import { parseVersion } from "../versionUtil";

describe('versionUtil', () => {
  describe('parseVersion()', () => {
    it('throws for empty text', () => {
      const text = '';
      expect(() => parseVersion(text)).toThrow();
    });

    it('throws if first line does not contain a version', () => {
      const text = 'This is not a version line.\n<!-- Encounter v1.0 -->';
      expect(() => parseVersion(text)).toThrow();
    });

    it('throws if an otherwise valid version is preceded by non-whitespace characters on same line', () => {
      const text = 'Prefix <!-- Encounter v1.0 -->';
      expect(() => parseVersion(text)).toThrow();
    });

    it('throws if an otherwise valid version is followed by non-whitespace characters on same line', () => {
      const text = '<!-- Encounter v1.0 --> Suffix';
      expect(() => parseVersion(text)).toThrow();
    });

    it('throws if an otherwise valid version is missing a version# after the "Encounter v" prefix.', () => {
      const text = '<!-- Encounter v -->';
      expect(() => parseVersion(text)).toThrow();
    });

    it('throws if an otherwise valid version has whitespace after the v', () => {
      const text = '<!-- Encounter v 1.0 -->';
      expect(() => parseVersion(text)).toThrow();
    });

    it('throws if an otherwise valid version has non-digit characters after the v', () => {
      const text = '<!-- Encounter vA.B -->';
      expect(() => parseVersion(text)).toThrow();
    });

    it('throws if an otherwise valid version has digits but no period delimiter', () => {
      const text = '<!-- Encounter v10 -->';
      expect(() => parseVersion(text)).toThrow();
    });

    it('throws if an otherwise valid version has digits with more than one period delimiter', () => {
      const text = '<!-- Encounter v1.0.0 -->';
      expect(() => parseVersion(text)).toThrow();
    });

    it('throws if the version prefix is wrong case', () => {
      const text = '<!-- encounter v1.0 -->';
      expect(() => parseVersion(text)).toThrow();
    });

    it('parses a valid version in text with no other lines', () => {
      const text = '<!-- Encounter v2.5 -->';
      const version = parseVersion(text);
      expect(version).toBe('2.5');
    });

    it('parses a valid version in text followed by another line', () => {
      const text = '<!-- Encounter v2.5 -->\nSome other text here.';
      const version = parseVersion(text);
      expect(version).toBe('2.5');
    });

    it('parses a valid version in text preceded by whitespace', () => {
      const text = '   <!-- Encounter v2.5 -->';
      const version = parseVersion(text);
      expect(version).toBe('2.5');
    });
    
    it('parses a valid version in text followed by whitespace', () => {
      const text = '<!-- Encounter v2.5 -->   ';
      const version = parseVersion(text);
      expect(version).toBe('2.5');
    });
  });
});