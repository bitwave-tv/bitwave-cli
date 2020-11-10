const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.ts',
    plugins: [
        new webpack.ProgressPlugin(),
        new webpack.BannerPlugin({banner: "#!/usr/bin/env node", raw: true}),
    ],

    output: {
        filename: "bitwave-cli.js"
    },

    target: "async-node",

    module: {
        rules: [{
            test: /\.(ts)$/,
            loader: 'ts-loader',
            include: [path.resolve(__dirname, 'src')],
            exclude: [/node_modules/]
        }]
    },

    resolve: {
        extensions: ['.ts', '.js']
    },
}
