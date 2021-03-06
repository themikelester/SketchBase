/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const webpack = require( 'webpack' );
const merge = require( 'webpack-merge' );
const common = require( './webpack.common.js' );

module.exports = merge( common, {
  mode: 'production',
  devtool: false,
  output: {
    filename: '[name].[contentHash].js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin( {
      'process.env.NODE_ENV': JSON.stringify( 'production' ),
    } ),
  ],
} );
