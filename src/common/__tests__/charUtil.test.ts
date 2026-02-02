import { isAlphaNumeric, isNumeric } from "../charUtil";

describe('charUtil', () => {
  describe('isAlphaNumeric()', () => {
    it('returns false for empty string', () => {
      expect(isAlphaNumeric('')).toBeFalsy();
    });

    it('returns true for one lower-case alpha', () => {
      expect(isAlphaNumeric('a')).toBeTruthy();
    });

    it('returns true for one upper-case alpha', () => {
      expect(isAlphaNumeric('A')).toBeTruthy();
    });

    it('returns true for one numeric', () => {
      expect(isAlphaNumeric('0')).toBeTruthy();
    });

    it('returns false for one non-alpha-numeric', () => {
      expect(isAlphaNumeric(' ')).toBeFalsy();
    });

    it('returns false if string contains a mix of alphanumeric and not', () => {
      expect(isAlphaNumeric('A ')).toBeFalsy();
    });
  });
  
  describe('isNumeric()', () => {
    it('returns false for empty string', () => {
      expect(isNumeric('')).toBeFalsy();
    });

    it('returns false for negative number', () => {
      expect(isNumeric('-3')).toBeFalsy();
    });

    it('returns false for decimal number', () => {
      expect(isNumeric('3.7')).toBeFalsy();
    });

    it('returns true for one numeric', () => {
      expect(isNumeric('1')).toBeTruthy();
    });

    it('returns false for one non-numeric', () => {
      expect(isNumeric('a')).toBeFalsy();
    });

    it('returns false if string contains a mix of numeric and not', () => {
      expect(isNumeric('1a')).toBeFalsy();
    });
  });
});