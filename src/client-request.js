import formatQuery from 'qs/lib/stringify';
import { Writable } from 'stream';
import ClientResponse from './client-response';
import Writer from './helper/writer';

export default class ClientRequest extends Writable {
  constructor() {
    super({
      objectMode: true
    });

    this._connection = null;
    this._writer = null;
    this._encoder = null;

    this._host = null;
    this._port = null;
    this._method = 'GET';
    this._path = '/';
    this._query = {};
    this._headers = {};

    this.once('finish', () => {
      this._request.end();
    });
  }

  connection(value = null) {
    if (value === null) {
      return this._connection;
    }

    this._connection = value;
    return this;
  }

  host(value = null) {
    if (value === null) {
      return this._host;
    }

    this._host = value;
    return this;
  }

  port(value = null) {
    if (value === null) {
      return this._port;
    }

    this._port = value;
    return this;
  }

  method(value = null) {
    if (value === null) {
      return this._method;
    }

    this._method = value;
    return this;
  }

  path(value = null) {
    if (value === null) {
      return this._path;
    }

    this._path = value;
    return this;
  }

  query(value = null) {
    if (value === null) {
      return this._query;
    }

    this._query = value;
    return this;
  }

  header(name, value = null) {
    if (value === null) {
      return this._headers[name];
    }

    if (value === false) {
      delete this._headers[name];
      return this;
    }

    this._headers[name] = value;
    return this;
  }

  _write(data, encoding, callback) {
    this._instance().write(data, encoding, callback);
  }

  _instance() {
    if (this._writer) {
      return this._writer;
    }

    const user = this._connection.user();
    const headers = Object.assign({}, this._headers);

    if (this._method !== 'GET' && this._connection.codec()) {
      headers['Content-Type'] = this._connection.codec().type;
    }

    if (user) {
      headers.Authorization = 'Bearer ' + user.token();
    }

    const query = formatQuery(this._query);

    this._request = this._connection.http().request({
      host: this._host,
      headers,
      method: this._method,
      path: this._path + (query ? '?' + query : ''),
      port: this._port,
      withCredentials: false
    });

    this._request.once('error', (error) => {
      this.emit('error', error);
    });

    this._request.once('response', (response) => {
      this.emit('response', this._createResponse(response));
    });

    this._writer = new Writer();
    this._encoder = this._connection.encoder(this._writer);
    this._encoder.pipe(this._request);

    return this._writer;
  }

  _createResponse(response) {
    return new ClientResponse()
      .connection(this._connection)
      .response(response);
  }
}
