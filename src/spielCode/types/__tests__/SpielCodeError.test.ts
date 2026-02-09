import { describe, expect, it } from 'vitest';

import SpielCodeError from "../SpielCodeError";
import {UNKNOWN_POSITION} from "../CodePosition";

describe('SpielCodeError', () => {
  it('throws an error with just a message', () => {
    expect(() => { throw new SpielCodeError('hello'); }).toThrowError('hello');
  });
  
  it('throws an error with message and node# specified', () => {
    const codePosition = {nodeNo: 1, lineNo:UNKNOWN_POSITION, charNo:UNKNOWN_POSITION};
    expect(() => { throw new SpielCodeError('hello', codePosition); }).toThrowError('hello at node 1');
  });
  
  it('throws an error with message and line# specified', () => {
    const codePosition = {nodeNo: UNKNOWN_POSITION, lineNo:2, charNo:UNKNOWN_POSITION};
    expect(() => { throw new SpielCodeError('hello', codePosition); }).toThrowError('hello at line 2');
  });
  
  it('throws an error with message and char# specified', () => {
    const codePosition = {nodeNo: UNKNOWN_POSITION, lineNo:UNKNOWN_POSITION, charNo:3};
    expect(() => { throw new SpielCodeError('hello', codePosition); }).toThrowError('hello at char 3');
  });
  
  it('throws an error with message and node# and line# specified', () => {
    const codePosition = {nodeNo: 1, lineNo:2, charNo:UNKNOWN_POSITION};
    expect(() => { throw new SpielCodeError('hello', codePosition); }).toThrowError('hello at node 1 line 2');
  });
  
  it('throws an error with message and node# and char# specified', () => {
    const codePosition = {nodeNo: 1, lineNo:UNKNOWN_POSITION, charNo:3};
    expect(() => { throw new SpielCodeError('hello', codePosition); }).toThrowError('hello at node 1 char 3');
  });
  
  it('throws an error with message and line# and char# specified', () => {
    const codePosition = {nodeNo: UNKNOWN_POSITION, lineNo:2, charNo:3};
    expect(() => { throw new SpielCodeError('hello', codePosition); }).toThrowError('hello at line 2 char 3');
  });
  
  it('throws an error with message and node#, line#, and char# specified', () => {
    const codePosition = {nodeNo: 1, lineNo:2, charNo:3};
    expect(() => { throw new SpielCodeError('hello', codePosition); }).toThrowError('hello at node 1 line 2 char 3');
  });
  
  
  it('throws an error with an offset applied to the char#', () => {
    const codePosition = {nodeNo: UNKNOWN_POSITION, lineNo:UNKNOWN_POSITION, charNo:3};
    expect(() => { throw new SpielCodeError('hello', codePosition, 2); }).toThrowError('hello at char 5');
  });
  
  it('throws an error with an offset applied to the char# when the char# is unknown', () => {
    const codePosition = {nodeNo: UNKNOWN_POSITION, lineNo:UNKNOWN_POSITION, charNo:UNKNOWN_POSITION};
    expect(() => { throw new SpielCodeError('hello', codePosition, 2); }).toThrowError('hello at char 2');
  });
});