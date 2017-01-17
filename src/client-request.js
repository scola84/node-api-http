import formatQuery from 'qs/lib/stringify';
import { EventEmitter } from 'events';
import ClientResponse from './client-response';

export default class ClientRequest extends EventEmitter {
  constructor() {
    super();

    this._connection = null;
    this._host = null;
    this._port = null;
    this._method = 'GET';
    this._path = '/';
    this._query = {};
    this._headers = {};
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

  end(data = null, callback = () => {}) {
    const user = this._connection.user();
    const headers = Object.assign({}, this._headers);

    if (this._method !== 'GET') {
      headers['Content-Type'] = this._codec.type;
    }

    if (user) {
      headers.Authorization = 'Bearer ' + user.token();
    }

    const query = formatQuery(this._query);
    const request = this._connection.http().request({
      host: this._host,
      headers,
      method: this._method,
      path: this._path + (query ? '?' + query : ''),
      port: this._port,
      withCredentials: false
    }, (response) => {
      response = this._response(response);

      if (response.status() > 0) {
        request.removeAllListeners();
      }

      callback(response);
    });

    request.once('error', (error) => {
      request.removeAllListeners();
      this.emit('error', error);
    });

    if (data === null) {
      request.end();
      return this;
    }

    const encoder = this._connection
      .codec()
      .encoder();

    encoder.once('error', (error) => {
      request.removeAllListeners();
      encoder.removeAllListeners();
      this.emit('error', error);
    });

    encoder.once('data', (encodedData) => {
      encoder.removeAllListeners();
      request.end(encodedData);
    });

    encoder.end(data);
    return this;
  }

  _response(response) {
    return new ClientResponse()
      .connection(this._connection)
      .response(response);
  }
}
