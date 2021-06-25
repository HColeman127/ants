const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');


/* module.exports = {
  entry: './src/index.ts',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        parse: {
          bare_returns: true
        },
        compress: {
          hoist_funs: true,
          hoist_vars: true,
          inline: true,
          keep_fargs: false,
          passes: 50,
          pure_getters: true,
          toplevel: true,
          unsafe: true,
          unsafe_arrows: true,
          unsafe_comps: true,
          unsafe_methods: true
        },
        mangle: {
          toplevel: true,
          properties: {
            debug: false
          }
        },
        format: {
          quote_style: 1
        }
      }
    })],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
}; */

var config = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.devtool = 'source-map';
  }

  if (argv.mode === 'production') {
    config.optimization = {
      minimize: true,
      minimizer: [new TerserPlugin({
        terserOptions: {
          parse: {
            bare_returns: true
          },
          compress: {
            hoist_funs: true,
            hoist_vars: true,
            inline: true,
            keep_fargs: false,
            passes: 50,
            pure_getters: true,
            toplevel: true,
            unsafe: true,
            unsafe_arrows: true,
            unsafe_comps: true,
            unsafe_methods: true
          },
          mangle: {
            toplevel: true,
            properties: {
              debug: false
            }
          },
          format: {
            quote_style: 1
          }
        }
      })],
    };
  }

  return config;
};