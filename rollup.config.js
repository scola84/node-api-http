import buble from 'rollup-plugin-buble';
import resolve from 'rollup-plugin-node-resolve';

export default {
  dest: './dist/api-http.js',
  entry: 'index.js',
  format: 'cjs',
  external: [
    '@scola/error',
    'events',
    'querystring',
    'stream',
    'url'
  ],
  plugins: [
    resolve({
      jsnext: true
    }),
    buble()
  ]
};
