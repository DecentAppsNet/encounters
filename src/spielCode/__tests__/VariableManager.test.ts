import VariableManager from "../VariableManager";

describe('VariableManager', () => {
  it('get() returns undefined for non-existent variable', () => {
    const variableManager = new VariableManager();
    expect(variableManager.get('hello')).toBeUndefined();
  });
  
  it('set() sets and get() gets', () => {
    const variableManager = new VariableManager();
    variableManager.set('hello', 'world');
    expect(variableManager.get('hello')).toEqual('world');
  });
  
  it('setting an existing value will override it', () => {
    const variableManager = new VariableManager();
    variableManager.set('hello', 'world');
    variableManager.set('hello', 'new world');
    expect(variableManager.get('hello')).toEqual('new world');
  });
  
  it('string values can be set and get', () => {
    const variableManager = new VariableManager();
    variableManager.set('hello', 'world');
    expect(variableManager.get('hello')).toEqual('world');
  });
  
  it('number values can be set and get', () => {
    const variableManager = new VariableManager();
    variableManager.set('hello', 123);
    expect(variableManager.get('hello')).toEqual(123);
  });
  
  it('boolean values can be set and get', () => {
    const variableManager = new VariableManager();
    variableManager.set('hello', true);
    expect(variableManager.get('hello')).toEqual(true);
  });
  
  it('null values can be set and get', () => {
    const variableManager = new VariableManager();
    variableManager.set('hello', null);
    expect(variableManager.get('hello')).toEqual(null);
  });
  
  it('undefined values can be set and get', () => {
    const variableManager = new VariableManager();
    variableManager.set('hello', undefined);
    expect(variableManager.get('hello')).toEqual(undefined);
  });
  
  it('object values can be set and get', () => {
    const variableManager = new VariableManager();
    const obj = { hello: 'world' };
    variableManager.set('hello', obj);
    expect(variableManager.get('hello')).toEqual(obj);
  });
});