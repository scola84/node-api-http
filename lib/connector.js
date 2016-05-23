const events = require('events');
const ServerRequest = require('./server-request');
const ServerResponse = require('./server-response');

class Connector extends events.EventEmitter {
  constructor(server, router) {
    super();

    this.server = server;
    this.router = router;

    this.server.on('error', this.handleError.bind(this));
    this.server.on('request', this.handleRequest.bind(this));
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

module.exports = Connector;
