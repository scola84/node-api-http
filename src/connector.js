import { EventEmitter } from '@scola/events';
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

  server(value) {
    this._server = value;
    this._bindServer();

    return this;
  }

  router(value) {
    this._router = value;
    return this;
  }

  _bindServer() {
    this._server.addListener('error', this._handleError);
    this._server.addListener('request', this._handleRequest);
  }

  _unbindServer() {
    this._server.removeListener('error', this._handleError);
    this._server.removeListener('request', this._handleRequest);
  }

  _error(error) {
    this.emit('error', error);
  }

  _request(request, response) {
    request = new ServerRequest(request);
    response = new ServerResponse(response);

    this._router.handleRequest(request, response);
  }
}
