import { Readable } from 'stream';
import { debuglog } from 'util';
import parseHeader from './helper/parse-header';

export default class ClientResponse extends Readable {
  constructor() {
    super({
      objectMode: true
    });

    this._log = debuglog('http');

    this._connection = null;
    this._response = null;
    this._decoder = null;
    this._responseData = null;

    this._handleData = (d) => this._data(d);
    this._handleEnd = () => this._end();
  }

  destroy() {
    this._log('ClientResponse destroy');
    this._tearDown();

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
    this._log('ClientResponse _read');
    this._setUp().resume();
  }

  _data(data) {
    this._log('ClientResponse _data %j', data);

    const more = this.push(data);

    if (!more) {
      this._decoder.pause();
    }
  }

  _end() {
    this._log('ClientResponse _end');
    this._tearDown();
  }

  _setUp() {
    if (this._decoder) {
      return this._decoder;
    }

    this._decoder = this._connection
      .decoder(this._response);

    this._bindDecoder();
    return this._decoder;
  }

  _tearDown() {
    if (this._decoder) {
      this._decoder.end();
    }

    this._unbindDecoder();
    this.push(null);
  }
}
