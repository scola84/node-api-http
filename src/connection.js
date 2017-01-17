import { EventEmitter } from 'events';
import ClientRequest from './client-request';

export default class HttpConnection extends EventEmitter {
  constructor() {
    super();

    this._socket = null;
    this._http = null;
    this._codec = null;
    this._user = null;
    this._host = null;
    this._port = null;
  }

  socket(value = null) {
    if (value === null) {
      return this._socket;
    }

    this._socket = value;
    return this;
  }

  http(value = null) {
    if (value === null) {
      return this._http;
    }

    this._http = value;
    return this;
  }

  codec(value = null) {
    if (value === null) {
      return this._codec;
    }

    this._codec = value;
    return this;
  }

  user(value = null) {
    if (value === null) {
      return this._user;
    }

    this._user = value;
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

  address() {
    return this._socket.address();
  }

  request() {
    return new ClientRequest()
      .connection(this)
      .host(this._host)
      .port(this._port);
  }
}
