type VariableCollection = {
  [key:string]: any;
};

class VariableManager {
  _localVariables: VariableCollection;
  
  constructor() {
    this._localVariables = {};
  }
  
  get(key:string):any {
    return this._localVariables[key];
  }
  
  set(key:string, value:any):void {
    this._localVariables[key] = value;
  }
}

export default VariableManager;