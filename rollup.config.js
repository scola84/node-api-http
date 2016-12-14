import buble from 'rollup-plugin-buble';

export default {
  dest: './dist/api-http.js',
  entry: 'index.js',
  format: 'cjs',
  external: [
    '@scola/core',
    'events',
    'qs/lib/parse',
    'qs/lib/stringify',
    'stream',
    'url'
  ],
  plugins: [
    buble()
  ]
};
