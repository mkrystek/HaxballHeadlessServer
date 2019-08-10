const path = require('path');
const WebpackUserscript = require('webpack-userscript');
const WrapperPlugin = require('wrapper-webpack-plugin');

const dev = process.env.NODE_ENV === 'development';

module.exports = {
  mode: dev ? 'development' : 'production',
  entry: path.resolve(__dirname, 'src', 'index.js'),
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  node: {
    fs: 'empty',
  },
  plugins: [
    new WebpackUserscript({
      pretty: false,
      headers: {
        updateURL: 'https://raw.githubusercontent.com/Xylem/HaxballHeadlessServer/master/dist/main.meta.js',
        downloadURL: 'https://raw.githubusercontent.com/Xylem/HaxballHeadlessServer/master/dist/main.user.js',
        match: 'https://*.haxball.com/headless',
        name: 'Haxball Headless Server',
        version: dev ? '[version]-build.[buildNo]' : '[version]',
      },
    }),
    new WrapperPlugin({
      test: /\.js$/, // only wrap output of bundle files with '.js' extension
      header: 'function main() {\n',
      footer: '\n}\n'
        + 'const script = document.createElement(\'script\');\n'
        + 'script.textContent = \'(\' + main.toString() + \')();\';\n'
        + 'document.body.appendChild(script);',
    }),
  ],
};
