import { Readable } from 'stream';
import { parse as parseUrl } from 'url';
import parseQuery from 'qs/lib/parse';
import { ScolaError } from '@scola/error';
import parseHeader from './helper/parse-header';

export default class ServerRequest extends Readable {
  constructor() {
    super({
      objectMode: true
    });

    this._connection = null;
    this._request = null;

    this._method = null;
    this._url = null;
    this._headers = null;
    this._path = null;
    this._version = null;
    this._query = {};
    this._params = {};
    this._data = null;

    this._methods = [];
    this._match = {};

    this._transformers = new Map();
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

    this.method(this._request.method);
    this.url(this._request.url);
    this.headers(this._request.headers);

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
    this._query = parseQuery(parsedUrl.query);

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
    const header = this._headers[name] || this._headers[name.toLowerCase()];
    return header && parse ? parseHeader(header) : header;
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

  param(name) {
    return this._params[name];
  }

  query(name = null) {
    if (name === null) {
      return this._query;
    }

    return this._query[name];
  }

  data(value = null) {
    if (value === null) {
      return this._data;
    }

    this._data = value;
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
      return this._match[name];
    }

    this._match[name] = value;
    return this;
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

  transformer(name = null, value = null) {
    if (name === null) {
      return this._transformers;
    }

    if (name === false) {
      this._transformers.clear();
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
      this._removeAllListeners();
      this.push(null);
    });
  }

  _removeAllListeners() {
    this._transformers.forEach((transformer) => {
      transformer.removeAllListeners();
    });
  }
}
