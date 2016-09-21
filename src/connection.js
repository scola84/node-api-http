import { EventEmitter } from '@scola/events';
import ClientRequest from './client-request';

export default class Connection extends EventEmitter {
  constructor() {
    super();

    this._http = null;
    this._codec = null;
    this._host = null;
  }

  http(value) {
    if (typeof value === 'undefined') {
      return this._http;
    }

    this._http = value;
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

  port(value) {
    if (typeof value === 'undefined') {
      return this._port;
    }

    this._port = value;
    return this;
  }

  request() {
    return new ClientRequest()
      .connection(this)
      .codec(this._codec)
      .host(this._host)
      .port(this._port);
  }
}
