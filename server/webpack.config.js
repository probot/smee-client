const path = require('path')
const webpack = require('webpack')
const autoprefixer = require('autoprefixer')
const glob = require('glob-all')
const PurifyCSSPlugin = require('purifycss-webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const devMode = process.env.NODE_ENV !== 'production'

const browsers = [
  'last 2 versions',
  'ios_saf >= 8',
  'ie >= 10',
  'chrome >= 49',
  'firefox >= 49',
  '> 1%'
]

const cfg = {
  entry: {
    main: path.resolve(__dirname, 'src', 'main.js')
  },
  output: {
    path: path.join(__dirname, 'public'),
    filename: '[name].min.js',
    publicPath: '/'
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    // new webpack.optimize.UglifyJsPlugin(),
    new MiniCssExtractPlugin('[name].min.css')
  ],
  module: {
    rules: [{
      test: /\.jsx?$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader'
      }
    }, {
      test: /\.scss$/,
      use: [
        devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
        'css-loader',
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: true,
            plugins: () => [autoprefixer(browsers)]
          }
        }, {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            includePaths: [
              'node_modules'
            ]
          }
        }
      ]
    }]
  }
}

if (process.env.NODE_ENV === 'production') {
  cfg.plugins.push(new PurifyCSSPlugin({
    minimize: true,
    moduleExtensions: ['.js'],
    paths: glob.sync([
      path.join(__dirname, 'src', '**/*.js'),
      path.join(__dirname, 'public', '*.html')
    ])
  }))
}

module.exports = cfg
