const nodeExternals = require('webpack-node-externals');

module.exports = function (options, webpack) {
  const plugins = [
    ...options.plugins,
    new webpack.HotModuleReplacementPlugin(),
    new webpack.WatchIgnorePlugin({
      paths: [
        /\.js\.map$/, 
        /^_/, 
        /pg-cloudflare/
      ]
    })
  ];

  // Only add RunScriptWebpackPlugin if available
  try {
    const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');
    plugins.push(new RunScriptWebpackPlugin({ 
      name: options.output.filename,
      autoRestart: false
    }));
  } catch (e) {
    console.log('run-script-webpack-plugin not found, hot reload will be disabled');
  }

  return {
    ...options,
    entry: ['webpack/hot/poll?100', options.entry],
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    plugins,
    resolve: {
      ...options.resolve,
      alias: {
        ...options.resolve?.alias,
        'pg-cloudflare': false,
        'cloudflare:sockets': false,
      },
      fallback: {
        ...options.resolve?.fallback,
        net: false,
        tls: false,
        dns: false,
        fs: false,
        path: false,
        'pg-native': false,
      },
    },
  };
};
