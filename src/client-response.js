import { Readable } from 'stream';
import parseHeader from './helper/parse-header';

export default class ClientResponse extends Readable {
  constructor() {
    super({
      objectMode: true
    });

    this._connection = null;
    this._response = null;
    this._decoder = null;
    this._headers = {};
    this._responseData = null;

    this._handleData = (d) => this._data(d);
    this._handleEnd = () => this._end();
  }

  destroy() {
    if (this._decoder) {
      this._decoder.end();
    }

    this._unbindDecoder();
    this.push(null);

    this._connection = null;
    this._response = null;
    this._decoder = null;
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

  status() {
    return this._response.statusCode;
  }

  header(name, parse = false) {
    const header = this._response.headers[name.toLowerCase()];
    return header && parse ? parseHeader(header) : header;
  }

  data(value = null) {
    if (value === null) {
      return this._responseData;
    }

    this._responseData = value;
    return this;
  }

  _bindDecoder() {
    if (this._decoder) {
      this._decoder.on('data', this._handleData);
      this._decoder.once('end', this._handleEnd);
    }
  }

  _unbindDecoder() {
    if (this._decoder) {
      this._decoder.removeListener('data', this._handleData);
      this._decoder.removeListener('end', this._handleEnd);
    }
  }

  _read() {
    this._instance().resume();
  }

  _instance() {
    if (this._decoder) {
      return this._decoder;
    }

    this._decoder = this._connection.decoder(this._response);

    this._bindDecoder();
    return this._decoder;
  }

  _data(data) {
    const more = this.push(data);

    if (!more) {
      this._decoder.pause();
    }
  }

  _end() {
    this.destroy();
  }
}
