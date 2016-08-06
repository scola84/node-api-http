import EventEmitter from 'events';
import { ScolaError } from '@scola/error';

export default class ServerResponse extends EventEmitter {
  constructor(response) {
    super();

    this._response = response;
    this._transformers = new Map();
    this._first = null;
  }

  status(status) {
    if (typeof status === 'undefined') {
      return this._response.statusCode;
    }

    this._response.statusCode = status;
    return this;
  }

  header(name, value) {
    if (typeof value === 'undefined') {
      return this._response.getHeader(name);
    }

    if (typeof name === 'undefined') {
      return this._response.headers;
    }

    if (value === false) {
      this._response.removeHeader(name);
      return this;
    }

    this._response.setHeader(name, value);
    return this;
  }

  transformer(name, transformer) {
    if (typeof name === 'undefined') {
      return this._transformers;
    }

    if (name === false) {
      this._transformers.clear();
      this._first = null;
      return this;
    }

    if (typeof transformer === 'undefined') {
      return this._transformers.get(name);
    }

    if (transformer === false) {
      this._transformers.delete(name);
      return this;
    }

    transformer.once('error', (error) => {
      this.emit('error', new ScolaError('500 invalid_response ' +
        error.message));
    });

    this._transformers.set(name, transformer);
    return this;
  }

  end(data, callback) {
    this._transform().end(data, callback);
    return this;
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
