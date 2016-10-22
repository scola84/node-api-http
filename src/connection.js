import { EventEmitter } from 'events';
import ClientRequest from './client-request';

export default class HttpConnection extends EventEmitter {
  constructor() {
    super();

    this._codec = null;
    this._socket = null;
    this._user = null;

    this._http = null;
    this._host = null;
    this._port = null;
  }

  codec(value) {
    if (typeof value === 'undefined') {
      return this._codec;
    }

    this._codec = value;
    return this;
  }

  socket(value) {
    if (typeof value === 'undefined') {
      return this._socket;
    }

    this._socket = value;
    return this;
  }

  user(value) {
    if (typeof value === 'undefined') {
      return this._user;
    }

    this._user = value;
    return this;
  }

  http(value) {
    if (typeof value === 'undefined') {
      return this._http;
    }

    this._http = value;
    return this;
  }

  host(value) {
    if (typeof value === 'undefined') {
      return this._host;
    }

    this._host = value;
    return this;
  }

  port(value) {
    if (typeof value === 'undefined') {
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
      .codec(this._codec)
      .host(this._host)
      .port(this._port);
  }
}
