import strings from './src/i18n/strings';

export { default as HttpConnection } from './src/connection';
export { default as HttpConnector } from './src/connector';
export { default as ServerRequest } from './src/server-request';
export { default as ServerResponse } from './src/server-response';
export { default as Writer } from './src/helper/writer';
export { default as parseHeader } from './src/helper/parse-header';

export function load(i18n) {
  i18n.strings(strings);
}
