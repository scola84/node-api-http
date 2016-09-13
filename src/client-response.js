import { Duplex } from 'stream';
import parseHeader from './helper/parse-header';

export default class ClientResponse extends Duplex {
  constructor() {
    super({
      objectMode: true
    });

    this._connection = null;
    this._codec = null;
    this._response = null;

    this._status = null;
    this._headers = {};
  }

  connection(value) {
    if (typeof value === 'undefined') {
      return this._connection;
    }

    this._connection = value;
    return this;
  }

  codec(value) {
    if (typeof value === 'undefined') {
      return this._codec;
    }

    this._codec = value;
    return this;
  }

  response(value) {
    if (typeof value === 'undefined') {
      return this._response;
    }

    this._response = value;

    if (this.status() < 300) {
      const Decoder = this._codec.Decoder;
      const decoder = new Decoder();

      this._response
        .pipe(decoder)
        .pipe(this);
    } else {
      this._response.pipe(this);
    }

    return this;
  }

  status() {
    return this._response.statusCode;
  }

  header(name, parse) {
    const header = this._response.headers[name.toLowerCase()];
    return header && parse ? parseHeader(header) : header;
  }

  _write(data) {
    this.push(data);
    this.push(null);
  }

  _read() {}
}
