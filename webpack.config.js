const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    mode: 'production',
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

    optimization: {
        minimizer: [new TerserPlugin()],

        splitChunks: {
            cacheGroups: {
                vendors: {
                    priority: -10,
                    test: /[\\/]node_modules[\\/]/
                }
            },

            chunks: 'async',
            minChunks: 1,
            minSize: 30000,
            name: false
        }
    }
}