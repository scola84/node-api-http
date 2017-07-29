import { EventEmitter } from 'events';
import { debuglog } from 'util';
import Connection from './connection';
import ServerRequest from './server-request';
import ServerResponse from './server-response';

export default class HttpConnector extends EventEmitter {
  constructor() {
    super();

    this._log = debuglog('http');

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
      this._server.setMaxListeners(this._server.getMaxListeners() + 1);
      this._server.on('error', this._handleError);
      this._server.on('request', this._handleRequest);
    }
  }

  _unbindServer() {
    if (this._server) {
      this._server.setMaxListeners(this._server.getMaxListeners() - 1);
      this._server.removeListener('error', this._handleError);
      this._server.removeListener('request', this._handleRequest);
    }
  }

  _error(error) {
    this.emit('error', error);
  }

  _request(request, response) {
    this._log('Connector _request method=%s url=%s',
      request.method, request.url);

    const connection = new Connection()
      .address(request.connection.address());

    request = new ServerRequest()
      .connection(connection)
      .request(request);

    response = new ServerResponse()
      .connection(connection)
      .response(response);

    this._router.handleRequest(request, response);
  }
}
