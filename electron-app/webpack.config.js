const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/game/main.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@components': path.resolve(__dirname, 'src/game/components'),
    },
  },
  output: {
    filename: 'game.bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'window',
    },
  },
  devtool: 'source-map',
  target: 'web',
  externals: {
    'pixi.js': 'PIXI',
  },
};
