/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const webpack = require( 'webpack' );
const merge = require( 'webpack-merge' );
const common = require( './webpack.common.js' );
const cpus = require( 'os' ).cpus;
const ForkTsCheckerWebpackPlugin = require( 'fork-ts-checker-webpack-plugin' );

module.exports = merge( common, {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    contentBase: './dist',
    hotOnly: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          // Cache intermediate results
          { loader: 'cache-loader' },
          // Run ts-loader in parallel, leaving one CPU for checker
          {
            loader: 'thread-loader',
            options: {
              workers: cpus().length - 1,
              poolTimeout: Infinity, // Set to Infinity in watch mode
            },
          },
          {
            loader: 'ts-loader',
            options: {
              // Only do transpilation into JS, error checking is performed by ForkTsChecker
              happyPackMode: true,
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin( {
      'process.env.NODE_ENV': JSON.stringify( 'development' ),
    } ),
    // Run ts checker asynchronously
    new ForkTsCheckerWebpackPlugin( {
      async: false,
      eslint: {
        files: "./src/**/*.{ts,tsx,js,jsx}"
      },
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
      },
    } ),
  ],
} );
