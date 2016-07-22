import EventEmitter from 'events';
import ServerRequest from './server-request';
import ServerResponse from './server-response';

export default class Connector extends EventEmitter {
  constructor(server, router) {
    super();

    this._server = server;
    this._router = router;

    this._handleError = (e) => this._error(e);
    this._handleRequest = (rq, rs) => this._request(rq, rs);

    this._bindServer();
  }

  close(callback) {
    this._unbindServer();
    callback();
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
