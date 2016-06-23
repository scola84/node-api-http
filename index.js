export { default as ServerRequest } from './src/server-request';
export { default as ServerResponse } from './src/server-response';

import Connector from './src/connector';
export { Connector };

export function connector(server, router) {
  return new Connector(server, router);
}
