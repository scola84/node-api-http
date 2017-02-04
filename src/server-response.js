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

    this._handleFinish = () => this._finish();
    this._bind();
  }

  destroy(abort = false) {
    if (this._writer) {
      this._writer.end();
    }

    if (this._response) {
      this._response.destroy();
    }

    this._unbind();

    if (abort === true) {
      this.emit('abort');
    }

    this.end();

    this._connection = null;
    this._response = null;
    this._writer = null;
    this._encoder = null;
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
    this._response._writes = 0;
    this._response._ended = false;

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

  end(data, encoding, callback) {
    this._response._ended = true;
    super.end(data, encoding, callback);
  }

  write(data, encoding, callback) {
    this._response._writes += 1;
    super.write(data, encoding, callback);
  }

  _bind() {
    this.once('finish', this._handleFinish);
  }

  _unbind() {
    this.removeListener('finish', this._handleFinish);
  }

  _write(data, encoding, callback) {
    this._instance().write(data, encoding, callback);
  }

  _finish() {
    this._response.end(() => {
      this.destroy();
    });
  }

  _instance() {
    if (this._writer) {
      return this._writer;
    }

    this._writer = new Writer();
    this._encoder = this._codec &&
      this._codec.encoder(this._writer, this._connection) ||
      this._writer;

    this._encoder.pipe(this._response);
    return this._writer;
  }
}
