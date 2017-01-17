import { EventEmitter } from 'events';
import { ScolaError } from '@scola/error';

export default class ServerResponse extends EventEmitter {
  constructor() {
    super();

    this._response = null;
    this._transformers = new Map();
    this._first = null;
  }

  response(value = null) {
    if (value === null) {
      return this._response;
    }

    this._response = value;
    return this;
  }

  status(value = null) {
    if (value === null) {
      return this._response.statusCode;
    }

    this._response.statusCode = value;
    return this;
  }

  header(name = null, value = null) {
    if (name === null) {
      return this._response.headers;
    }

    if (value === null) {
      return this._response.getHeader(name);
    }

    if (value === false) {
      this._response.removeHeader(name);
      return this;
    }

    this._response.setHeader(name, value);
    return this;
  }

  transformer(name = null, value = null) {
    if (name === null) {
      return this._transformers;
    }

    if (name === false) {
      this._transformers.clear();
      this._first = null;
      return this;
    }

    if (value === null) {
      return this._transformers.get(name);
    }

    if (value === false) {
      this._transformers.delete(name);
      return this;
    }

    value.once('error', (error) => {
      this._removeAllListeners();
      this.emit('error', new ScolaError('500 invalid_response ' +
        error.message));
    });

    this._transformers.set(name, value);
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
    const transformers = Array.from(this._transformers.values());

    transformers.push(this._response);

    for (; i < transformers.length; i += 1) {
      transformers[i - 1].pipe(transformers[i]);
    }

    this._first = transformers[0];
    return this._first;
  }

  _removeAllListeners() {
    this._transformers.forEach((transformer) => {
      transformer.removeAllListeners();
    });
  }
}
