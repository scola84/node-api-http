import get from 'lodash-es/get';
import set from 'lodash-es/set';
import { Readable } from 'stream';
import { parse as parseUrl } from 'url';
import { debuglog } from 'util';
import parseQuery from 'qs/lib/parse';
import { ScolaError } from '@scola/error';
import parseHeader from './helper/parse-header';

export default class ServerRequest extends Readable {
  constructor() {
    super({
      objectMode: true
    });

    this._log = debuglog('http');

    this._connection = null;
    this._request = null;
    this._codec = null;
    this._decoder = null;

    this._method = null;
    this._url = null;
    this._headers = null;
    this._path = null;
    this._version = null;
    this._query = {};
    this._params = {};
    this._requestData = {};

    this._methods = [];
    this._match = {};

    this._handleData = (d) => this._data(d);
    this._handleEnd = () => this._end();
    this._handleError = (e) => this._error(e);
  }

  destroy(abort) {
    this._log('ServerRequest destroy abort=%s', abort);

    if (this._request) {
      this._unbindRequest();
      this._request.destroy();
    }

    this._tearDown(abort);
  }

  connection(value = null) {
    if (value === null) {
      return this._connection;
    }

    this._connection = value;
    return this;
  }

  request(value = null) {
    if (value === null) {
      return this._request;
    }

    this._request = value;
    this._bindRequest();

    this.method(this._request.method);
    this.url(this._request.url);
    this.headers(this._request.headers);

    return this;
  }

  codec(value = null) {
    if (value === null) {
      return this._codec;
    }

    this._codec = value;
    return this;
  }

  method(value = null) {
    if (value === null) {
      return this._method;
    }

    this._method = value;
    return this;
  }

  url(value = null) {
    if (value === null) {
      return this._url;
    }

    const parsedUrl = parseUrl(value);

    this._url = value;
    this._query = parseQuery(parsedUrl.query, {
      allowDots: true,
      arrayFormat: 'repeat'
    });

    const [path, version = ''] = parsedUrl.pathname.split('@');

    this.path(path);
    this.version(version);

    return this;
  }

  headers(value = null) {
    if (value === null) {
      return this._headers;
    }

    this._headers = value;
    return this;
  }

  header(name, parse = false) {
    const header = this._headers[name] ||
      this._headers[name.toLowerCase()];

    if (typeof header === 'undefined') {
      return parse === true ? {} : null;
    }

    return parse === true ? parseHeader(header) : header;
  }

  path(value = null) {
    if (value === null) {
      return this._path;
    }

    this._path = value;
    return this;
  }

  version(value = null) {
    if (value === null) {
      return this._version;
    }

    this._version = value;
    return this;
  }

  params(value = null) {
    if (value === null) {
      return this._params;
    }

    this._params = value;
    return this;
  }

  param(name, value = null) {
    if (value === null) {
      return get(this._params, name);
    }

    set(this._params, name, value);
    return this;
  }

  query(name = null) {
    if (name === null) {
      return this._query;
    }

    return get(this._query, name);
  }

  data(value = null) {
    if (value === null) {
      return this._requestData;
    }

    this._requestData = value;
    return this;
  }

  datum(name, value = null) {
    if (value === null) {
      const datum = get(this._requestData, name);
      return typeof datum === 'undefined' ? null : datum;
    }

    set(this._requestData, name, value);
    return this;
  }

  allow(method = null, action = null) {
    if (method === null) {
      return this._methods;
    }

    if (action === null) {
      return this._methods.indexOf(method) !== -1;
    }

    if (action === true) {
      this._methods.push(method);
    } else if (action === false) {
      this._methods.splice(this._methods.indexOf(method), 1);
    }

    return this;
  }

  match(name = null, value = null) {
    if (name === null) {
      return this._match;
    }

    if (value === null) {
      return typeof this._match[name] === 'undefined' ?
        null : this._match[name];
    }

    this._match[name] = value;
    return this;
  }

  address() {
    const address = this._headers['x-real-ip'];
    const port = this._headers['x-real-port'];

    if (typeof address === 'undefined') {
      return this._connection.address();
    }

    return {
      address,
      port
    };
  }

  decoder() {
    this._setUp();
    return this._decoder;
  }

  error(message) {
    return new ScolaError(message);
  }

  uid() {
    const user = this._connection.user();
    return user && user.id() || null;
  }

  toJSON() {
    return {
      address: this.address(),
      headers: this._headers,
      method: this._method,
      path: this._path,
      query: this._query
    };
  }

  _bindRequest() {
    if (this._request) {
      this._request.setMaxListeners(this._request.getMaxListeners() + 1);
      this._request.on('error', this._handleError);
    }
  }

  _unbindRequest() {
    if (this._request) {
      this._request.setMaxListeners(this._request.getMaxListeners() - 1);
      this._request.removeListener('error', this._handleError);
    }
  }

  _bindDecoder() {
    if (this._decoder) {
      this._decoder.setMaxListeners(this._decoder.getMaxListeners() + 1);
      this._decoder.on('data', this._handleData);
      this._decoder.on('error', this._handleError);
      this._decoder.once('end', this._handleEnd);
    }
  }

  _unbindDecoder() {
    if (this._decoder) {
      this._decoder.setMaxListeners(this._decoder.getMaxListeners() - 1);
      this._decoder.removeListener('data', this._handleData);
      this._decoder.removeListener('end', this._handleEnd);
      this._decoder.removeListener('error', this._handleError);
    }
  }

  _read() {
    this._log('ServerRequest _read');

    if (this._codec === null) {
      this.emit('error', this.error('415 invalid_request'));
      return;
    }

    if (this._request) {
      this.decoder().resume();
    }
  }

  _data(data) {
    this._log('ServerRequest _data data=%j', data);

    const more = this.push(data);

    if (more === false && this._decoder) {
      this._decoder.pause();
    }
  }

  _end() {
    this._log('ServerRequest _end');
    this._tearDown();
  }

  _error(error) {
    this.emit('error', this.error('400 invalid_request ' + error));
  }

  _setUp() {
    if (this._decoder) {
      return this._decoder;
    }

    this._decoder = this._request;

    if (Boolean(this._codec) === true) {
      this._decoder = this._codec
        .decoder(this._request, this._connection, this);
    }

    this._bindDecoder();
    return this._decoder;
  }

  _tearDown(abort = false) {
    if (this._decoder && this._decoder !== this._request) {
      this._decoder.end();
    }

    this._unbindDecoder();

    if (abort === true) {
      this.emit('abort');
    }

    this.push(null);
  }
}
