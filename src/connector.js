import { EventEmitter } from 'events';
import Connection from './connection';
import ServerRequest from './server-request';
import ServerResponse from './server-response';

export default class HttpConnector extends EventEmitter {
  constructor() {
    super();

    this._server = null;
    this._router = null;

    this._handleError = (e) => this._error(e);
    this._handleRequest = (rq, rs) => this._request(rq, rs);
  }

  close() {
    this._unbindServer();
  }

  server(value = null) {
    if (value === null) {
      return this._server;
    }

    this._server = value;
    this._bindServer();

    return this;
  }

  router(value = null) {
    if (value === null) {
      return this._router;
    }

    this._router = value;
    return this;
  }

  _bindServer() {
    if (this._server) {
      this._server.addListener('error', this._handleError);
      this._server.addListener('request', this._handleRequest);
    }
  }

  _unbindServer() {
    if (this._server) {
      this._server.removeListener('error', this._handleError);
      this._server.removeListener('request', this._handleRequest);
    }
  }

  _error(error) {
    this.emit('error', error);
  }

  _request(request, response) {
    const connection = new Connection()
      .socket(request.connection);

    request = new ServerRequest()
      .connection(connection)
      .request(request);

    response = new ServerResponse()
      .connection(connection)
      .response(response);

    this._router.handleRequest(request, response);
  }
}
