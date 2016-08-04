import EventEmitter from 'events';

export default class ServerResponse extends EventEmitter {
  constructor(response) {
    super();

    this._response = response;
    this._transformers = new Map();
    this._first = null;
  }

  get statusCode() {
    return this._response.statusCode;
  }

  set statusCode(code) {
    this._response.statusCode = code;
  }

  get _header() {
    return this._response._header;
  }

  get _headers() {
    return this._response._headers;
  }

  get headersSent() {
    return this._response.headersSent;
  }

  get finished() {
    return this._response.finished;
  }

  getHeader(...args) {
    return this._response.getHeader(...args);
  }

  setHeader(...args) {
    return this._response.setHeader(...args);
  }

  removeHeader(...args) {
    return this._response.removeHeader(...args);
  }

  writeHead(...args) {
    return this._response.writeHead(...args);
  }

  getTransformer(name) {
    return this._transformers.get(name);
  }

  setTransformer(name, transformer) {
    transformer.once('error', (error) => {
      this.emit('error', new Error('500 invalid_response ' + error.message));
    });

    this._transformers.set(name, transformer);
    return this;
  }

  hasTransformer(name) {
    return this._transformers.has(name);
  }

  removeTransformer(name) {
    this._transformers.delete(name);
  }

  clear() {
    this._transformers.clear();
    this._first = null;
  }

  write(chunk, encoding, callback) {
    this._transform().write(chunk, encoding, callback);
  }

  end(chunk, encoding, callback) {
    this._transform().end(chunk, encoding, callback);
  }

  _transform() {
    if (this._first) {
      return this._first;
    }

    let i = 1;
    const transformers = [...this._transformers.values()];

    transformers.push(this._response);

    for (; i < transformers.length; i += 1) {
      transformers[i - 1].pipe(transformers[i]);
    }

    this._first = transformers[0];
    return this._first;
  }
}
