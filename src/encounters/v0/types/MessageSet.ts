// Class for grouping multiple messages that can be returned randomly.
class MessageSet {
  _messages:string[];
  _lastMessageI:number;

  constructor(messages:string[]) {
    this._messages = messages;
    this._lastMessageI = Math.floor(Math.random() * this._messages.length); // Assign randomly here so that the first call to nextMessage() has equal possibility of returning any message.
  }

  nextMessage():string { // Returns one of the messages randomly, but ensures the same message is not returned twice in a row.
    if (this._messages.length === 1) return this._messages[0];
    const randomOffset = Math.floor(Math.random() * (this._messages.length - 1)) + 1;
    this._lastMessageI = (this._lastMessageI + randomOffset) % this._messages.length;
    return this._messages[this._lastMessageI];
  }

  toArray():string[] {
    return [...this._messages];
  }

  get count():number { return this._messages.length;}
}

export default MessageSet;