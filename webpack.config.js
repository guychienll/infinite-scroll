const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const DIST_DIR = path.join(__dirname, "/dist");
const SRC_DIR = path.join(__dirname, "/src");
const PUBLIC_DIR = path.join(__dirname, "/public");

module.exports = {
    entry: path.join(SRC_DIR, "/index.js"),
    output: {
        path: DIST_DIR,
        filename: "bundle.[contenthash].js",
    },
    module: {
        rules: [
            {
                test: /.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
            },
            {
                test: /\.s[ac]ss$/i,
                use: ["style-loader", "css-loader", "sass-loader"],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: "index.html",
            template: path.join(PUBLIC_DIR, "/index.html"),
        }),
    ],
    devServer: {
        port: 3000,
        open: true,
    },
};
