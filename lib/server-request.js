const stream = require('stream');
const url = require('url');

class ServerRequest extends stream.Readable {
  constructor(request) {
    super({
      objectMode: true
    });

    const parsedUrl = url.parse(request.url);
    const [path, version = ''] = parsedUrl.pathname.split('@');

    this.request = request;
    this.method = this.request.method;
    this.url = this.request.url;
    this.headers = this.request.headers;

    this.path = path;
    this.version = version;
    this.query = parsedUrl.query;
    this.params = {};

    this.address = this.request.connection.remoteAddress +
      ':' + this.request.connection.remotePort;

    this.allowedMethods = [];

    this.matchedPath = null;
    this.matchedMethod = null;
    this.matchedVersion = null;

    this.transformers = new Map();
  }

  getHeader(name) {
    return this.headers[name] || this.headers[name.toLowerCase()];
  }

  getTransformer(name) {
    return this.transformers.get(name);
  }

  setTransformer(name, transformer) {
    transformer.on('error', (error) => {
      this.emit('error', new Error('400 ' + error.message));
    });

    this.transformers.set(name, transformer);
    return this;
  }

  hasTransformer(name) {
    return this.transformers.has(name);
  }

  removeTransformer(name) {
    this.transformers.delete(name);
  }

  clear() {
    this.transformers.clear();
  }

  _read() {
    try {
      this._transform();
    } catch (error) {
      this.emit('error', new Error('400 ' + error.message));
    }
  }

  _transform() {
    let i = 0;
    const transformers = [...this.transformers.values()];

    transformers.unshift(this.request);

    for (; i < transformers.length - 1; i += 1) {
      transformers[i].pipe(transformers[i + 1]);
    }

    transformers.pop().on('data', (object) => {
      this.push(object);
      this.push(null);
    });
  }
}

module.exports = ServerRequest;
