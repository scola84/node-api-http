import { Duplex } from 'stream';

export default class Writer extends Duplex {
  constructor() {
    super({
      objectMode: true
    });
  }

  _read() {}

  _write(data, encoding, callback) {
    this.push(data);
    callback();
  }
}
