/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */

const GitRevisionPlugin = require( 'git-revision-webpack-plugin' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );
const CopyPlugin = require( 'copy-webpack-plugin' );
const SizePlugin = require( 'size-plugin' );
const BundleAnalyzerPlugin = require( 'webpack-bundle-analyzer' ).BundleAnalyzerPlugin;
const path = require( 'path' );
const webpack = require( 'webpack' );

// @NOTE: These need to be updated per-project
const COMMIT_HASH = new GitRevisionPlugin().commithash();
const GITHUB_URL = 'https://github.com/themikelester/SketchBase';
const GTAG_ID = '<Some Google Analytics ID>';
const APP_NAME = 'Base Sketch';
const APP_NAME_SHORT = 'Base';
const APP_DESCRIPTION = 'Sketch boilerplate';

module.exports = {
  entry: {
    main: './src/main.ts',
  },
  output: {
    path: path.resolve( __dirname, 'dist' ),
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
  },
  stats: 'minimal',
  module: {
    rules: [
      // The primary ts-loader rule is defined in dev and prod separately
      {
        test: /\.(png|.svg|woff2)$/,
        loader: 'file-loader',
        options: {
          name: '[name]-[sha1:hash:hex:20].[ext]',
        },
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: {
          loader: 'webpack-glsl-minify',
          options: {
            preserveDefines: true,
            preserveUniforms: true,
            preserveVariables: true,
          }
        }
      },
      {
        test: /\.worker\.ts$/,
        loader: 'worker-loader',
        exclude: /node_modules/,
        options: {
          name: '[name].[hash].js',
        }
      },
      {
        test: /\.webmanifest$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]'
            }
          },
          {
            loader: 'webmanifest-loader',
            options: {
              name: APP_NAME,
              shortName: APP_NAME_SHORT,
              description: APP_DESCRIPTION,
            }
          }
        ]
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin( {
      '__COMMIT_HASH': JSON.stringify( COMMIT_HASH ),
      '__GITHUB_URL': JSON.stringify( GITHUB_URL ),
    } ),
    new webpack.IgnorePlugin( {
      // Workaround for broken libraries
      resourceRegExp: /^(fs|path)$/,
    } ),
    new CleanWebpackPlugin( {
      cleanOnceBeforeBuildPatterns: [
        '**/*',
        '!data',
        '!data/**/*',
        '!.htaccess',
        '!.nojekyll',
      ],
    } ),
    new CopyPlugin( [
      { from: 'data', to: 'data' },
    ] ),
    new HtmlWebpackPlugin( {
      chunks: [ 'main' ],
      filename: 'index.html',
      template: './src/index.html',
      gtagId: GTAG_ID,
      appName: APP_NAME,
      appDesc: APP_DESCRIPTION,
      favicon: './src/assets/icon.svg'
    } ),
    new SizePlugin( {
      stripHash: file => file.replace( /^(\w+)(\.\w+)(\.\w+)/, ( _, name, hash, ext ) => [ name, ext ].join( '' ) )
    } ),
    new BundleAnalyzerPlugin( {
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundleSizeReport.html',
    } ),
  ],
};
