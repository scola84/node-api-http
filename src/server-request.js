import { Readable } from 'stream';
import { parse as parseUrl } from 'url';
import parseQuery from 'qs/lib/parse';
import { ScolaError } from '@scola/error';
import parseHeader from './helper/parse-header';

export default class ServerRequest extends Readable {
  constructor(request, connection) {
    super({
      objectMode: true
    });

    const url = parseUrl(request.url);
    const [path, version = ''] = url.pathname.split('@');

    this._request = request;
    this._connection = connection;

    this._method = this._request.method;
    this._url = this._request.url;
    this._headers = this._request.headers;

    this._path = path;
    this._version = version;
    this._query = parseQuery(url.query);
    this._params = {};
    this._data = null;

    this._methods = [];
    this._match = {};

    this._transformers = new Map();
  }

  connection() {
    return this._connection;
  }

  method() {
    return this._method;
  }

  url() {
    return this._url;
  }

  path() {
    return this._path;
  }

  version() {
    return this._version;
  }

  params(value) {
    if (typeof value === 'undefined') {
      return this._params;
    }

    this._params = value;
    return this;
  }

  param(name) {
    return this._params[name];
  }

  query(name) {
    if (typeof name === 'undefined') {
      return this._query;
    }

    return this._query[name];
  }

  data(value) {
    if (typeof value === 'undefined') {
      return this._data;
    }

    this._data = value;
    return this;
  }

  allow(method, action) {
    if (typeof action === 'undefined') {
      return this._methods.indexOf(method) !== -1;
    }

    if (typeof method === 'undefined') {
      return this._methods;
    }

    if (action === true) {
      this._methods.push(method);
    } else if (action === false) {
      this._methods.splice(this._methods.indexOf(method), 1);
    }

    return this;
  }

  match(name, value) {
    if (typeof value === 'undefined') {
      return this._match[name];
    }

    if (typeof name === 'undefined') {
      return this._match;
    }

    this._match[name] = value;
    return this;
  }

  headers() {
    return this._headers;
  }

  header(name, parse) {
    const header = this._headers[name] || this._headers[name.toLowerCase()];
    return header && parse ? parseHeader(header) : header;
  }

  address() {
    let address = null;
    let port = null;

    if (this._headers['x-real-ip']) {
      address = this._headers['x-real-ip'];
      port = this._headers['x-real-port'];
    } else {
      const parsedAddress = this._connection.address();
      address = parsedAddress.address;
      port = parsedAddress.port;
    }

    return {
      address,
      port
    };
  }

  transformer(name, value) {
    if (typeof name === 'undefined') {
      return this._transformers;
    }

    if (name === false) {
      this._transformers.clear();
      return this;
    }

    if (typeof value === 'undefined') {
      return this._transformers.get(name);
    }

    if (value === false) {
      this._transformers.delete(name);
      return this;
    }

    value.once('error', (error) => {
      this.emit('error', new ScolaError('400 invalid_request ' +
        error.message));
    });

    this._transformers.set(name, value);
    return this;
  }

  _read() {
    let i = 0;
    const transformers = Array.from(this._transformers.values());

    transformers.unshift(this._request);

    for (; i < transformers.length - 1; i += 1) {
      transformers[i].pipe(transformers[i + 1]);
    }

    const last = transformers.pop();

    last.on('data', (object) => {
      this.push(object);
    });

    last.once('end', () => {
      this.push(null);
    });
  }
}
