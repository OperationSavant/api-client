//@ts-check

'use strict';

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

/**@type {import('webpack').Configuration}*/
const config = {
	target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

	entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
	output: {
		// the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, 'dist'),
		filename: 'extension.js',
		libraryTarget: 'commonjs2',
	},
	externals: {
		vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
		// modules added here also need to be added in the .vscodeignore file
	},
	resolve: {
		// support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
		extensions: ['.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
					},
				],
			},
		],
	},
	devtool: 'nosources-source-map',
	infrastructureLogging: {
		level: 'log', // enables logging required for problem matchers
	},
};
const webviewConfig = {
	target: 'web',
	mode: 'none',
	entry: './src/webview/main.tsx',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'webview.js',
		libraryTarget: 'module',
	},
	experiments: {
		outputModule: true,
	},
	resolve: {
		extensions: ['.ts', '.js', '.tsx', '.css'],
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
		fallback: {
			process: false,
		},
	},
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
					},
				],
			},
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								config: path.resolve(__dirname, 'postcss.config.mjs'),
							},
						},
					},
				],
			},
		],
	},
	plugins: [
		new (require('webpack').ProvidePlugin)({
			process: 'process/browser',
		}),
		new MiniCssExtractPlugin({
			filename: 'webview.css',
		}),
	],
};

module.exports = [config, webviewConfig];

