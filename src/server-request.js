import { Duplex } from 'stream';
import { parse as parseUrl } from 'url';
import parseQuery from 'qs/lib/parse';
import parseHeader from './helper/parse-header';

export default class ServerRequest extends Duplex {
  constructor() {
    super({
      objectMode: true
    });

    this._connection = null;
    this._request = null;
    this._codec = null;

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

    value.pipe(this);

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
    const header = this._headers[name] ||
      this._headers[name.toLowerCase()];

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

  decoder(writer) {
    return this._codec &&
      this._codec.decoder(writer, this._connection, this) ||
      writer;
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

  _read() {
    console.log('_read');

  }

  _write(data, encoding, callback) {
    console.log('_write', data);
    this.push(data);
    callback();
  }
}
