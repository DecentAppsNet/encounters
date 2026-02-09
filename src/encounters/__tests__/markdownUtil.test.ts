import { describe, expect, it } from 'vitest';
import { textToCamelCase, parseSections, parseNameValueLines } from "../markdownUtil";

describe('markdownUtil', () => {
  describe('textToCamelCase()', () => {
    it('returns an empty string unchanged', () => {
      const result = textToCamelCase('');
      expect(result).toBe('');
    });

    it('returns an empty string for an all-whitespace string', () => {
      const result = textToCamelCase('     ');
      expect(result).toBe('');
    });

    it('returns a lower-case single word unchanged', () => {
      const result = textToCamelCase('example');
      expect(result).toBe('example');
    });

    it('returns a lower-case single word for a single word with initial cap', () => {
      const result = textToCamelCase('Example');
      expect(result).toBe('example');
    });

    it('returns camel-cased text for multiple words separated by spaces', () => {
      const result = textToCamelCase('this is an example');
      expect(result).toBe('thisIsAnExample');
    });
  });

  describe('parseSections()', () => {
    it('returns an empty object for empty text', () => {
      const text = '';
      const sections = parseSections(text);
      expect(sections).toEqual({});
    });

    it('parses text with one empty section', () => {
      const text = '# Section One';
      const sections = parseSections(text);
      expect(sections).toEqual({ 'Section One': '' });
    });

    it('parses text with two empty sections', () => {
      const text = '# Section One\n# Section Two';
      const sections = parseSections(text);
      expect(sections).toEqual({ 'Section One': '', 'Section Two': '' });
    });

    it('parses text with one content-containing section', () => {
      const text = '# Section One\n' +
        '* This is some content.\n* More content here.';
      const sections = parseSections(text);
      expect(sections).toEqual({ 'Section One': '* This is some content.\n* More content here.' });
    });

    it('parses text with two content-containing sections', () => {
      const text = '# Section One\n' +
        '* This is some content.\n* More content here.\n' +
        '# Section Two\n' +
        '> A different kind of content.\n> With multiple lines.';
      const sections = parseSections(text);
      expect(sections).toEqual({
        'Section One': '* This is some content.\n* More content here.',
        'Section Two': '> A different kind of content.\n> With multiple lines.'
      });
    });

    it('parses a subsection', () => {
      const text = '# Section One\n' +
        '* This is some content.\n* More content here.\n' +
        '## Section A\n' +
        '> Yes\n' +
        '## Section B\n' +
        '> No\n' +
        '# Section Two';
      const sections = parseSections(text);
      const sectionOne = sections['Section One'];
      const subSections = parseSections(sectionOne, 2);
      expect(subSections).toEqual({
        'Section A': '> Yes',
        'Section B': '> No'
      });
    });

    it('omits empty lines between sections', () => {
      const text = '# Section One\n' +
        '\n' +
        '* This is some content.\n' +
        '\n' +
        '* More content here.\n' +
        '\n' +
        '# Section Two\n' +
        '\n' +
        '> A different kind of content.\n' +
        '\n' +
        '> With multiple lines.\n' +
        '\n';
      const sections = parseSections(text);
      expect(sections).toEqual({
        'Section One': '* This is some content.\n* More content here.',
        'Section Two': '> A different kind of content.\n> With multiple lines.'
      });
    });

    it('parses sections with camelCase names', () => {
      const text = '# Section One\n' +
        '* This is some content.\n* More content here.\n' +
        '# Section Two\n' +
        '> A different kind of content.\n> With multiple lines.';
      const sections = parseSections(text, 1, true);
      expect(sections).toEqual({
        'sectionOne': '* This is some content.\n* More content here.',
        'sectionTwo': '> A different kind of content.\n> With multiple lines.'
      });
    });
  });

  describe('parseNameValueLines()', () => {
    it('returns an empty object for empty text', () => {
      const text = '';
      const nameValues = parseNameValueLines(text);
      expect(nameValues).toEqual({});
    });

    it('parses a name/value pair', () => {
      const text = '* name=Example Encounter';
      const nameValues = parseNameValueLines(text);
      expect(nameValues).toEqual({ name: 'Example Encounter' });
    });

    it('parses a name/value pair with missing value', () => {
      const text = '* name=';
      const nameValues = parseNameValueLines(text);
      expect(nameValues).toEqual({ name: '' });
    });

    it('parses a name/value pair with missing name', () => {
      const text = '* =huh';
      const nameValues = parseNameValueLines(text);
      expect(nameValues).toEqual({ '': 'huh' });
    });

    it('parses a name/value pair with whitespace around equal', () => {
      const text = '* name   =  huh';
      const nameValues = parseNameValueLines(text);
      expect(nameValues).toEqual({ 'name': 'huh' });
    });

    it('parses a name/value pair with whitespace after *', () => {
      const text = '*     name=huh';
      const nameValues = parseNameValueLines(text);
      expect(nameValues).toEqual({ 'name': 'huh' });
    });

    it('parses two name/value pairs', () => {
      const text = '* name=Example Encounter\n* version=1.0';
      const nameValues = parseNameValueLines(text);
      expect(nameValues).toEqual({ name: 'Example Encounter', version: '1.0' });
    });

    it('parses name/value pairs from text with other lines in it', () => {
      const text = 'This is some introductory text.\n' +
        '* name=Example Encounter\n' +
        'Some other descriptive text.\n' +
        '* not a name/value line because no equal sign\n' +
        '* version=1.0\n' +
        'Final remarks here.';
      const nameValues = parseNameValueLines(text);
      expect(nameValues).toEqual({ name: 'Example Encounter', version: '1.0' });
    });
  });
});