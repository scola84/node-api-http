import { Readable } from 'stream';
import { parse as parseUrl } from 'url';
import { debuglog } from 'util';
import parseQuery from 'qs/lib/parse';
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
    this._requestData = null;

    this._methods = [];
    this._match = {};

    this._handleData = (d) => this._data(d);
    this._handleEnd = () => this._end();
    this._handleError = (e) => this._error(e);
  }

  destroy(abort) {
    this._log('ServerRequest destroy %s', abort);

    if (this._request) {
      this._unbindRequest();
      this._request.destroy();
    }

    this._tearDown(abort);

    this._connection = null;
    this._request = null;
    this._decoder = null;
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
      return this._requestData;
    }

    this._requestData = value;
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
    if (this._headers['x-real-ip']) {
      return {
        address: this._headers['x-real-ip'],
        port: this._headers['x-real-port']
      };
    }

    const parsedAddress = this._connection.address();

    return {
      address: parsedAddress.address,
      port: parsedAddress.port
    };
  }

  _bindRequest() {
    if (this._request) {
      this._request.on('error', this._handleError);
    }
  }

  _unbindRequest() {
    if (this._request) {
      this._request.removeListener('error', this._handleError);
    }
  }

  _bindDecoder() {
    if (this._decoder) {
      this._decoder.on('data', this._handleData);
      this._decoder.once('end', this._handleEnd);
    }
  }

  _unbindDecoder() {
    if (this._decoder) {
      this._decoder.removeListener('data', this._handleData);
      this._decoder.removeListener('end', this._handleEnd);
    }
  }

  _read() {
    this._log('ServerRequest _read');
    this._setUp().resume();
  }

  _data(data) {
    this._log('ServerRequest _data %j', data);

    const more = this.push(data);

    if (!more) {
      this._decoder.pause();
    }
  }

  _end() {
    this._log('ServerRequest _end');
    this._tearDown();
  }

  _error(error) {
    this.emit('error', error);
  }

  _setUp() {
    if (this._decoder) {
      return this._decoder;
    }

    this._decoder = this._codec ?
      this._codec.decoder(this._request, this._connection, this) :
      this._request;

    this._bindDecoder();
    return this._decoder;
  }

  _tearDown(abort = false) {
    if (this._decoder) {
      this._decoder.end();
    }

    this._unbindDecoder();

    if (abort === true) {
      this.emit('abort');
    }

    this.push(null);
  }
}
