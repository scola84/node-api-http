import get from 'lodash-es/get';
import set from 'lodash-es/set';
import { Writable } from 'stream';
import { debuglog } from 'util';
import { ScolaError } from '@scola/error';
import Writer from './helper/writer';

export default class ServerResponse extends Writable {
  constructor() {
    super({
      objectMode: true
    });

    this._log = debuglog('http');

    this._connection = null;
    this._response = null;
    this._responseData = {};
    this._codec = null;
    this._writer = null;
    this._encoder = null;

    this._handleError = (e) => this._error(e);
    this._handleFinish = () => this._finish();

    this._bindThis();
  }

  destroy(abort) {
    this._log('ServerResponse destroy abort=%s', abort);

    if (this._response) {
      this._unbindResponse();
      this._response.destroy();
    }

    this._tearDown(abort);
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
    this._bindResponse();

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
      return this._response._headers;
    }

    if (this._response === null) {
      return this;
    }

    if (value === null) {
      const header = this._response.getHeader(name);
      return typeof header === 'undefined' ?
        null : header;
    }

    if (value === false) {
      this._response.removeHeader(name);
      return this;
    }

    this._response.setHeader(name, value);
    return this;
  }

  data(value = null) {
    if (value === null) {
      return this._responseData;
    }

    this._responseData = value;
    return this;
  }

  datum(name, value = null) {
    if (value === null) {
      const datum = get(this._responseData, name);
      return typeof datum === 'undefined' ? null : datum;
    }

    set(this._responseData, name, value);
    return this;
  }

  end(data, encoding, callback) {
    this._log('ServerResponse end data=%j', data);

    if (this._response) {
      this._response._ended = true;
      super.end(data, encoding, callback);

      if (typeof data === 'undefined') {
        this.emit('respond');
      }
    }
  }

  write(data, encoding, callback) {
    this._log('ServerResponse write data=%j', data);

    if (this._response) {
      this._response._writes += 1;
      super.write(data, encoding, callback);
      this.emit('respond');
    }
  }

  error(message) {
    return new ScolaError(message);
  }

  timestamp() {
    return Math.round(Date.now() / 1000);
  }

  _bindThis() {
    this.setMaxListeners(this.getMaxListeners() + 1);
    this.on('finish', this._handleFinish);
  }

  _unbindThis() {
    this.setMaxListeners(this.getMaxListeners() - 1);
    this.removeListener('finish', this._handleFinish);
  }

  _bindResponse() {
    if (this._response) {
      this._response.setMaxListeners(this._response.getMaxListeners() + 1);
      this._response.on('error', this._handleError);
    }
  }

  _unbindResponse() {
    if (this._response) {
      this._response.setMaxListeners(this._response.getMaxListeners() - 1);
      this._response.removeListener('error', this._handleError);
    }
  }

  _write(data, encoding, callback) {
    this._log('ServerResponse _write data=%j', data);

    if (this._response) {
      this._setUp().write(data, encoding, callback);
    }
  }

  _error(error) {
    this.emit('error', error);
  }

  _finish() {
    this._log('ServerResponse _finish');

    if (this._response) {
      this._response.end(() => {
        this._tearDown();
      });
    }
  }

  _setUp() {
    if (this._writer) {
      return this._writer;
    }

    this._writer = new Writer();
    this._encoder = this._codec ?
      this._codec.encoder(this._writer, this._connection) :
      this._writer;

    this._encoder
      .pipe(this._response);

    return this._writer;
  }

  _tearDown(abort = false) {
    if (this._writer) {
      this._writer.end();
    }

    this._unbindThis();

    if (abort === true) {
      this.emit('abort');
    }

    this.end();
  }
}
