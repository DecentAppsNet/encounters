// Cuidado - Copilot screws up regexes in subtle ways. Like emdash instead of a hyphen.

const ALPHA_REGEX = /^[a-zA-Z]+$/i;

const ALPHA_NUMERIC_REGEX = /^[a-zA-Z0-9]+$/i;

const NUMERIC_REGEX = /^[0-9]+$/i; // Purposefully does not include "." and "-". Create different regexes rather than changing this one.

const WORD_REGEX = /^[a-zA-Z0-9']+$/i;

const WHITE_SPACE_REGEX = /^\s+$/i;

export const isAlpha = (text:string):boolean => ALPHA_REGEX.test(text);

export const isAlphaNumeric = (text:string):boolean => ALPHA_NUMERIC_REGEX.test(text);

export const isNumeric = (text:string):boolean => NUMERIC_REGEX.test(text);

export const isWord = (text:string):boolean => WORD_REGEX.test(text);

export const isWhitespace = (text:string):boolean => WHITE_SPACE_REGEX.test(text);