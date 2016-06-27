import EventEmitter from '@scola/events';
import ServerRequest from './server-request';
import ServerResponse from './server-response';

export default class Connector extends EventEmitter {
  constructor(server, router) {
    super();

    this._server = server;
    this._router = router;

    this._bindServer();
  }

  close(callback) {
    this._unbindServer();
    callback();
  }

  _bindServer() {
    this.bind(this._server, 'error', this._handleError);
    this.bind(this._server, 'request', this._handleRequest);
  }

  _unbindServer() {
    this.unbind(this._server, 'error', this._handleError);
    this.unbind(this._server, 'request', this._handleRequest);
  }

  _handleError(error) {
    this.emit('error', error);
  }

  _handleRequest(request, response) {
    request = new ServerRequest(request);
    response = new ServerResponse(response);

    this._router.handleRequest(request, response);
  }
}
