import { Writable } from 'stream';
import Writer from './helper/writer';

export default class ServerResponse extends Writable {
  constructor() {
    super({
      objectMode: true
    });

    this._connection = null;
    this._response = null;
    this._codec = null;
    this._writer = null;
    this._encoder = null;

    this.once('finish', () => {
      this._response.end();
    });
  }

  destroy(error) {
    if (this._writer) {
      this._writer.end();
    }

    if (error) {
      this.emit('error', error);
    }
  }

  connection(value = null) {
    if (value === null) {
      return this._connection;
    }

    this._connection = value;
    return this;
  }

  response(value = null) {
    if (value === null) {
      return this._response;
    }

    this._response = value;
    return this;
  }

  codec(value = null) {
    if (value === null) {
      return this._codec;
    }

    this._codec = value;
    return this;
  }

  status(value = null) {
    if (value === null) {
      return this._response.statusCode;
    }

    this._response.statusCode = value;
    return this;
  }

  header(name = null, value = null) {
    if (name === null) {
      return this._response.headers;
    }

    if (value === null) {
      return this._response.getHeader(name);
    }

    if (value === false) {
      this._response.removeHeader(name);
      return this;
    }

    this._response.setHeader(name, value);
    return this;
  }

  encoder(writer) {
    return this._codec &&
      this._codec.encoder(writer, this._connection) ||
      writer;
  }

  end(data, encoding, callback) {
    this._response._writeOnEnd = true;
    super.end(data, encoding, callback);
  }

  _write(data, encoding, callback) {
    this._instance().write(data, encoding, callback);
  }

  _instance() {
    if (this._writer) {
      return this._writer;
    }

    this._writer = new Writer();
    this._encoder = this.encoder(this._writer);
    this._encoder.pipe(this._response);

    return this._writer;
  }
}
