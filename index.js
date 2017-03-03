import HttpConnection from './src/connection';
import HttpConnector from './src/connector';
import ServerRequest from './src/server-request';
import ServerResponse from './src/server-response';
import Writer from './src/helper/writer';
import parseHeader from './src/helper/parse-header';
import strings from './src/i18n/strings';

function load(app) {
  if (app.i18n()) {
    app.i18n().strings(strings);
  }
}

export {
  HttpConnection,
  HttpConnector,
  ServerRequest,
  ServerResponse,
  Writer,
  parseHeader,
  load
};
