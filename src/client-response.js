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
    this._data = null;
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
      return this._data;
    }

    this._data = value;
    return this;
  }

  _read() {
    if (!this._decoder) {
      this._decoder = this._instance();
    }
  }

  _instance() {
    const decoder = this._connection.decoder(this._response);

    decoder.on('data', (data) => {
      this.push(data);
    });

    decoder.once('end', () => {
      this.push(null);
    });

    return decoder;
  }
}
