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
    const header = this._headers[name] ||
      this._headers[name.toLowerCase()];

    if (typeof header === 'undefined') {
      return parse === true ? {} : null;
    }

    return parse === true ? parseHeader(header) : header;
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
      this._decoder.setMaxListeners(this._decoder.getMaxListeners() + 1);
      this._decoder.on('data', this._handleData);
      this._decoder.on('end', this._handleEnd);
    }
  }

  _unbindDecoder() {
    if (this._decoder) {
      this._decoder.setMaxListeners(this._decoder.getMaxListeners() - 1);
      this._decoder.removeListener('data', this._handleData);
      this._decoder.removeListener('end', this._handleEnd);
    }
  }

  _read() {
    this._log('ClientResponse _read');
    this._setUp().resume();
  }

  _data(data) {
    this._log('ClientResponse _data data=%j', data);

    const more = this.push(data);

    if (more === false && this._decoder) {
      this._decoder.pause();
    }
  }

  _end() {
    this._log('ClientResponse _end');
    this._tearDown();
  }

  _setUp() {
    const type = this._response.headers['content-type'] || '';
    const codec = this._connection.codec() || {};

    if (type.indexOf(codec.type) === -1) {
      this.push('500 invalid_response ' + this._response.statusMessage);
      return this._response;
    }

    if (this._decoder) {
      return this._decoder;
    }

    this._decoder = this._connection
      .decoder(this._response, this);

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
