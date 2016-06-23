import { Readable } from 'stream';
import { parse as parseUrl } from 'url';
import parseHeader from './helper/parse-header';

export default class ServerRequest extends Readable {
  constructor(request) {
    super({
      objectMode: true
    });

    const parsedUrl = parseUrl(request.url);
    const [path, version = ''] = parsedUrl.pathname.split('@');

    this.request = request;
    this.connection = this.request.connection;

    this.method = this.request.method;
    this.url = this.request.url;
    this.headers = this.request.headers;

    this.path = path;
    this.version = version;
    this.query = parsedUrl.query;
    this.params = {};

    this.allowedMethods = [];

    this.matchedPath = null;
    this.matchedMethod = null;
    this.matchedVersion = null;

    this.transformers = new Map();
  }

  getHeader(name, parse) {
    const header = this.headers[name] || this.headers[name.toLowerCase()];
    return header && parse ? parseHeader(header) : header;
  }

  getTransformer(name) {
    return this.transformers.get(name);
  }

  setTransformer(name, transformer) {
    transformer.once('error', (error) => {
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
    let i = 0;
    const transformers = [...this.transformers.values()];

    transformers.unshift(this.request);

    for (; i < transformers.length - 1; i += 1) {
      transformers[i].pipe(transformers[i + 1]);
    }

    transformers.pop().once('data', (object) => {
      this.push(object);
      this.push(null);
    });
  }
}
