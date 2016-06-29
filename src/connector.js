import EventEmitter from 'events';
import { bind, unbind } from '@scola/bind';
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
    bind(this, this._server, 'error', this._handleError);
    bind(this, this._server, 'request', this._handleRequest);
  }

  _unbindServer() {
    unbind(this, this._server, 'error', this._handleError);
    unbind(this, this._server, 'request', this._handleRequest);
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
