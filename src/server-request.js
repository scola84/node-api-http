import { Readable } from 'stream';
import { parse as parseUrl } from 'url';
import { ScolaError } from '@scola/error';
import parseHeader from './helper/parse-header';

export default class ServerRequest extends Readable {
  constructor(request) {
    super({
      objectMode: true
    });

    const parsedUrl = parseUrl(request.url, true);
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

    this._transformers = new Map();
  }

  getHeader(name, parse) {
    const header = this.headers[name] || this.headers[name.toLowerCase()];
    return header && parse ? parseHeader(header) : header;
  }

  getTransformer(name) {
    return this._transformers.get(name);
  }

  setTransformer(name, transformer) {
    transformer.once('error', (error) => {
      this.emit('error', new ScolaError('400 invalid_request ' + error.message));
    });

    this._transformers.set(name, transformer);
    return this;
  }

  hasTransformer(name) {
    return this._transformers.has(name);
  }

  removeTransformer(name) {
    this._transformers.delete(name);
  }

  clear() {
    this._transformers.clear();
  }

  _read() {
    let i = 0;
    const transformers = [...this._transformers.values()];

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
