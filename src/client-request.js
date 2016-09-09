import { stringify as formatQuery } from 'querystring';
import { EventEmitter } from '@scola/events';
import ClientResponse from './client-response';

export default class ClientRequest extends EventEmitter {
  constructor() {
    super();

    this._connection = null;
    this._codec = null;
    this._host = null;

    this._method = 'GET';
    this._path = '/';
    this._query = {};
    this._headers = {};
  }

  connection(value) {
    if (typeof value === 'undefined') {
      return this._connection;
    }

    this._connection = value;
    return this;
  }

  codec(value) {
    if (typeof value === 'undefined') {
      return this._codec;
    }

    this._codec = value;
    return this;
  }

  host(value) {
    if (typeof value === 'undefined') {
      return this._host;
    }

    this._host = value;
    return this;
  }

  method(value) {
    if (typeof value === 'undefined') {
      return this._method;
    }

    this._method = value;
    return this;
  }

  path(value) {
    if (typeof value === 'undefined') {
      return this._path;
    }

    this._path = value;
    return this;
  }

  query(value) {
    if (typeof value === 'undefined') {
      return this._query;
    }

    this._query = value;
    return this;
  }

  header(name, value) {
    if (typeof value === 'undefined') {
      return this._headers[name];
    }

    if (value === false) {
      delete this._headers[name];
      return this;
    }

    this._headers[name] = value;
    return this;
  }

  end(data, callback = () => {}) {
    const codec = this._connection.codec();

    const Encoder = codec.Encoder;
    const encoder = new Encoder();

    const headers = Object.assign({}, this._headers);

    if (this._method !== 'GET') {
      headers['Content-Type'] = codec.type;
    }

    const query = formatQuery(this._query);
    const request = this._connection.http().request({
      host: this._host,
      headers,
      method: this._method,
      path: this._path + (query ? '?' + query : ''),
      withCredentials: false
    }, (response) => {
      response = this._response(response);

      if (response.status() > 0) {
        request.removeAllListeners();
        encoder.removeAllListeners();
      }

      callback(response);
    });

    request.once('error', (error) => {
      request.removeAllListeners();
      encoder.removeAllListeners();
      this.emit('error', error);
    });

    encoder.once('error', (error) => {
      request.removeAllListeners();
      encoder.removeAllListeners();
      this.emit('error', error);
    });

    encoder.once('data', (encodedData) => {
      request.end(encodedData);
    });

    encoder.end(data);
    return this;
  }

  _response(response) {
    return new ClientResponse()
      .connection(this._connection)
      .codec(this._codec)
      .response(response);
  }
}
