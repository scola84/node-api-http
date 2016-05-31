import EventEmitter from '@scola/events';
import ServerRequest from './server-request';
import ServerResponse from './server-response';

export default class Connector extends EventEmitter {
  constructor(server, router) {
    super();

    this.server = server;
    this.router = router;

    this.bindServer();
  }

  close(callback) {
    this.unbindServer();
    callback();
  }

  bindServer() {
    this.bind(this.server, 'error', this.handleError);
    this.bind(this.server, 'request', this.handleRequest);
  }

  unbindServer() {
    this.unbind(this.server, 'error', this.handleError);
    this.unbind(this.server, 'request', this.handleRequest);
  }

  handleError(error) {
    this.emit('error', error);
  }

  handleRequest(request, response) {
    request = new ServerRequest(request);
    response = new ServerResponse(response);

    this.router.handleRequest(request, response);
  }
}
