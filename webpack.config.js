const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
// const ExtensionReloader = require('webpack-extension-reloader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const options = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    background: path.join(__dirname, 'src', 'background/index.ts'),
  },
  output: {
    path: path.join(__dirname, 'build'),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'awesome-typescript-loader' },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
  plugins: [
    // new ExtensionReloader({
    //   entries: {
    //     contentScript: 'content',
    //     background: 'background',
    //     optionsScript: 'options',
    //     extensionPage: ['popup', 'options'],
    //   },
    // }),
    new MiniCssExtractPlugin(),
    new CopyWebpackPlugin([
      { from: path.join(__dirname, 'src', 'manifest.json') },
      { from: path.join(__dirname, 'src', 'background.html') },
    ]),
  ],
};

if (process.env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-eval-source-map';
}

module.exports = options;
