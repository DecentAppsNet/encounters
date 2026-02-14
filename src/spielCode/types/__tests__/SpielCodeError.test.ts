import { describe, expect, it } from 'vitest';

import SpielCodeError from "../SpielCodeError";
import {UNKNOWN_POSITION} from "../CodePosition";

describe('SpielCodeError', () => {
  it('throws an error with just a message', () => {
    expect(() => { throw new SpielCodeError('hello'); }).toThrowError('hello');
  });
  
  it('throws an error with message and line# specified', () => {
    const codePosition = {lineNo:2, charNo:UNKNOWN_POSITION};
    expect(() => { throw new SpielCodeError('hello', codePosition); }).toThrowError('hello at line 2');
  });
  
  it('throws an error with message and char# specified', () => {
    const codePosition = {lineNo:UNKNOWN_POSITION, charNo:3};
    expect(() => { throw new SpielCodeError('hello', codePosition); }).toThrowError('hello at char 3');
  });
  
  it('throws an error with message and line# and char# specified', () => {
    const codePosition = {lineNo:2, charNo:3};
    expect(() => { throw new SpielCodeError('hello', codePosition); }).toThrowError('hello at line 2 char 3');
  });
  
  it('throws an error with an offset applied to the char#', () => {
    const codePosition = {lineNo:UNKNOWN_POSITION, charNo:3};
    expect(() => { throw new SpielCodeError('hello', codePosition, 2); }).toThrowError('hello at char 5');
  });
  
  it('throws an error with an offset applied to the char# when the char# is unknown', () => {
    const codePosition = {lineNo:UNKNOWN_POSITION, charNo:UNKNOWN_POSITION};
    expect(() => { throw new SpielCodeError('hello', codePosition, 2); }).toThrowError('hello at char 2');
  });
});