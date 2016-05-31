import EventEmitter from '@scola/events';

export default class ServerResponse extends EventEmitter {
  constructor(response) {
    super();

    this.response = response;
    this.transformers = new Map();
    this._first = null;
  }

  get statusCode() {
    return this.response.statusCode;
  }

  set statusCode(code) {
    this.response.statusCode = code;
  }

  get _header() {
    return this.response._header;
  }

  get _headers() {
    return this.response._headers;
  }

  get headersSent() {
    return this.response.headersSent;
  }

  get finished() {
    return this.response.finished;
  }

  getHeader(...args) {
    return this.response.getHeader(...args);
  }

  setHeader(...args) {
    return this.response.setHeader(...args);
  }

  removeHeader(...args) {
    return this.response.removeHeader(...args);
  }

  writeHead(...args) {
    return this.response.writeHead(...args);
  }

  getTransformer(name) {
    return this.transformers.get(name);
  }

  setTransformer(name, transformer) {
    transformer.once('error', (error) => {
      this.emit('error', new Error('500 ' + error.message));
    });

    this.transformers.set(name, transformer);
    return this;
  }

  hasTransformer(name) {
    return this.transformers.has(name);
  }

  removeTransformer(name) {
    this.transformers.delete(name);
  }

  clear() {
    this.transformers.clear();
  }

  write(chunk, encoding, callback) {
    try {
      this._transform().write(chunk, encoding, callback);
    } catch (error) {
      this.emit('error', new Error('500 ' + error.message));
    }
  }

  end(chunk, encoding, callback) {
    try {
      this._transform().end(chunk, encoding, callback);
    } catch (error) {
      this.emit('error', new Error('500 ' + error.message));
    }
  }

  _transform() {
    if (this._first) {
      return this._first;
    }

    let i = 1;
    const transformers = [...this.transformers.values()];

    transformers.push(this.response);

    for (; i < transformers.length; i += 1) {
      transformers[i - 1].pipe(transformers[i]);
    }

    this._first = transformers[0];
    return this._first;
  }
}
