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
    this._request = null;

    this._host = null;
    this._port = null;
    this._method = 'GET';
    this._path = '/';
    this._query = {};
    this._headers = {};

    this._handleFinish = () => this._finish();
    this._bindThis();
  }

  destroy() {
    this._tearDown();

    this._connection = null;
    this._writer = null;
    this._encoder = null;
    this._request = null;
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

  _bindThis() {
    this.once('finish', this._handleFinish);
  }

  _unbindThis() {
    this.removeListener('finish', this._handleFinish);
  }

  _write(data, encoding, callback) {
    this._setupWriter().write(data, encoding, callback);
  }

  _finish() {
    this._setupRequest().end(() => {
      this._tearDown();
    });
  }

  _setupWriter() {
    if (this._writer) {
      return this._writer;
    }

    this._writer = new Writer();
    this._encoder = this._connection
      .encoder(this._writer);

    this._encoder
      .pipe(this._setupRequest());

    return this._writer;
  }

  _setupRequest() {
    if (this._request) {
      return this._request;
    }

    const user = this._connection.user();
    const headers = Object.assign({}, this._headers);
    const query = formatQuery(this._query, {
      allowDots: true,
      arrayFormat: 'repeat'
    });

    if (this._method !== 'GET' && this._connection.codec()) {
      headers['Content-Type'] = this._connection.codec().type;
    }

    if (user) {
      headers.Authorization = 'Bearer ' + user.token();
    }

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
      this.emit('response', new ClientResponse()
        .connection(this._connection)
        .response(response));
    });

    return this._request;
  }

  _tearDown() {
    if (this._writer) {
      this._writer.end();
    }

    this._unbindThis();
    this.end();
  }
}
